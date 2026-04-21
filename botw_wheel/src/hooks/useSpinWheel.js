import { useRef, useCallback, useState, useEffect } from 'react'

const BAG_STORAGE_KEY = 'botw_wheel_shuffle_bag'
const LAST_PICK_KEY = 'botw_wheel_last_pick'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function loadBag() {
  try {
    const stored = localStorage.getItem(BAG_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveBag(bag) {
  try { localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bag)) } catch { /* ignore */ }
}

function loadLastPick() {
  try { return localStorage.getItem(LAST_PICK_KEY) || null } catch { return null }
}

function saveLastPick(id) {
  try { localStorage.setItem(LAST_PICK_KEY, id) } catch { /* ignore */ }
}

export function useSpinWheel({ playTick, startSpinMusic, stopSpinMusic, playWinner }) {
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const allEpisodesRef = useRef([])
  const timerRef = useRef(null)
  const spinningRef = useRef(false)
  const shuffleBagRef = useRef(loadBag())
  const lastPickRef = useRef(loadLastPick())

  const playTickRef = useRef(playTick)
  const startSpinMusicRef = useRef(startSpinMusic)
  const stopSpinMusicRef = useRef(stopSpinMusic)
  const playWinnerRef = useRef(playWinner)
  useEffect(() => { playTickRef.current = playTick }, [playTick])
  useEffect(() => { startSpinMusicRef.current = startSpinMusic }, [startSpinMusic])
  useEffect(() => { stopSpinMusicRef.current = stopSpinMusic }, [stopSpinMusic])
  useEffect(() => { playWinnerRef.current = playWinner }, [playWinner])

  const setEpisodes = useCallback((episodes) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    spinningRef.current = false
    setSpinning(false)
    setWinner(null)
    setHighlightId(null)
    setSelectedId(null)
    stopSpinMusicRef.current()

    // Reconcile shuffle bag with new episode list
    const newIds = new Set(episodes.map((e) => e.id))
    const prevIds = new Set(allEpisodesRef.current.map((e) => e.id))
    const kept = shuffleBagRef.current.filter((id) => newIds.has(id))
    const added = episodes.filter((e) => !prevIds.has(e.id)).map((e) => e.id)
    shuffleBagRef.current = [...kept, ...shuffleArray(added)]
    saveBag(shuffleBagRef.current)

    allEpisodesRef.current = episodes
  }, [])

  const drawFromBag = useCallback(() => {
    const all = allEpisodesRef.current
    if (all.length === 0) return null

    // Refill bag when empty
    if (shuffleBagRef.current.length === 0) {
      let newBag = shuffleArray(all.map((e) => e.id))

      // Avoid boundary repeat: if the last item in the new bag (next to be
      // popped) is the same as the last pick, move it elsewhere
      if (all.length > 1 && newBag[newBag.length - 1] === lastPickRef.current) {
        const swapIdx = Math.floor(Math.random() * (newBag.length - 1))
        ;[newBag[newBag.length - 1], newBag[swapIdx]] = [newBag[swapIdx], newBag[newBag.length - 1]]
      }

      shuffleBagRef.current = newBag
    }

    const id = shuffleBagRef.current.pop()
    lastPickRef.current = id
    saveBag(shuffleBagRef.current)
    saveLastPick(id)
    return all.find((e) => e.id === id) || null
  }, [])

  const spin = useCallback(() => {
    const all = allEpisodesRef.current
    if (all.length === 0 || spinningRef.current) return

    spinningRef.current = true
    setSpinning(true)
    setWinner(null)
    setSelectedId(null)

    // Draw winner from shuffle bag
    const winnerEp = drawFromBag()
    if (!winnerEp) {
      spinningRef.current = false
      setSpinning(false)
      return
    }

    // Single episode — skip the animation
    if (all.length === 1) {
      startSpinMusicRef.current()
      setTimeout(() => {
        setSelectedId(winnerEp.id)
        spinningRef.current = false
        setSpinning(false)
        setWinner(winnerEp)
        stopSpinMusicRef.current()
        playWinnerRef.current()
      }, 800)
      return
    }

    // Build jump schedule that totals exactly ~6.75 seconds
    const TOTAL_DURATION = 6750
    const baseInterval = 30
    const jumpSequence = []
    const delays = []
    let elapsed = 0

    while (elapsed < TOTAL_DURATION) {
      const progress = elapsed / TOTAL_DURATION
      const delay = baseInterval + (800 - baseInterval) * Math.pow(progress, 3)
      if (elapsed + delay > TOTAL_DURATION) break
      delays.push(delay)
      elapsed += delay

      let idx
      do { idx = Math.floor(Math.random() * all.length) } while (all[idx].id === winnerEp.id)
      jumpSequence.push(all[idx].id)
    }
    // Final jump lands on the winner with remaining time
    jumpSequence.push(winnerEp.id)
    delays.push(TOTAL_DURATION - elapsed)

    let jumpIdx = 0

    startSpinMusicRef.current()

    const doJump = () => {
      const id = jumpSequence[jumpIdx]
      setHighlightId(id)
      playTickRef.current()

      jumpIdx++

      if (jumpIdx >= jumpSequence.length) {
        setTimeout(() => {
          setHighlightId(null)
          setSelectedId(winnerEp.id)
          spinningRef.current = false
          setSpinning(false)
          setWinner(winnerEp)
          playWinnerRef.current()
        }, 600)
        return
      }

      timerRef.current = setTimeout(doJump, delays[jumpIdx])
    }

    doJump()
  }, [drawFromBag])

  const dismissWinner = useCallback(() => {
    setWinner(null)
    setSelectedId(null)
    setHighlightId(null)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return {
    spinning,
    winner,
    highlightId,
    selectedId,
    setEpisodes,
    spin,
    dismissWinner,
  }
}
