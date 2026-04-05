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

export function useSpinWheel() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const angleRef = useRef(0)
  const velocityRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [loadedItems, setLoadedItems] = useState([])
  const itemsRef = useRef([])
  const lastSegmentRef = useRef(-1)

  const tickAudioRef = useRef(null)
  const winAudioRef = useRef(null)

  // Initialize audio
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

    // Draw outer rim glow
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#b8860b'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw segments
    for (let i = 0; i < count; i++) {
      const startAngle = angle + i * sliceAngle
      const endAngle = startAngle + sliceAngle

      // Alternate colors
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

      // Segment border
      ctx.strokeStyle = '#b8860b'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Draw icon in segment
      ctx.save()
      const midAngle = startAngle + sliceAngle / 2
      ctx.translate(centerX, centerY)
      ctx.rotate(midAngle)

      // Scale factor: larger when fewer items (baseline ~30 items)
      const scaleFactor = Math.min(2.5, Math.max(1, 30 / count))

      // Icon
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
      centerX, centerY, 0,
      centerX, centerY, hubRadius
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

    // Decorative pegs on rim
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

    // Pointer (top center, pointing down)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 18)
    ctx.lineTo(centerX - 14, centerY - radius - 38)
    ctx.lineTo(centerX + 14, centerY - radius - 38)
    ctx.closePath()
    const pointerGrad = ctx.createLinearGradient(
      centerX, centerY - radius - 38,
      centerX, centerY - radius - 18
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

  const spin = useCallback((enabledItems) => {
    if (spinning || enabledItems.length === 0) return

    setSpinning(true)
    setWinner(null)

    const items = itemsRef.current
    const count = items.length
    if (count === 0) return

    // Pick winner using weighted random
    const weightedArr = enabledItems.reduce((arr, item) => {
      for (let i = 0; i < item.weight; i++) arr.push(item)
      return arr
    }, [])
    const chosenWinner =
      weightedArr[Math.floor(Math.random() * weightedArr.length)]
    const winnerIndex = items.findIndex((i) => i.name === chosenWinner.name)

    // Calculate target angle so winner lands at top (pointer)
    const sliceAngle = (2 * Math.PI) / count
    // The pointer is at -PI/2 (top). We need the midpoint of winnerIndex's slice at that angle.
    const targetMid = -Math.PI / 2 - winnerIndex * sliceAngle - sliceAngle / 2
    // Add several full rotations for dramatic effect
    const fullRotations = (6 + Math.random() * 4) * 2 * Math.PI
    const currentAngle = angleRef.current % (2 * Math.PI)
    const targetAngle = targetMid - currentAngle + fullRotations

    const startAngle = angleRef.current
    const totalAngle = targetAngle
    const duration = 4000 + Math.random() * 2000
    const startTime = performance.now()

    lastSegmentRef.current = -1

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentAngle = startAngle + totalAngle * eased
      angleRef.current = currentAngle

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')

      drawWheel(ctx, items, currentAngle, canvas.width, canvas.height)

      // Tick sound when crossing segment boundaries
      const normalizedAngle =
        (((-currentAngle - Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) %
        (2 * Math.PI)
      const currentSegment = Math.floor(normalizedAngle / sliceAngle) % count
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
        // Done spinning
        setWinner(chosenWinner)
        setSpinning(false)
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0
          winAudioRef.current.play().catch(() => {})
        }
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [spinning, drawWheel])

  const dismissWinner = useCallback(() => {
    setWinner(null)
  }, [])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  return {
    canvasRef,
    spinning,
    winner,
    loadedItems,
    loadItems,
    drawWheel,
    spin,
    dismissWinner,
    angleRef,
  }
}
