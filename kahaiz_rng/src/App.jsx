import React, { useState, useCallback } from 'react'
import { getCurrentHoliday, getTitle } from './data/constants'
import { useSlotMachine } from './hooks/useSlotMachine'
import SlotMachine from './components/SlotMachine.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import ResultBanner from './components/ResultBanner.jsx'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [rollTrigger, setRollTrigger] = useState(0)

  const {
    min,
    max,
    value,
    rolling,
    rigged,
    sinceCount,
    hasRolled,
    updateMin,
    updateMax,
    validateMin,
    validateMax,
    toggleRig,
    resetSinceCount,
    roll,
    onRollComplete,
  } = useSlotMachine()

  const holiday = getCurrentHoliday()
  const title = getTitle(holiday)

  const handlePull = useCallback(() => {
    const result = roll()
    if (result !== null) {
      setShowResult(false)
      setRollTrigger((prev) => prev + 1)
    }
  }, [roll])

  const handleRollComplete = useCallback(() => {
    onRollComplete()
    setShowResult(true)
  }, [onRollComplete])

  const dismissResult = useCallback(() => {
    setShowResult(false)
  }, [])

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

      {/* Slot machine stage */}
      <main className="slot-stage">
        <SlotMachine
          max={max}
          targetValue={value}
          rollTrigger={rollTrigger}
          rolling={rolling}
          onPull={handlePull}
          onRollComplete={handleRollComplete}
        />

        {/* Pull button fallback */}
        <div className="controls">
          <button
            className="spin-btn"
            onClick={handlePull}
            disabled={rolling}
          >
            {rolling ? '🎰 Spinning...' : '🎰 PULL'}
          </button>
        </div>

        {/* Since count tracker */}
        <div className="since-tracker">
          <p className="since-text">
            There have been <span className="since-count">{sinceCount}</span> attempts since someone last won.
            {sinceCount > 0 && (
              <button className="reset-link" onClick={resetSinceCount}>
                (Reset)
              </button>
            )}
          </p>
        </div>

        {/* Rig status indicator */}
        <div className="rig-indicator">
          <span className="rig-dot-label">Machine status: </span>
          {rigged ? (
            <span className="rig-rigged">🔧 Rigged</span>
          ) : (
            <span className="rig-fair">✅ Fair</span>
          )}
        </div>
      </main>

      {/* Result announcement */}
      {showResult && !rolling && hasRolled && (
        <ResultBanner value={value} onDismiss={dismissResult} />
      )}

      {/* Settings modal */}
      <SettingsModal
        show={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        min={min}
        max={max}
        rigged={rigged}
        onMinChange={updateMin}
        onMaxChange={updateMax}
        onMinBlur={validateMin}
        onMaxBlur={validateMax}
        onToggleRig={toggleRig}
      />
    </div>
  )
}
