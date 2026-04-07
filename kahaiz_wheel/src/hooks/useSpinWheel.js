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
const FLICK_THRESHOLD = 0.002

const DEFAULT_PHYSICS = {
  friction: 0.00027,
  pegDragPerRev: 0.0057,
  flickMultiplier: 2,
  stopVelocity: 0.000072,
}

// Pointer wobble spring parameters
const POINTER_SPRING = 600
const POINTER_DAMPING = 16
const POINTER_RESIST = 0.08    // immediate angular deflection against spin
const POINTER_MAX_ANGLE = 0.22 // max deflection in radians (~12.6°)
const POINTER_MAX_VEL = 20     // cap velocity to prevent runaway
const PEG_NUDGE = 0.0001       // small wheel velocity nudge per peg (spin direction)

function stepPointerDeflection(deflection, now) {
  if (deflection.lastTime === 0) {
    deflection.lastTime = now
    return deflection.angle
  }
  const dt = Math.min((now - deflection.lastTime) / 1000, 0.03)
  deflection.lastTime = now

  const accel = -POINTER_SPRING * deflection.angle - POINTER_DAMPING * deflection.velocity
  deflection.velocity += accel * dt
  deflection.velocity = Math.max(-POINTER_MAX_VEL, Math.min(POINTER_MAX_VEL, deflection.velocity))
  deflection.angle += deflection.velocity * dt
  deflection.angle = Math.max(-POINTER_MAX_ANGLE, Math.min(POINTER_MAX_ANGLE, deflection.angle))

  if (Math.abs(deflection.angle) < 0.001 && Math.abs(deflection.velocity) < 0.01) {
    deflection.angle = 0
    deflection.velocity = 0
  }
  return deflection.angle
}

