import React, { useState, useEffect, useCallback } from 'react'
import { WheelType, getCurrentHoliday, getTitle } from './data/constants'
import { useWheelItems } from './hooks/useWheelItems'
import { useSpinWheel } from './hooks/useSpinWheel'
import SettingsModal from './components/SettingsModal.jsx'
import WinnerBanner from './components/WinnerBanner.jsx'

export default function App() {
  const [wheelType, setWheelType] = useState(WheelType.BOSS)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { items, enabledItems, toggleItem, enableAll, disableAll } =
    useWheelItems(wheelType)

  const {
    canvasRef,
    spinning,
    winner,
    loadedItems,
    loadItems,
    drawWheel,
    spin,
    dismissWinner,
    angleRef,
  } = useSpinWheel()

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
    spin(enabledItems)
  }, [spin, enabledItems])

  return (
    <div className="app-container">
      {/* Settings gear — fixed top-right */}
      <button
        className="config-icon"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
        title="Settings"
      >
        ⚙
      </button>

      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">{title}</h1>
      </header>

      {/* Wheel area */}
      <main className="wheel-stage">
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} className="wheel-canvas" />
        </div>

        {/* Spin */}
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
      <WinnerBanner winner={winner} onDismiss={dismissWinner} />

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
      />
    </div>
  )
}
