import { useState, useEffect, useCallback, useMemo } from 'react'
import bossData from '../data/bosses'
import skillData from '../data/skills'
import { WheelType } from '../data/constants'

export function useWheelItems(wheelType) {
  const [items, setItems] = useState([])

  const baseItems = useMemo(() => {
    switch (wheelType) {
      case WheelType.BOSS:
        return bossData
          .filter((b) => b.isSlayer !== true)
          .map((b) => ({ ...b, enabled: true }))
      case WheelType.SOTW:
        return skillData.map((s) => ({ ...s, enabled: true }))
      case WheelType.BOTW:
        return bossData
          .filter((b) => b.name !== 'Slayer Boss')
          .map((b) => ({ ...b, enabled: true }))
      default:
        return []
    }
  }, [wheelType])

  // Load from localStorage, merging with base data
  useEffect(() => {
    const stored = localStorage.getItem(wheelType)
    if (stored && stored !== 'undefined') {
      const parsed = JSON.parse(stored)
      const merged = baseItems.map((item) => {
        const found = parsed.find((p) => p.name === item.name)
        return { ...item, enabled: found ? found.enabled : item.enabled }
      })
      setItems(merged)
    } else {
      setItems(baseItems)
    }
  }, [wheelType, baseItems])

  // Save to localStorage on change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(wheelType, JSON.stringify(items))
    }
  }, [items, wheelType])

  const enabledItems = useMemo(
    () => items.filter((i) => i.enabled),
    [items]
  )

  const toggleItem = useCallback((name, enabled) => {
    setItems((prev) =>
      prev.map((i) => (i.name === name ? { ...i, enabled } : i))
    )
  }, [])

  const enableAll = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, enabled: true })))
  }, [])

  const disableAll = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, enabled: false })))
  }, [])

  return { items, enabledItems, toggleItem, enableAll, disableAll }
}
