import React, { useMemo } from 'react'
import { WheelType } from '../data/constants'
import { FOUND_SONGS, MUSIC_SONGS } from '../hooks/useAudio'
import { Settings, CircleDot, Volume2, Play } from 'lucide-react'

export default function SettingsModal({
  show,
  onClose,
  wheelType,
  onWheelTypeChange,
  items,
  onToggleItem,
  onEnableAll,
  onDisableAll,
  audio,
}) {
  const [filterTerm, setFilterTerm] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('wheel')

  const sortedItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((i) =>
          i.name.toLowerCase().includes(filterTerm.toLowerCase())
        ),
    [items, filterTerm]
  )

  const enabledItems = sortedItems.filter((i) => i.enabled)
  const disabledItems = sortedItems.filter((i) => !i.enabled)

  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <h2 className="modal-title"><Settings size={18} /> Settings</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'wheel' ? 'active' : ''}`}
            onClick={() => setActiveTab('wheel')}
          >
            <CircleDot size={14} /> Wheel
          </button>
          <button
            className={`settings-tab ${activeTab === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveTab('audio')}
          >
            <Volume2 size={14} /> Audio
          </button>
        </div>

        <div className="modal-body-content">
          {activeTab === 'wheel' && (
            <>
              {/* Wheel type selector */}
              <div className="setting-group">
                <label className="setting-label">Wheel Type</label>
                <div className="wheel-type-buttons">
                  {[
                    { value: WheelType.BOSS, label: 'Boss' },
                    { value: WheelType.SOTW, label: 'SOTW' },
                    { value: WheelType.BOTW, label: 'BOTW' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`wheel-type-btn ${wheelType === opt.value ? 'active' : ''}`}
                      onClick={() => onWheelTypeChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk actions */}
              <div className="setting-group">
                <div className="bulk-actions">
                  <button className="osrs-btn" onClick={onEnableAll}>
                    Enable All
                  </button>
                  <button className="osrs-btn danger" onClick={onDisableAll}>
                    Disable All
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="setting-group">
                <div className="search-wrapper">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search..."
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                  />
                  {filterTerm && (
                    <button
                      className="search-clear"
                      onClick={() => setFilterTerm('')}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Enabled items */}
              <div className="items-section">
                <h3 className="items-heading enabled-heading">
                  {wheelType === WheelType.SOTW ? 'Skills' : 'Bosses'} — Enabled
                </h3>
                <div className="items-grid">
                  {enabledItems.map((item) => (
                    <button
                      key={item.name}
                      className="item-tag enabled"
                      onClick={() => onToggleItem(item.name, false)}
                      title="Click to disable"
                    >
                      <img
                        src={`./assets/img/${item.filename}`}
                        alt=""
                        className="item-tag-icon"
                      />
                      {item.name}
                    </button>
                  ))}
                  {enabledItems.length === 0 && (
                    <p className="empty-msg">No items enabled</p>
                  )}
                </div>
              </div>

              {/* Disabled items */}
              {disabledItems.length > 0 && (
                <div className="items-section">
                  <h3 className="items-heading disabled-heading">Disabled</h3>
                  <div className="items-grid">
                    {disabledItems.map((item) => (
                      <button
                        key={item.name}
                        className="item-tag disabled"
                        onClick={() => onToggleItem(item.name, true)}
                        title="Click to enable"
                      >
                        <img
                          src={`./assets/img/${item.filename}`}
                          alt=""
                          className="item-tag-icon"
                        />
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'audio' && (
            <>
              {/* Tick */}
              <div className="setting-group">
                <label className="setting-label">Tick</label>
                <div className="audio-setting">
                  <label className="audio-setting-label">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audio.prefs.tickVolume * 100)}
                    onChange={(e) => audio.setTickVolume(Number(e.target.value) / 100)}
                    className="volume-slider"
                  />
                  <span className="volume-value">{Math.round(audio.prefs.tickVolume * 100)}%</span>
                </div>
              </div>

              {/* Found */}
              <div className="setting-group">
                <label className="setting-label">Found Sound</label>
                <div className="audio-setting">
                  <label className="audio-setting-label">Song</label>
                  <select
                    className="audio-select"
                    value={audio.prefs.foundSong}
                    onChange={(e) => audio.setFoundSong(e.target.value)}
                  >
                    {FOUND_SONGS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    className="preview-btn"
                    onClick={() => audio.previewFound()}
                    title="Preview found sound"
                    disabled={audio.prefs.foundSong === 'none'}
                  >
                    <Play size={12} />
                  </button>
                </div>
                <div className="audio-setting">
                  <label className="audio-setting-label">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audio.prefs.foundVolume * 100)}
                    onChange={(e) => audio.setFoundVolume(Number(e.target.value) / 100)}
                    className="volume-slider"
                  />
                  <span className="volume-value">{Math.round(audio.prefs.foundVolume * 100)}%</span>
                </div>
              </div>

              {/* Music */}
              <div className="setting-group">
                <label className="setting-label">Music</label>
                <div className="audio-setting">
                  <label className="audio-setting-label">Song</label>
                  <select
                    className="audio-select"
                    value={audio.prefs.musicSong}
                    onChange={(e) => audio.setMusicSong(e.target.value)}
                  >
                    {MUSIC_SONGS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="audio-setting">
                  <label className="audio-setting-label">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audio.prefs.musicVolume * 100)}
                    onChange={(e) => audio.setMusicVolume(Number(e.target.value) / 100)}
                    className="volume-slider"
                  />
                  <span className="volume-value">{Math.round(audio.prefs.musicVolume * 100)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
