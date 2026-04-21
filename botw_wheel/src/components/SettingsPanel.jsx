import React from 'react'
import { EpisodeType, EpisodeTypeLabels, EpisodeTypeColors, EpisodeTag, EpisodeTagLabels, EpisodeTagColors } from '../data/constants'

const ALL_TYPES = Object.values(EpisodeType)
const ALL_TAGS = Object.values(EpisodeTag)

export default function SettingsPanel({
  show,
  onClose,
  enabledTypes,
  onToggleType,
  onEnableAll,
  onDisableAll,
  typeCounts,
  excludedTags,
  onToggleTag,
  tagCounts,
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

          <h3 className="filter-section-title">Exclude Themes</h3>
          <div className="type-toggles">
            {ALL_TAGS.map((tag) => {
              const excluded = excludedTags[tag]
              const color = EpisodeTagColors[tag]
              const count = tagCounts[tag] || 0
              return (
                <button
                  key={tag}
                  className={`type-toggle ${excluded ? 'enabled' : 'disabled'}`}
                  onClick={() => onToggleTag(tag)}
                  style={{
                    borderColor: excluded ? color : '#333',
                    color: excluded ? color : '#555',
                  }}
                >
                  <span className="type-dot" style={{ background: excluded ? color : '#333' }} />
                  <span className="type-label">{EpisodeTagLabels[tag]}</span>
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
