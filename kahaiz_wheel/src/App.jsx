import React, { useState, useEffect, useCallback } from 'react'
import { WheelType, getCurrentHoliday, getTitle } from './data/constants'
import { useWheelItems } from './hooks/useWheelItems'
import { useSpinWheel } from './hooks/useSpinWheel'
import { useAudio } from './hooks/useAudio'
import SettingsModal from './components/SettingsModal.jsx'
import WinnerBanner from './components/WinnerBanner.jsx'
import {
  Settings,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Play,
  Pause,
} from 'lucide-react'

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
    loadedItems,
    loadItems,
    drawWheel,
    dismissWinner,
    angleRef,
    onDragStart,
    onDragMove,
    onDragEnd,
  } = useSpinWheel({ playTick: audio.playTick, playFound: audio.playFound })

  const holiday = getCurrentHoliday()
  const title = getTitle(wheelType, holiday)

  useEffect(() => {
    loadItems(enabledItems)
  }, [enabledItems, loadItems])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loadedItems.length === 0) return
    const ctx = canvas.getContext('2d')
    drawWheel(ctx, loadedItems, angleRef.current, canvas.width, canvas.height)
  }, [loadedItems, canvasRef, drawWheel, angleRef])

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

  const handleDismissWinner = useCallback(() => {
    audio.dismissFound()
    dismissWinner()
  }, [audio, dismissWinner])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">{title}</h1>
      </header>
      <button
        className="config-icon"
        onClick={() => setSettingsOpen(true)}
        disabled={spinning}
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={22} />
      </button>

      {/* Wheel area */}
      <main className="wheel-stage">
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
      </main>

      {/* Bottom audio bar */}
      <footer className="audio-bar">
        <div className="audio-bar-track">
          {audio.currentMusicName && !audio.prefs.muted
            ? audio.currentMusicName
            : 'No track'}
        </div>
        <div className="audio-bar-controls">
          <button
            className="audio-bar-btn"
            onClick={() => { audio.ensureMusicStarted(); audio.toggleMute() }}
            aria-label={audio.prefs.muted ? 'Unmute' : 'Mute'}
            title={audio.prefs.muted ? 'Unmute' : 'Mute'}
          >
            {audio.prefs.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            className="audio-bar-btn"
            onClick={() => audio.prevMusic()}
            aria-label="Previous track"
            title="Previous track"
          >
            <SkipBack size={18} />
          </button>
          <button
            className="audio-bar-btn audio-bar-play"
            onClick={() => { audio.ensureMusicStarted(); audio.toggleMusic() }}
            aria-label={audio.musicPlaying ? 'Pause' : 'Play'}
            title={audio.musicPlaying ? 'Pause' : 'Play'}
          >
            {audio.musicPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            className="audio-bar-btn"
            onClick={() => audio.skipMusic()}
            aria-label="Next track"
            title="Next track"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </footer>

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
