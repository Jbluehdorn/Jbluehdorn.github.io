import { useState, useCallback, useRef, useEffect } from 'react'

// Total roll duration in ms
const ROLL_DURATION = 7500
// Total number of value changes during the roll
const TOTAL_STEPS = 80

// Exponential ease-out: fast start, smooth deceleration
function easeOutExpo(t) {
  return 1 - Math.pow(2, -10 * t)
}

export function useDiceRoll() {
  const [min, setMin] = useState(() => {
    const stored = localStorage.getItem('dice_min')
    return stored ? parseInt(stored, 10) : 1
  })

  const [max, setMax] = useState(() => {
    const stored = localStorage.getItem('dice_max')
    return stored ? parseInt(stored, 10) : 28
  })

  const [value, setValue] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [rigged, setRigged] = useState(false)
  const [sinceCount, setSinceCount] = useState(() => {
    const stored = parseInt(localStorage.getItem('sinceCount'), 10)
    return isNaN(stored) ? 0 : stored
  })
  const [hasRolled, setHasRolled] = useState(false)
  const [shakeIntensity, setShakeIntensity] = useState(0)

  const rollingRef = useRef(false)
  const animRef = useRef(null)
  const tickAudioRef = useRef(null)
  const winAudioRef = useRef(null)

  useEffect(() => {
    tickAudioRef.current = new Audio('./assets/audio/countdown.wav')
    tickAudioRef.current.volume = 0.15
    winAudioRef.current = new Audio('./assets/audio/found.wav')
    winAudioRef.current.volume = 0.25
  }, [])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  // Persist min/max to localStorage
  useEffect(() => {
    localStorage.setItem('dice_min', min.toString())
  }, [min])

  useEffect(() => {
    localStorage.setItem('dice_max', max.toString())
  }, [max])

  const updateMin = useCallback((newMin) => {
    const parsed = parseInt(newMin, 10)
    if (!isNaN(parsed)) setMin(parsed)
  }, [])

  const updateMax = useCallback((newMax) => {
    const parsed = parseInt(newMax, 10)
    if (!isNaN(parsed)) setMax(parsed)
  }, [])

  const validateMin = useCallback(() => {
    if (min >= max) setMin(max - 1)
    if (min < 0) setMin(0)
  }, [min, max])

  const validateMax = useCallback(() => {
    if (max <= min) setMax(min + 1)
  }, [min, max])

  const toggleRig = useCallback((rig) => {
    setRigged(rig)
  }, [])

  const resetSinceCount = useCallback(() => {
    setSinceCount(0)
    localStorage.setItem('sinceCount', '0')
  }, [])

  const roll = useCallback(() => {
    if (rollingRef.current) return
    rollingRef.current = true
    setRolling(true)
    setShakeIntensity(1)

    const startTime = performance.now()
    let lastStep = -1

    // Pre-generate random values for each step, with the final value truly random
    const range = max - min + 1
    const stepValues = Array.from({ length: TOTAL_STEPS }, () =>
      Math.floor(Math.random() * range + min)
    )

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / ROLL_DURATION, 1)
      const eased = easeOutExpo(progress)

      // Shake decays: full intensity at start, zero at end
      setShakeIntensity(1 - eased)

      // Map eased progress to a step index
      const step = Math.min(Math.floor(eased * TOTAL_STEPS), TOTAL_STEPS - 1)

      if (step !== lastStep) {
        lastStep = step
        setValue(stepValues[step])

        // Tick sound — louder as it slows, skip last few ticks
        if (tickAudioRef.current && progress < 0.92) {
          const tick = tickAudioRef.current.cloneNode()
          tick.volume = Math.min(0.2, 0.05 + progress * 0.15)
          tick.play().catch(() => {})
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        animRef.current = null
        rollingRef.current = false
        setRolling(false)
        setShakeIntensity(0)
        setHasRolled(true)

        const newCount = sinceCount + 1
        setSinceCount(newCount)
        localStorage.setItem('sinceCount', newCount.toString())

        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0
          winAudioRef.current.play().catch(() => {})
        }
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [min, max, sinceCount])

  return {
    min,
    max,
    value,
    rolling,
    rigged,
    sinceCount,
    hasRolled,
    shakeIntensity,
    updateMin,
    updateMax,
    validateMin,
    validateMax,
    toggleRig,
    resetSinceCount,
    roll,
  }
}
