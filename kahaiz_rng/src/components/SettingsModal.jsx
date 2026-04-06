import React, { useState } from 'react'

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
  if (!show) return null

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
            <label className="setting-label">Dice Range</label>
            <div className="range-inputs">
              <div className="range-field">
                <label className="range-label">Min</label>
                <input
                  type="number"
                  className="range-input"
                  value={min}
                  onChange={(e) => onMinChange(e.target.value)}
                  onBlur={onMinBlur}
                />
              </div>
              <span className="range-separator">—</span>
              <div className="range-field">
                <label className="range-label">Max</label>
                <input
                  type="number"
                  className="range-input"
                  value={max}
                  onChange={(e) => onMaxChange(e.target.value)}
                  onBlur={onMaxBlur}
                />
              </div>
            </div>
          </div>

          {/* Rig toggle */}
          <div className="setting-group">
            <label className="setting-label">Dice Integrity</label>
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
              The dice are currently:{' '}
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
