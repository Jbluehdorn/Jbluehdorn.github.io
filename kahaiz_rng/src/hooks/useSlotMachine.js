import { useState, useCallback, useRef, useEffect } from 'react'

export function useSlotMachine() {
  const [min, setMin] = useState(() => {
    const stored = localStorage.getItem('slot_min')
    return stored ? parseInt(stored, 10) : 1
  })

  const [max, setMax] = useState(() => {
    const stored = localStorage.getItem('slot_max')
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

  const winAudioRef = useRef(null)

  useEffect(() => {
    winAudioRef.current = new Audio('./assets/audio/found.wav')
    winAudioRef.current.volume = 0.25
  }, [])

  useEffect(() => {
    localStorage.setItem('slot_min', min.toString())
  }, [min])

  useEffect(() => {
    localStorage.setItem('slot_max', max.toString())
  }, [max])

  // Reset stale value when range changes
  useEffect(() => {
    setValue(null)
    setHasRolled(false)
  }, [min, max])

  const updateMin = useCallback((val) => {
    if (typeof val === 'number' && !isNaN(val)) setMin(val)
  }, [])

  const updateMax = useCallback((val) => {
    if (typeof val === 'number' && !isNaN(val) && val <= 999) setMax(val)
  }, [])

  const validateMin = useCallback(() => {
    if (min >= max) setMin(max - 1)
    if (min < 0) setMin(0)
  }, [min, max])

  const validateMax = useCallback(() => {
    if (max <= min) setMax(min + 1)
    if (max > 999) setMax(999)
  }, [min, max])

  const toggleRig = useCallback((rig) => {
    setRigged(rig)
  }, [])

  const resetSinceCount = useCallback(() => {
    setSinceCount(0)
    localStorage.setItem('sinceCount', '0')
  }, [])

  const roll = useCallback(() => {
    if (rolling) return null
    const result = Math.floor(Math.random() * (max - min + 1) + min)
    setValue(result)
    setRolling(true)
    return result
  }, [min, max, rolling])

  const onRollComplete = useCallback(() => {
    setRolling(false)
    setHasRolled(true)
    const newCount = sinceCount + 1
    setSinceCount(newCount)
    localStorage.setItem('sinceCount', newCount.toString())

    if (winAudioRef.current) {
      winAudioRef.current.currentTime = 0
      winAudioRef.current.play().catch(() => {})
    }
  }, [sinceCount])

  return {
    min,
    max,
    value,
    rolling,
    rigged,
    sinceCount,
    hasRolled,
    updateMin,
    updateMax,
    validateMin,
    validateMax,
    toggleRig,
    resetSinceCount,
    roll,
    onRollComplete,
  }
}
