import { useRef, useCallback } from 'react'

export function useAudio() {
  const audioCtxRef = useRef(null)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const playTick = useCallback(() => {
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.06)
    } catch { /* ignore audio errors */ }
  }, [getCtx])

  const playWinner = useCallback(() => {
    try {
      const ctx = getCtx()
      const now = ctx.currentTime

      // Rising fanfare: three staggered tones
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + i * 0.12)

        gain.gain.setValueAtTime(0, now)
        gain.gain.setValueAtTime(0.18, now + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4)

        osc.start(now + i * 0.12)
        osc.stop(now + i * 0.12 + 0.4)
      })
    } catch { /* ignore audio errors */ }
  }, [getCtx])

  return { playTick, playWinner }
}
