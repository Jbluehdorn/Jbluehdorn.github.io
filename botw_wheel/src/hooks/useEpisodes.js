import { useState, useEffect, useCallback, useMemo } from 'react'
import episodeData from '../data/episodes.json'
import { EpisodeType } from '../data/constants'

const ALL_TYPES = Object.values(EpisodeType)
const STORAGE_KEY = 'botw_wheel_filters'

export function useEpisodes() {
  const [enabledTypes, setEnabledTypes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: true }), {})
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledTypes))
  }, [enabledTypes])

  const toggleType = useCallback((type) => {
    setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }))
  }, [])

  const enableAll = useCallback(() => {
    setEnabledTypes(ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: true }), {}))
  }, [])

  const disableAll = useCallback(() => {
    setEnabledTypes(ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: false }), {}))
  }, [])

  const filteredEpisodes = useMemo(
    () => episodeData.filter((ep) => ep.types.some((t) => enabledTypes[t])),
    [enabledTypes]
  )

  const typeCounts = useMemo(() => {
    const counts = {}
    for (const t of ALL_TYPES) counts[t] = 0
    for (const ep of episodeData) {
      for (const t of ep.types) counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [])

  return {
    episodes: filteredEpisodes,
    allEpisodes: episodeData,
    enabledTypes,
    toggleType,
    enableAll,
    disableAll,
    typeCounts,
  }
}
