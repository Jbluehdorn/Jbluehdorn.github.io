import React from 'react'
import { EpisodeType, EpisodeTypeLabels, EpisodeTypeColors } from '../data/constants'

const ALL_TYPES = Object.values(EpisodeType)

export default function SettingsPanel({
  show,
  onClose,
  enabledTypes,
  onToggleType,
  onEnableAll,
  onDisableAll,
  typeCounts,
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <h2 className="modal-title">⚙ Filters</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body-content">
          <div className="bulk-actions">
            <button className="filter-btn enable-all" onClick={onEnableAll}>
              Enable All
            </button>
            <button className="filter-btn disable-all" onClick={onDisableAll}>
              Disable All
            </button>
          </div>
          <div className="type-toggles">
            {ALL_TYPES.map((type) => {
              const enabled = enabledTypes[type]
              const color = EpisodeTypeColors[type]
              const count = typeCounts[type] || 0
              return (
                <button
                  key={type}
                  className={`type-toggle ${enabled ? 'enabled' : 'disabled'}`}
                  onClick={() => onToggleType(type)}
                  style={{
                    borderColor: enabled ? color : '#333',
                    color: enabled ? color : '#555',
                  }}
                >
                  <span className="type-dot" style={{ background: enabled ? color : '#333' }} />
                  <span className="type-label">{EpisodeTypeLabels[type]}</span>
                  <span className="type-count">({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
