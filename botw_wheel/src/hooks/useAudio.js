import { useRef, useCallback } from 'react'
import spinMusic from '../assets/audio/The Price is Right theme song.mp3'
import winnerSound from '../assets/audio/losing-horn.mp3'

export function useAudio() {
  const spinAudioRef = useRef(null)
  const winnerAudioRef = useRef(null)
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
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } catch { /* ignore audio errors */ }
  }, [getCtx])

  const startSpinMusic = useCallback(() => {
    try {
      if (!spinAudioRef.current) {
        spinAudioRef.current = new Audio(spinMusic)
        spinAudioRef.current.loop = true
      }
      spinAudioRef.current.currentTime = 0
      spinAudioRef.current.play()
    } catch { /* ignore audio errors */ }
  }, [])

  const stopSpinMusic = useCallback(() => {
    try {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause()
        spinAudioRef.current.currentTime = 0
      }
    } catch { /* ignore audio errors */ }
  }, [])

  const playWinner = useCallback(() => {
    try {
      stopSpinMusic()
      if (!winnerAudioRef.current) {
        winnerAudioRef.current = new Audio(winnerSound)
      }
      winnerAudioRef.current.currentTime = 0
      winnerAudioRef.current.play()
    } catch { /* ignore audio errors */ }
  }, [stopSpinMusic])

  return { playTick, startSpinMusic, stopSpinMusic, playWinner }
}
