import { useRef, useCallback, useState, useEffect } from 'react'

// Preload images for wheel segments
function preloadImages(items) {
  return Promise.all(
    items.map(
      (item) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ ...item, image: img })
          img.onerror = () => resolve({ ...item, image: null })
          img.src = `./assets/img/${item.filename}`
        })
    )
  )
}

// Minimum flick velocity (radians/ms) to trigger a spin
const FLICK_THRESHOLD = 0.0025
// Friction for free-spin deceleration (multiplied each frame)
const FRICTION = 0.985
// Velocity below which the wheel stops (radians/ms)
const STOP_VELOCITY = 0.0003

// Exponential ease-out: fast start, smooth continuous deceleration
function multiPhaseEase(t) {
  if (t >= 1) return 1
  return 1 - Math.pow(2, -10 * t)
}

export function useSpinWheel() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const angleRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [winner, setWinner] = useState(null)
  const [loadedItems, setLoadedItems] = useState([])
  const itemsRef = useRef([])
  const lastSegmentRef = useRef(-1)
  const bgImageRef = useRef(null)

  // Drag tracking refs
  const isDraggingRef = useRef(false)
  const dragStartAngleRef = useRef(0)
  const dragStartPointerAngleRef = useRef(0)
  const velocityHistoryRef = useRef([]) // { angle, time } samples
  const spinningRef = useRef(false)

  const tickAudioRef = useRef(null)
  const winAudioRef = useRef(null)

  useEffect(() => {
    tickAudioRef.current = new Audio('./assets/audio/countdown.wav')
    tickAudioRef.current.volume = 0.15
    winAudioRef.current = new Audio('./assets/audio/found.wav')
    winAudioRef.current.volume = 0.25
  }, [])

  const loadItems = useCallback(async (enabledItems) => {
    const loaded = await preloadImages(enabledItems)
    setLoadedItems(loaded)
    itemsRef.current = loaded
  }, [])

  const drawWheel = useCallback((ctx, items, angle, width, height) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 20
    const count = items.length

    if (count === 0) return

    const sliceAngle = (2 * Math.PI) / count

    ctx.clearRect(0, 0, width, height)
    ctx.save()

    // Outer rim
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#b8860b'
    ctx.lineWidth = 3
    ctx.stroke()

    // Segments
    for (let i = 0; i < count; i++) {
      const startAngle = angle + i * sliceAngle
      const endAngle = startAngle + sliceAngle

      const colors = [
        '#1a3a1a', '#2e1810', '#0f2b3a', '#2e0f1a',
        '#1e2e0f', '#0f1a2e', '#2e1a2e', '#1e0f0f',
      ]
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = '#b8860b'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Icon
      ctx.save()
      const midAngle = startAngle + sliceAngle / 2
      ctx.translate(centerX, centerY)
      ctx.rotate(midAngle)

      const scaleFactor = Math.min(2.5, Math.max(1, 30 / count))
      const iconSize = Math.min(48 * scaleFactor, radius * 0.12 * scaleFactor)
      const iconDist = radius * 0.82
      if (items[i].image) {
        ctx.drawImage(
          items[i].image,
          iconDist - iconSize / 2,
          -iconSize / 2,
          iconSize,
          iconSize
        )
      }
      ctx.restore()
    }

    // Center hub
    const hubRadius = radius * 0.12
    const hubGrad = ctx.createRadialGradient(
      centerX, centerY, 0, centerX, centerY, hubRadius
    )
    hubGrad.addColorStop(0, '#ffd700')
    hubGrad.addColorStop(0.7, '#b8860b')
    hubGrad.addColorStop(1, '#8b6914')
    ctx.beginPath()
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.fill()
    ctx.strokeStyle = '#654321'
    ctx.lineWidth = 2
    ctx.stroke()

    // Pegs
    for (let i = 0; i < count; i++) {
      const pegAngle = angle + i * sliceAngle
      const pegX = centerX + Math.cos(pegAngle) * radius
      const pegY = centerY + Math.sin(pegAngle) * radius
      ctx.beginPath()
      ctx.arc(pegX, pegY, 4, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffd700'
      ctx.fill()
      ctx.strokeStyle = '#8b6914'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.restore()

    // Pointer
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 18)
    ctx.lineTo(centerX - 14, centerY - radius - 38)
    ctx.lineTo(centerX + 14, centerY - radius - 38)
    ctx.closePath()
    const pointerGrad = ctx.createLinearGradient(
      centerX, centerY - radius - 38, centerX, centerY - radius - 18
    )
    pointerGrad.addColorStop(0, '#ffd700')
    pointerGrad.addColorStop(1, '#ff8c00')
    ctx.fillStyle = pointerGrad
    ctx.fill()
    ctx.strokeStyle = '#8b6914'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }, [])

  // Get the angle from canvas center to a pointer position
  const getPointerAngle = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const rect = canvas.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    return Math.atan2(clientY - centerY, clientX - centerX)
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawWheel(ctx, itemsRef.current, angleRef.current, canvas.width, canvas.height)
  }, [drawWheel])

  // Update the background image element directly (bypasses React render)
  const updateBgImage = (item) => {
    if (bgImageRef.current) {
      if (item) {
        bgImageRef.current.src = `./assets/img/${item.filename}`
        bgImageRef.current.style.display = 'block'
      } else {
        bgImageRef.current.style.display = 'none'
      }
    }
  }

  // Play tick when crossing segment boundaries
  const playTickIfNeeded = useCallback((currentAngle, isDecelerating) => {
    const items = itemsRef.current
    const count = items.length
    if (count === 0) return

    const sliceAngle = (2 * Math.PI) / count
    const pointerAngle =
      (((-currentAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
      (2 * Math.PI)
    const currentSegment = Math.floor(pointerAngle / sliceAngle) % count

    if (currentSegment !== lastSegmentRef.current) {
      lastSegmentRef.current = currentSegment
      updateBgImage(items[currentSegment])
      if (tickAudioRef.current) {
        const tick = tickAudioRef.current.cloneNode()
        tick.volume = isDecelerating ? 0.15 : 0.08
        tick.play().catch(() => {})
      }
    }
  }, [])

  // Determine winner from current angle
  const getWinnerAtCurrentAngle = useCallback(() => {
    const items = itemsRef.current
    const count = items.length
    if (count === 0) return null

    const sliceAngle = (2 * Math.PI) / count
    const finalPointer =
      (((-angleRef.current - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
      (2 * Math.PI)
    const landedIndex = Math.floor(finalPointer / sliceAngle) % count
    return items[landedIndex]
  }, [])

  // --- Drag handlers ---

  const onDragStart = useCallback((clientX, clientY) => {
    if (spinningRef.current) return

    // Cancel any ongoing deceleration
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }

    isDraggingRef.current = true
    setDragging(true)
    dragStartAngleRef.current = angleRef.current
    dragStartPointerAngleRef.current = getPointerAngle(clientX, clientY)
    velocityHistoryRef.current = [{ angle: angleRef.current, time: performance.now() }]
  }, [getPointerAngle])

  const onDragMove = useCallback((clientX, clientY) => {
    if (!isDraggingRef.current) return

    const currentPointerAngle = getPointerAngle(clientX, clientY)
    const delta = currentPointerAngle - dragStartPointerAngleRef.current

    angleRef.current = dragStartAngleRef.current + delta
    redraw()
    playTickIfNeeded(angleRef.current, false)

    // Record for velocity calculation (keep last ~5 samples)
    const now = performance.now()
    velocityHistoryRef.current.push({ angle: angleRef.current, time: now })
    if (velocityHistoryRef.current.length > 6) {
      velocityHistoryRef.current.shift()
    }
  }, [getPointerAngle, redraw, playTickIfNeeded])

  const onDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setDragging(false)

    // Calculate flick velocity from recent samples
    const history = velocityHistoryRef.current
    if (history.length < 2) return

    const recent = history[history.length - 1]
    const older = history[Math.max(0, history.length - 4)]
    const dt = recent.time - older.time
    if (dt === 0) return

    const velocity = (recent.angle - older.angle) / dt // radians per ms

    if (Math.abs(velocity) > FLICK_THRESHOLD) {
      // Flick detected — use the same spin logic as the button
      // but inherit the flick direction
      const items = itemsRef.current
      const count = items.length
      if (count === 0) return

      spinningRef.current = true
      setSpinning(true)
      setWinner(null)

      const sliceAngle = (2 * Math.PI) / count
      const direction = velocity > 0 ? 1 : -1

      // Pick winner using weighted random
      const weightedArr = items.reduce((arr, item) => {
        for (let i = 0; i < item.weight; i++) arr.push(item)
        return arr
      }, [])
      const chosenWinner = weightedArr[Math.floor(Math.random() * weightedArr.length)]
      const winnerIndex = items.findIndex((i) => i.name === chosenWinner.name)

      const jitter = (Math.random() - 0.5) * sliceAngle * 0.7
      const desiredFinal = -Math.PI / 2 - winnerIndex * sliceAngle - sliceAngle / 2 + jitter
      const normalizedTarget = ((desiredFinal % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      const normalizedCurrent = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

      // Scale rotations and duration based on flick speed
      // absVelocity ranges roughly from FLICK_THRESHOLD (~0.0025) to ~0.05 for a hard flick
      const absVelocity = Math.abs(velocity)
      const speedFactor = Math.min(1, (absVelocity - FLICK_THRESHOLD) / 0.03) // 0 to 1
      const minRotations = 1.5
      const maxRotations = 10
      const rotations = minRotations + speedFactor * (maxRotations - minRotations) + Math.random()
      const fullRotations = rotations * 2 * Math.PI

      let angleDiff = ((normalizedTarget - normalizedCurrent) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      // Ensure spin goes in the flick direction
      if (direction < 0) angleDiff = angleDiff - 2 * Math.PI
      const totalAngle = direction * fullRotations + angleDiff

      const startAngle = angleRef.current
      // Duration: gentle flick ~7s, hard flick ~12s
      const minDuration = 7000
      const maxDuration = 12000
      const duration = minDuration + speedFactor * (maxDuration - minDuration) + Math.random() * 500
      const startTime = performance.now()
      lastSegmentRef.current = -1

      const animate = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = multiPhaseEase(progress)
        const currentAngle = startAngle + totalAngle * eased
        angleRef.current = currentAngle
        redraw()

        const pointerAngle =
          (((-currentAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI)
        const currentSegment = Math.floor(pointerAngle / sliceAngle) % count
        if (currentSegment !== lastSegmentRef.current) {
          lastSegmentRef.current = currentSegment
          updateBgImage(items[currentSegment])
          if (tickAudioRef.current && progress < 0.95) {
            const tick = tickAudioRef.current.cloneNode()
            tick.volume = Math.min(0.2, 0.05 + progress * 0.15)
            tick.play().catch(() => {})
          }
        }

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate)
        } else {
          animRef.current = null
          spinningRef.current = false
          const finalAngle = startAngle + totalAngle
          const finalPointer =
            (((-finalAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
            (2 * Math.PI)
          const landedIndex = Math.floor(finalPointer / sliceAngle) % count
          const actualWinner = items[landedIndex]

          setWinner(actualWinner)
          setSpinning(false)
          updateBgImage(null)
          if (winAudioRef.current) {
            winAudioRef.current.currentTime = 0
            winAudioRef.current.play().catch(() => {})
          }
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }
  }, [redraw, playTickIfNeeded, getWinnerAtCurrentAngle])

  // --- Button spin (fallback) ---

  const spin = useCallback((enabledItems) => {
    if (spinningRef.current || enabledItems.length === 0) return

    spinningRef.current = true
    setSpinning(true)
    setWinner(null)

    const items = itemsRef.current
    const count = items.length
    if (count === 0) return

    const sliceAngle = (2 * Math.PI) / count

    // Pick winner using weighted random
    const weightedArr = enabledItems.reduce((arr, item) => {
      for (let i = 0; i < item.weight; i++) arr.push(item)
      return arr
    }, [])
    const chosenWinner = weightedArr[Math.floor(Math.random() * weightedArr.length)]
    const winnerIndex = items.findIndex((i) => i.name === chosenWinner.name)

    const jitter = (Math.random() - 0.5) * sliceAngle * 0.7
    const desiredFinal = -Math.PI / 2 - winnerIndex * sliceAngle - sliceAngle / 2 + jitter
    const normalizedTarget = ((desiredFinal % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const normalizedCurrent = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const fullRotations = (6 + Math.random() * 4) * 2 * Math.PI
    const angleDiff = ((normalizedTarget - normalizedCurrent) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const totalAngle = fullRotations + angleDiff

    const startAngle = angleRef.current
    const duration = 8000 + Math.random() * 4000
    const startTime = performance.now()
    lastSegmentRef.current = -1

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = multiPhaseEase(progress)
      const currentAngle = startAngle + totalAngle * eased
      angleRef.current = currentAngle

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      drawWheel(ctx, items, currentAngle, canvas.width, canvas.height)

      const pointerAngle =
        (((-currentAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
        (2 * Math.PI)
      const currentSegment = Math.floor(pointerAngle / sliceAngle) % count
      if (currentSegment !== lastSegmentRef.current) {
        lastSegmentRef.current = currentSegment
        updateBgImage(items[currentSegment])
        if (tickAudioRef.current && progress < 0.95) {
          const tick = tickAudioRef.current.cloneNode()
          tick.volume = Math.min(0.2, 0.05 + progress * 0.15)
          tick.play().catch(() => {})
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        animRef.current = null
        spinningRef.current = false
        const finalAngle = startAngle + totalAngle
        const finalPointer =
          (((-finalAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI)
        const landedIndex = Math.floor(finalPointer / sliceAngle) % count
        const actualWinner = items[landedIndex]

        setWinner(actualWinner)
        setSpinning(false)
        updateBgImage(null)
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0
          winAudioRef.current.play().catch(() => {})
        }
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [drawWheel])

  const dismissWinner = useCallback(() => {
    setWinner(null)
  }, [])

  // Debug: slowest possible spin (1.5 rotations, 3.5s)
  const debugSlowSpin = useCallback(() => {
    if (spinningRef.current) return
    const items = itemsRef.current
    const count = items.length
    if (count === 0) return

    spinningRef.current = true
    setSpinning(true)
    setWinner(null)

    const sliceAngle = (2 * Math.PI) / count
    const weightedArr = items.reduce((arr, item) => {
      for (let i = 0; i < item.weight; i++) arr.push(item)
      return arr
    }, [])
    const chosenWinner = weightedArr[Math.floor(Math.random() * weightedArr.length)]
    const winnerIndex = items.findIndex((i) => i.name === chosenWinner.name)

    const jitter = (Math.random() - 0.5) * sliceAngle * 0.7
    const desiredFinal = -Math.PI / 2 - winnerIndex * sliceAngle - sliceAngle / 2 + jitter
    const normalizedTarget = ((desiredFinal % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const normalizedCurrent = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

    const fullRotations = 1.5 * 2 * Math.PI
    let angleDiff = ((normalizedTarget - normalizedCurrent) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    const totalAngle = fullRotations + angleDiff

    const startAngle = angleRef.current
    const duration = 5000
    const startTime = performance.now()
    lastSegmentRef.current = -1

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = multiPhaseEase(progress)
      const currentAngle = startAngle + totalAngle * eased
      angleRef.current = currentAngle
      redraw()

      const pointerAngle =
        (((-currentAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
        (2 * Math.PI)
      const currentSegment = Math.floor(pointerAngle / sliceAngle) % count
      if (currentSegment !== lastSegmentRef.current) {
        lastSegmentRef.current = currentSegment
        if (tickAudioRef.current && progress < 0.95) {
          const tick = tickAudioRef.current.cloneNode()
          tick.volume = Math.min(0.2, 0.05 + progress * 0.15)
          tick.play().catch(() => {})
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        animRef.current = null
        spinningRef.current = false
        const finalAngle = startAngle + totalAngle
        const finalPointer =
          (((-finalAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI)
        const landedIndex = Math.floor(finalPointer / sliceAngle) % count
        setWinner(items[landedIndex])
        setSpinning(false)
        updateBgImage(null)
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0
          winAudioRef.current.play().catch(() => {})
        }
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }, [redraw])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  return {
    canvasRef,
    spinning,
    dragging,
    winner,
    bgImageRef,
    loadedItems,
    loadItems,
    drawWheel,
    spin,
    dismissWinner,
    angleRef,
    debugSlowSpin,
    onDragStart,
    onDragMove,
    onDragEnd,
  }
}