export function useSpinWheel({ playTick, playFound }) {
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
  const currentSegmentImageRef = useRef(null)
  const pointerDeflectionRef = useRef({ angle: 0, velocity: 0, lastTime: 0 })
  const prevWheelAngleRef = useRef(0)

  // Drag tracking refs
  const isDraggingRef = useRef(false)
  const dragStartAngleRef = useRef(0)
  const dragStartPointerAngleRef = useRef(0)
  const velocityHistoryRef = useRef([]) // { angle, time } samples
  const spinningRef = useRef(false)
  const velocityRef = useRef(0) // current angular velocity (rad/ms)
  const lastFrameTimeRef = useRef(0)
  const physicsRef = useRef({ ...DEFAULT_PHYSICS })

  // Keep stable refs to audio callbacks so animation closures always get latest
  const playTickRef = useRef(playTick)
  const playFoundRef = useRef(playFound)
  useEffect(() => { playTickRef.current = playTick }, [playTick])
  useEffect(() => { playFoundRef.current = playFound }, [playFound])

  const loadItems = useCallback(async (enabledItems) => {
    // Cancel any running animation and reset wheel to default position
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    angleRef.current = 0
    spinningRef.current = false
    setSpinning(false)
    setWinner(null)

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

      const fallbackColors = [
        '#1a3a1a', '#2e1810', '#0f2b3a', '#2e0f1a',
        '#1e2e0f', '#0f1a2e', '#2e1a2e', '#1e0f0f',
      ]
      let sliceColor
      // Skills (no isSlayer property) use darkened item color
      if (items[i].color && items[i].isSlayer === undefined) {
        const ic = items[i].color
        const r = parseInt(ic.slice(1, 3), 16)
        const g = parseInt(ic.slice(3, 5), 16)
        const b = parseInt(ic.slice(5, 7), 16)
        sliceColor = `rgb(${Math.round(r * 0.25)}, ${Math.round(g * 0.25)}, ${Math.round(b * 0.25)})`
      } else {
        sliceColor = fallbackColors[i % fallbackColors.length]
      }

      // Define the wedge path
      const wedgePath = () => {
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()
      }

      // Base fill
      wedgePath()
      ctx.fillStyle = sliceColor
      ctx.fill()

      // Giant icon clipped to wedge
      if (items[i].image) {
        ctx.save()
        wedgePath()
        ctx.clip()

        const midAngle = startAngle + sliceAngle / 2
        const iconSize = radius * 1.3
        const iconDist = radius * 0.5
        const iconX = centerX + Math.cos(midAngle) * iconDist
        const iconY = centerY + Math.sin(midAngle) * iconDist

        ctx.translate(iconX, iconY)
        ctx.rotate(midAngle + Math.PI / 2)
        ctx.drawImage(
          items[i].image,
          -iconSize / 2,
          -iconSize / 2,
          iconSize,
          iconSize
        )
        ctx.restore()

        // Color overlay
        ctx.save()
        wedgePath()
        ctx.fillStyle = sliceColor
        ctx.globalAlpha = 0.9
        ctx.fill()
        ctx.restore()
      }

      // Wedge border
      wedgePath()
      ctx.strokeStyle = '#b8860b'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Small clear icon at outer edge
      if (items[i].image) {
        ctx.save()
        const midAngle = startAngle + sliceAngle / 2
        const scaleFactor = Math.min(2.5, Math.max(1, 30 / count))
        const smallSize = Math.min(48 * scaleFactor, radius * 0.12 * scaleFactor)
        const smallDist = radius * 0.82
        const smallX = centerX + Math.cos(midAngle) * smallDist
        const smallY = centerY + Math.sin(midAngle) * smallDist

        ctx.translate(smallX, smallY)
        ctx.rotate(midAngle + Math.PI / 2)
        ctx.drawImage(
          items[i].image,
          -smallSize / 2,
          -smallSize / 2,
          smallSize,
          smallSize
        )
        ctx.restore()
      }
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

    // Pointer (with wobble deflection)
    const deflection = stepPointerDeflection(
      pointerDeflectionRef.current,
      performance.now()
    )
    ctx.save()
    const pivotX = centerX
    const pivotY = centerY - radius - 38
    ctx.translate(pivotX, pivotY)
    ctx.rotate(deflection)
    ctx.translate(-pivotX, -pivotY)
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

  // Update the current segment image for the center hub
  const updateBgImage = (item) => {
    currentSegmentImageRef.current = item ? item.image : null
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
      const dir = Math.sign(currentAngle - prevWheelAngleRef.current) || 1
      pointerDeflectionRef.current.angle = POINTER_RESIST * -dir
      pointerDeflectionRef.current.velocity = 0
      prevWheelAngleRef.current = currentAngle
      playTickRef.current()
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
    // Cancel any ongoing spin animation — user is grabbing the wheel
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    spinningRef.current = false
    velocityRef.current = 0
    setSpinning(false)

    isDraggingRef.current = true
    setDragging(true)
    setWinner(null)
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
      const items = itemsRef.current
      const count = items.length
      if (count === 0) return

      spinningRef.current = true
      setSpinning(true)
      setWinner(null)

      velocityRef.current = velocity * physicsRef.current.flickMultiplier
      lastFrameTimeRef.current = performance.now()
      lastSegmentRef.current = -1

      const sliceAngle = (2 * Math.PI) / count

      const spinDirection = Math.sign(velocity)

      const animate = (now) => {
        const frameDt = now - lastFrameTimeRef.current
        lastFrameTimeRef.current = now
        const { friction, pegDragPerRev } = physicsRef.current
        const pegDrag = pegDragPerRev / count

        // Apply friction: linear (proportional to v) + quadratic (v²) + constant minimum
        velocityRef.current -= velocityRef.current * friction * frameDt
        const quadFriction = 0.015 * velocityRef.current * Math.abs(velocityRef.current) * frameDt
        velocityRef.current -= quadFriction
        const minDecel = 0.0000002 * frameDt
        if (Math.abs(velocityRef.current) > minDecel) {
          velocityRef.current -= spinDirection * minDecel
        }

        // Never go backwards — clamp before updating position
        if (Math.sign(velocityRef.current) !== spinDirection && velocityRef.current !== 0) {
          velocityRef.current = 0
        }

        // Update angle
        angleRef.current += velocityRef.current * frameDt
        redraw()

        // Check for peg crossings
        const pointerAngle =
          (((-angleRef.current - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
          (2 * Math.PI)
        const currentSegment = Math.floor(pointerAngle / sliceAngle) % count
        if (currentSegment !== lastSegmentRef.current) {
          lastSegmentRef.current = currentSegment
          updateBgImage(items[currentSegment])

          // Pointer wobble — deflect against spin, spring creates snap-forward
          const dir = Math.sign(angleRef.current - prevWheelAngleRef.current) || 1
          pointerDeflectionRef.current.angle = POINTER_RESIST * -dir
          pointerDeflectionRef.current.velocity = 0
          prevWheelAngleRef.current = angleRef.current

          // Peg drag + nudge only when wheel is spinning fast enough
          // Below this, let pure friction handle the smooth coast to stop
          const absVel = Math.abs(velocityRef.current)
          if (absVel > 0.001) {
            // Cap peg drag at 8% of current velocity to prevent lurching with few slices
            const effectiveDrag = Math.min(pegDrag, absVel * 0.06)
            velocityRef.current -= spinDirection * effectiveDrag
            velocityRef.current += spinDirection * PEG_NUDGE

            // Clamp again after peg forces
            if (Math.sign(velocityRef.current) !== spinDirection && velocityRef.current !== 0) {
              velocityRef.current = 0
            }
          }

          playTickRef.current()
        }

        // Check if wheel should stop
        if (Math.abs(velocityRef.current) < physicsRef.current.stopVelocity) {
          animRef.current = null
          velocityRef.current = 0

          // Suspense pause before revealing winner
          setTimeout(() => {
            spinningRef.current = false
            const finalPointer =
              (((-angleRef.current - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
              (2 * Math.PI)
            const landedIndex = Math.floor(finalPointer / sliceAngle) % count
            setWinner(items[landedIndex])
            setSpinning(false)
            updateBgImage(null)
            playFoundRef.current()
          }, 1200)
        } else {
          animRef.current = requestAnimationFrame(animate)
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }
  }, [redraw])

  const dismissWinner = useCallback(() => {
    setWinner(null)
  }, [])

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
    loadedItems,
    loadItems,
    drawWheel,
    dismissWinner,
    angleRef,
    onDragStart,
    onDragMove,
    onDragEnd,
  }
}
