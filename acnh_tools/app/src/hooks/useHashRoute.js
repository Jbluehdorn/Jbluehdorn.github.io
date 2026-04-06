import { useState, useEffect, useCallback } from 'react'

const ROUTES = [
  { id: 'encyclopedia', label: 'Encyclopedia', emoji: '📖' },
  { id: 'villager-calc', label: 'Island Odds', emoji: '🎫' },
  { id: 'villager-tracker', label: 'My Villagers', emoji: '🏠' },
  { id: 'art-tracker', label: 'Art Guide', emoji: '🎨' },
]

const DEFAULT_ROUTE = ROUTES[0].id

function getHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.some(r => r.id === hash) ? hash : DEFAULT_ROUTE
}

export function useHashRoute() {
  const [route, setRoute] = useState(getHash)

  useEffect(() => {
    const onHashChange = () => setRoute(getHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback((id) => {
    window.location.hash = id
  }, [])

  return { route, navigate, routes: ROUTES }
}
