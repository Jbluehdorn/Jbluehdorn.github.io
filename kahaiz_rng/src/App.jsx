import React, { useState, useCallback } from 'react'
import { getCurrentHoliday, getTitle } from './data/constants'
import { useDiceRoll } from './hooks/useDiceRoll'
import SettingsModal from './components/SettingsModal.jsx'
import ResultBanner from './components/ResultBanner.jsx'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const {
    min,
    max,
    value,
    rolling,
    rigged,
    sinceCount,
    hasRolled,
    shakeIntensity,
    updateMin,
    updateMax,
    validateMin,
    validateMax,
    toggleRig,
    resetSinceCount,
    roll,
  } = useDiceRoll()

  const holiday = getCurrentHoliday()
  const title = getTitle(holiday)

  const handleRoll = useCallback(() => {
    setShowResult(false)
    roll()
    // Show result banner after roll completes (~7.5s)
    setTimeout(() => setShowResult(true), 7600)
  }, [roll])

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

      {/* Dice stage */}
      <main className="dice-stage">
        {/* The big number display */}
        <div className={`dice-display ${rolling ? 'rolling' : ''} ${value !== null ? 'visible' : ''}`}>
          <div
            className="dice-frame"
            style={{ '--shake': shakeIntensity }}
          >
            <span className="dice-value">{value !== null ? value : '?'}</span>
          </div>
        </div>

        {/* Roll button */}
        <div className="controls">
          <button
            className="spin-btn"
            onClick={handleRoll}
            disabled={rolling}
          >
            {rolling ? '🎲 Rolling...' : '🎯 ROLL'}
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
          <span className="rig-dot-label">Dice status: </span>
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
