import React, { useState, useEffect, useCallback } from 'react'
import { WheelType, getCurrentHoliday, getTitle } from './data/constants'
import { useWheelItems } from './hooks/useWheelItems'
import { useSpinWheel } from './hooks/useSpinWheel'
import { useAudio } from './hooks/useAudio'
import SettingsModal from './components/SettingsModal.jsx'
import WinnerBanner from './components/WinnerBanner.jsx'

export default function App() {
  const [wheelType, setWheelType] = useState(WheelType.BOSS)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { items, enabledItems, toggleItem, enableAll, disableAll } =
    useWheelItems(wheelType)

  const audio = useAudio()

  const {
    canvasRef,
    spinning,
    dragging,
    winner,
    bgImageRef,
    loadedItems,
    loadItems,
    drawWheel,
    spin,
    dismissWinner,
    angleRef,
    onDragStart,
    onDragMove,
    onDragEnd,
  } = useSpinWheel({ playTick: audio.playTick, playFound: audio.playFound })

  const holiday = getCurrentHoliday()
  const title = getTitle(wheelType, holiday)

  // Load images when enabled items change
  useEffect(() => {
    loadItems(enabledItems)
  }, [enabledItems, loadItems])

  // Draw initial wheel when loaded items are ready
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loadedItems.length === 0) return

    const ctx = canvas.getContext('2d')
    drawWheel(ctx, loadedItems, angleRef.current, canvas.width, canvas.height)
  }, [loadedItems, canvasRef, drawWheel, angleRef])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const container = canvas.parentElement
      const size = Math.min(container.clientWidth - 40, 600)
      canvas.width = size
      canvas.height = size + 40
      if (loadedItems.length > 0) {
        const ctx = canvas.getContext('2d')
        drawWheel(ctx, loadedItems, angleRef.current, canvas.width, canvas.height)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [canvasRef, loadedItems, drawWheel, angleRef])

  const handleSpin = useCallback(() => {
    audio.ensureMusicStarted()
    spin(enabledItems)
  }, [spin, enabledItems, audio])

  const handleDismissWinner = useCallback(() => {
    audio.dismissFound()
    dismissWinner()
  }, [audio, dismissWinner])

  return (
    <div className="app-container">
      {/* Top-right controls */}
      <div className="top-controls">
        {audio.currentMusicName && !audio.prefs.muted && (
          <span className="now-playing">♫ {audio.currentMusicName}</span>
        )}
        <button
          className="mute-icon"
          onClick={() => { audio.ensureMusicStarted(); audio.toggleMute() }}
          aria-label={audio.prefs.muted ? 'Unmute' : 'Mute'}
          title={audio.prefs.muted ? 'Unmute' : 'Mute'}
        >
          {audio.prefs.muted ? '🔇' : '🔊'}
        </button>
        <button
          className="play-pause-icon"
          onClick={() => audio.toggleMusic()}
          aria-label={audio.musicPlaying ? 'Pause music' : 'Play music'}
          title={audio.musicPlaying ? 'Pause music' : 'Play music'}
        >
          {audio.musicPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="config-icon"
          onClick={() => setSettingsOpen(true)}
          disabled={spinning}
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">{title}</h1>
      </header>

      {/* Wheel area */}
      <main className="wheel-stage">
        <img
          ref={bgImageRef}
          alt=""
          className="wheel-bg-image"
          style={{ display: 'none' }}
        />
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className={`wheel-canvas ${dragging ? 'grabbing' : ''}`}
            onPointerDown={(e) => {
              audio.ensureMusicStarted()
              e.currentTarget.setPointerCapture(e.pointerId)
              onDragStart(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => onDragMove(e.clientX, e.clientY)}
            onPointerUp={() => onDragEnd()}
            onPointerCancel={() => onDragEnd()}
          />
        </div>

        {/* Spin button fallback */}
        <div className="controls">
          <button
            className="spin-btn"
            onClick={handleSpin}
            disabled={spinning || enabledItems.length === 0}
          >
            {spinning ? '🎰 Spinning...' : '🎯 SPIN'}
          </button>
        </div>
      </main>

      {/* Winner announcement */}
      <WinnerBanner winner={winner} wheelType={wheelType} onDismiss={handleDismissWinner} />

      {/* Settings modal */}
      <SettingsModal
        show={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        wheelType={wheelType}
        onWheelTypeChange={setWheelType}
        items={items}
        onToggleItem={toggleItem}
        onEnableAll={enableAll}
        onDisableAll={disableAll}
        audio={audio}
      />
    </div>
  )
}
