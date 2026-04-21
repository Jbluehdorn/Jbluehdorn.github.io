import { useState, useEffect, useCallback, useMemo } from 'react'
import episodeData from '../data/episodes.json'
import { EpisodeType, EpisodeTag, detectTags } from '../data/constants'

const ALL_TYPES = Object.values(EpisodeType)
const ALL_TAGS = Object.values(EpisodeTag)
const STORAGE_KEY = 'botw_wheel_filters'
const TAGS_STORAGE_KEY = 'botw_wheel_excluded_tags'

// Pre-compute tags for each episode
const taggedEpisodes = episodeData.map((ep) => ({
  ...ep,
  tags: detectTags(ep.title),
}))

export function useEpisodes() {
  const [enabledTypes, setEnabledTypes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: true }), {})
  })

  const [excludedTags, setExcludedTags] = useState(() => {
    try {
      const stored = localStorage.getItem(TAGS_STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return ALL_TAGS.reduce((acc, t) => ({ ...acc, [t]: false }), {})
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledTypes))
  }, [enabledTypes])

  useEffect(() => {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(excludedTags))
  }, [excludedTags])

  const toggleType = useCallback((type) => {
    setEnabledTypes((prev) => ({ ...prev, [type]: !prev[type] }))
  }, [])

  const toggleTag = useCallback((tag) => {
    setExcludedTags((prev) => ({ ...prev, [tag]: !prev[tag] }))
  }, [])

  const enableAll = useCallback(() => {
    setEnabledTypes(ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: true }), {}))
  }, [])

  const disableAll = useCallback(() => {
    setEnabledTypes(ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: false }), {}))
  }, [])

  const filteredEpisodes = useMemo(
    () => taggedEpisodes
      .filter((ep) => ep.types.some((t) => enabledTypes[t]))
      .filter((ep) => !ep.tags.some((t) => excludedTags[t]))
      .sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || '')),
    [enabledTypes, excludedTags]
  )

  const typeCounts = useMemo(() => {
    const counts = {}
    for (const t of ALL_TYPES) counts[t] = 0
    for (const ep of taggedEpisodes) {
      for (const t of ep.types) counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [])

  const tagCounts = useMemo(() => {
    const counts = {}
    for (const t of ALL_TAGS) counts[t] = 0
    for (const ep of taggedEpisodes) {
      for (const t of ep.tags) counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [])

  return {
    episodes: filteredEpisodes,
    allEpisodes: taggedEpisodes,
    enabledTypes,
    toggleType,
    enableAll,
    disableAll,
    typeCounts,
    excludedTags,
    toggleTag,
    tagCounts,
  }
}
