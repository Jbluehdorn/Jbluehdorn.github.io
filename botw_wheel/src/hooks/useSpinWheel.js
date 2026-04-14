import { useRef, useCallback, useState, useEffect } from 'react'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useSpinWheel({ playTick, startSpinMusic, stopSpinMusic, playWinner }) {
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const allEpisodesRef = useRef([])
  const timerRef = useRef(null)
  const spinningRef = useRef(false)

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
    allEpisodesRef.current = episodes
  }, [])

  const spin = useCallback(() => {
    const all = allEpisodesRef.current
    if (all.length === 0 || spinningRef.current) return

    spinningRef.current = true
    setSpinning(true)
    setWinner(null)
    setSelectedId(null)

    // Pre-select winner
    const winnerIdx = Math.floor(Math.random() * all.length)
    const winnerEp = all[winnerIdx]

    // Build jump schedule that totals exactly 7 seconds
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
      do { idx = Math.floor(Math.random() * all.length) } while (idx === winnerIdx)
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
  }, [])

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
