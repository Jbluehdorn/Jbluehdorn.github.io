import { useRef, useCallback, useState, useEffect } from 'react'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useSpinWheel({ playTick, playWinner }) {
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const allEpisodesRef = useRef([])
  const timerRef = useRef(null)
  const spinningRef = useRef(false)

  const playTickRef = useRef(playTick)
  const playWinnerRef = useRef(playWinner)
  useEffect(() => { playTickRef.current = playTick }, [playTick])
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

    // Build a sequence of random jumps ending on the winner
    const totalJumps = 25 + Math.floor(Math.random() * 15) // 25–40 jumps
    const jumpSequence = []
    for (let i = 0; i < totalJumps - 1; i++) {
      let idx
      do { idx = Math.floor(Math.random() * all.length) } while (idx === winnerIdx && i > totalJumps - 5)
      jumpSequence.push(all[idx].id)
    }
    jumpSequence.push(winnerEp.id) // final jump lands on winner

    let jumpIdx = 0

    const doJump = () => {
      const id = jumpSequence[jumpIdx]
      setHighlightId(id)
      playTickRef.current()

      jumpIdx++

      if (jumpIdx >= jumpSequence.length) {
        // Landed on winner — pause, then reveal
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

      // Exponential deceleration: intervals get longer as we approach the end
      const progress = jumpIdx / jumpSequence.length
      const baseInterval = 60
      const maxInterval = 500
      // Ease-in curve: slow start → fast middle → very slow end
      const delay = baseInterval + (maxInterval - baseInterval) * Math.pow(progress, 2.5)

      timerRef.current = setTimeout(doJump, delay)
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
