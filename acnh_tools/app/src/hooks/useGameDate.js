import { useState, useEffect, useCallback } from 'react'

export function useGameDate() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [useCustomTime, setUseCustomTime] = useState(false)

  const handleUseCustomTimeChange = useCallback((useCustom) => {
    setUseCustomTime(useCustom)
    if (!useCustom) setCurrentDate(new Date())
  }, [])

  // Tick every minute when using real time
  useEffect(() => {
    if (useCustomTime) return
    const interval = setInterval(() => setCurrentDate(new Date()), 60000)
    return () => clearInterval(interval)
  }, [useCustomTime])

  return { currentDate, setCurrentDate, useCustomTime, setUseCustomTime: handleUseCustomTimeChange }
}
