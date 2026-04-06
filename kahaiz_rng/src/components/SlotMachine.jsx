import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'

const CELL_HEIGHT = 80
const DIGITS_PER_SET = 10
const NUM_SETS = 15
const TOTAL_CELLS = DIGITS_PER_SET * NUM_SETS

// Duration spread per reel (staggered left-to-right)
const BASE_DURATION = 4500
const DURATION_STEP = 1500
const BASE_ROTATIONS = 5
const ROTATIONS_STEP = 2

// Normalized exponential ease-out: smooth deceleration that glides into the final position
const EASE_K = 5
const EASE_MAX = 1 - Math.pow(2, -EASE_K)

function easeOutExpo(t) {
  return (1 - Math.pow(2, -EASE_K * t)) / EASE_MAX
}

function getReelCount(max) {
  if (max <= 0) return 1
  return String(max).length
}

export default function SlotMachine({ max, targetValue, rollTrigger, rolling, onPull, onRollComplete }) {
  const reelCount = useMemo(() => getReelCount(max), [max])
  const reelRefsMap = useRef({})
  const currentOffsets = useRef([])
  const animRefs = useRef([])
  const [armPulled, setArmPulled] = useState(false)

  const tickAudioRef = useRef(null)
  const onRollCompleteRef = useRef(onRollComplete)

  // Keep offsets/anim arrays sized to reelCount
  useEffect(() => {
    currentOffsets.current = Array.from({ length: reelCount }, (_, i) => currentOffsets.current[i] || 0)
    animRefs.current = Array.from({ length: reelCount }, (_, i) => animRefs.current[i] || null)
  }, [reelCount])

  useEffect(() => {
    onRollCompleteRef.current = onRollComplete
  }, [onRollComplete])

  useEffect(() => {
    tickAudioRef.current = new Audio('./assets/audio/countdown.wav')
    tickAudioRef.current.volume = 0.15
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (let i = 0; i < animRefs.current.length; i++) {
        if (animRefs.current[i]) cancelAnimationFrame(animRefs.current[i])
      }
    }
  }, [])

  const digitCells = Array.from({ length: TOTAL_CELLS }, (_, i) => i % DIGITS_PER_SET)

  const handleArmClick = useCallback(() => {
    if (rolling) return
    setArmPulled(true)
    setTimeout(() => {
      onPull()
    }, 300)
    setTimeout(() => {
      setArmPulled(false)
    }, 500)
  }, [rolling, onPull])

  // Animate reels when rollTrigger changes
  useEffect(() => {
    if (rollTrigger === 0 || targetValue === null) return

    const count = getReelCount(max)
    const targetDigits = String(targetValue).padStart(count, '0').split('').map(Number)
    const startTime = performance.now()
    let completedReels = 0
    const lastCells = new Array(count).fill(-1)

    for (let i = 0; i < count; i++) {
      const strip = reelRefsMap.current[i]
      if (!strip) continue

      const startOffset = currentOffsets.current[i] || 0
      const rotations = BASE_ROTATIONS + i * ROTATIONS_STEP + Math.floor(Math.random() * 3)
      const targetCellIndex = rotations * DIGITS_PER_SET + targetDigits[i]
      const targetOffset = targetCellIndex * CELL_HEIGHT
      const duration = BASE_DURATION + i * DURATION_STEP

      const animateReel = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutExpo(progress)
        const offset = startOffset + (targetOffset - startOffset) * eased
        strip.style.transform = `translateY(-${offset}px)`

        const currentCell = Math.floor(offset / CELL_HEIGHT)
        if (currentCell !== lastCells[i]) {
          lastCells[i] = currentCell
          if (tickAudioRef.current && progress < 0.92) {
            const tick = tickAudioRef.current.cloneNode()
            tick.volume = Math.min(0.2, 0.04 + progress * 0.16)
            tick.play().catch(() => {})
          }
        }

        if (progress < 1) {
          animRefs.current[i] = requestAnimationFrame(animateReel)
        } else {
          animRefs.current[i] = null
          currentOffsets.current[i] = targetOffset
          completedReels++

          if (completedReels === count) {
            setTimeout(() => {
              for (let j = 0; j < count; j++) {
                const s = reelRefsMap.current[j]
                if (!s) continue
                const resetOffset = targetDigits[j] * CELL_HEIGHT
                s.style.transform = `translateY(-${resetOffset}px)`
                currentOffsets.current[j] = resetOffset
              }
              onRollCompleteRef.current()
            }, 200)
          }
        }
      }

      animRefs.current[i] = requestAnimationFrame(animateReel)
    }

    return () => {
      for (let i = 0; i < count; i++) {
        if (animRefs.current[i]) {
          cancelAnimationFrame(animRefs.current[i])
          animRefs.current[i] = null
        }
      }
    }
  }, [rollTrigger, targetValue, max])

  // Reset offsets when reel count changes (max changed)
  useEffect(() => {
    currentOffsets.current = new Array(reelCount).fill(0)
    Object.values(reelRefsMap.current).forEach((strip) => {
      if (strip) strip.style.transform = 'translateY(0px)'
    })
  }, [reelCount])

  return (
    <div className="slot-machine">
      <div className="slot-cabinet">
        <div className="slot-top-panel">
          <span className="slot-label">🎰</span>
        </div>

        <div className="reels-container">
          {Array.from({ length: reelCount }, (_, i) => (
            <div key={i} className="reel-window">
              <div
                className="reel-strip"
                ref={(el) => { reelRefsMap.current[i] = el }}
              >
                {digitCells.map((digit, j) => (
                  <div key={j} className="reel-cell">
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="slot-bottom-panel" />
      </div>

      <div
        className={`slot-arm ${armPulled ? 'pulled' : ''} ${rolling ? 'disabled' : ''}`}
        onClick={handleArmClick}
        role="button"
        tabIndex={0}
        aria-label="Pull lever to roll"
      >
        <div className="arm-track" />
        <div className="arm-handle" />
      </div>
    </div>
  )
}
