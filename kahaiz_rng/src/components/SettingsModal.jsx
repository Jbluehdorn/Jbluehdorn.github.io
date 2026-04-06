import React, { useState, useEffect } from 'react'

export default function SettingsModal({
  show,
  onClose,
  min,
  max,
  rigged,
  onMinChange,
  onMaxChange,
  onMinBlur,
  onMaxBlur,
  onToggleRig,
}) {
  const [draftMin, setDraftMin] = useState(String(min))
  const [draftMax, setDraftMax] = useState(String(max))

  // Sync drafts when parent values change (e.g. after validation)
  useEffect(() => { setDraftMin(String(min)) }, [min])
  useEffect(() => { setDraftMax(String(max)) }, [max])

  if (!show) return null

  const handleMinBlur = () => {
    const parsed = parseInt(draftMin, 10)
    if (!isNaN(parsed)) {
      onMinChange(parsed)
    } else {
      setDraftMin(String(min))
    }
    onMinBlur()
  }

  const handleMaxBlur = () => {
    const parsed = parseInt(draftMax, 10)
    if (!isNaN(parsed)) {
      onMaxChange(Math.min(parsed, 999))
    } else {
      setDraftMax(String(max))
    }
    onMaxBlur()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <h2 className="modal-title">⚙ Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-content">
          {/* Range settings */}
          <div className="setting-group">
            <label className="setting-label">Range</label>
            <div className="range-inputs">
              <div className="range-field">
                <label className="range-label">Min</label>
                <input
                  type="number"
                  className="range-input"
                  value={draftMin}
                  min={0}
                  onChange={(e) => setDraftMin(e.target.value)}
                  onBlur={handleMinBlur}
                />
              </div>
              <span className="range-separator">—</span>
              <div className="range-field">
                <label className="range-label">Max</label>
                <input
                  type="number"
                  className="range-input"
                  value={draftMax}
                  max={999}
                  onChange={(e) => setDraftMax(e.target.value)}
                  onBlur={handleMaxBlur}
                />
              </div>
            </div>
          </div>

          {/* Rig toggle */}
          <div className="setting-group">
            <label className="setting-label">Machine Integrity</label>
            <div className="rig-toggle">
              <button
                className={`rig-btn ${rigged ? 'active' : ''}`}
                onClick={() => onToggleRig(true)}
              >
                🔧 Rig
              </button>
              <button
                className={`rig-btn ${!rigged ? 'active' : ''}`}
                onClick={() => onToggleRig(false)}
              >
                ✅ Un-Rig
              </button>
            </div>
            <p className="rig-status">
              The machine is currently:{' '}
              {rigged ? (
                <span className="rig-rigged">Rigged</span>
              ) : (
                <span className="rig-fair">Not Rigged</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
