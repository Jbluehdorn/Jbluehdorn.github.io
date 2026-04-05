import { useState, useEffect, useMemo } from 'react'
import { useCreatureData } from './hooks/useCreatureData'
import { useCollected } from './hooks/useCollected'
import { isAvailableNow, isAvailableThisMonth } from './utils/availability'
import { getSettings, saveSettings } from './utils/storage'
import FilterControls from './components/FilterControls'
import CreatureGrid from './components/CreatureGrid'
import StatsBar from './components/StatsBar'
import CameraCapture from './components/CameraCapture'
import './App.css'

function App() {
  const { fish, insects, seaCreatures, allCreatures, loading, error } = useCreatureData()
  const { collected, toggle, setMultiple, clearAll } = useCollected()

  const [activeTab, setActiveTab] = useState('all')
  const [showCamera, setShowCamera] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [showFilter, setShowFilter] = useState('available-now')
  const [selectedIds, setSelectedIds] = useState(new Set())

  // When custom time is disabled, reset to system time
  const handleUseCustomTimeChange = (useCustom) => {
    setUseCustomTime(useCustom)
    if (!useCustom) {
      setCurrentDate(new Date())
    }
  }

  const savedSettings = getSettings()
  const [hemisphere, setHemisphere] = useState(savedSettings.hemisphere)

  // Update real-time clock every minute (when not using custom time)
  useEffect(() => {
    if (useCustomTime) return
    const interval = setInterval(() => setCurrentDate(new Date()), 60000)
    return () => clearInterval(interval)
  }, [useCustomTime])

  // Persist hemisphere setting
  useEffect(() => {
    saveSettings({ hemisphere })
  }, [hemisphere])

  // Get creatures for the active tab
  const tabCreatures = useMemo(() => {
    switch (activeTab) {
      case 'fish': return fish
      case 'insects': return insects
      case 'sea-creatures': return seaCreatures
      default: return allCreatures
    }
  }, [activeTab, fish, insects, seaCreatures, allCreatures])

  // Apply filters
  const filteredCreatures = useMemo(() => {
    return tabCreatures.filter(creature => {
      const isCollected = !!collected[creature['Unique Entry ID']]

      switch (showFilter) {
        case 'available-now':
          return isAvailableNow(creature, currentDate, hemisphere) && !isCollected
        case 'available-month':
          return isAvailableThisMonth(creature, currentDate.getMonth() + 1, hemisphere) && !isCollected
        case 'not-collected':
          return !isCollected
        case 'collected':
          return isCollected
        case 'all':
        default:
          return true
      }
    })
  }, [tabCreatures, showFilter, collected, currentDate, hemisphere])

  // Clear selection when switching tabs or filters
  useEffect(() => { setSelectedIds(new Set()) }, [activeTab, showFilter])

  const handleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkCollect = () => {
    if (selectedIds.size > 0) {
      setMultiple([...selectedIds], true)
      setSelectedIds(new Set())
    }
  }

  const handleBulkUncollect = () => {
    if (selectedIds.size > 0) {
      setMultiple([...selectedIds], false)
      setSelectedIds(new Set())
    }
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">🍃</div>
        <p>Loading creature data...</p>
      </div>
    )
  }

  if (error) {
    return <div className="app-error">Error loading data: {error}</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🐾 ACNH Encyclopedia Tracker</h1>
        <p className="app-subtitle">Track your Animal Crossing: New Horizons collection</p>
      </header>

      <StatsBar
        allCreatures={allCreatures}
        fish={fish}
        insects={insects}
        seaCreatures={seaCreatures}
        collected={collected}
      />

      <div className="tab-bar">
        {[
          { key: 'all', label: '📋 All', count: allCreatures.length },
          { key: 'fish', label: '🐟 Fish', count: fish.length },
          { key: 'insects', label: '🦗 Insects', count: insects.length },
          { key: 'sea-creatures', label: '🦑 Sea', count: seaCreatures.length },
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} <span className="tab-count">{tab.count}</span>
          </button>
        ))}
        <button
          className={`tab-btn upload-tab ${showCamera ? 'active' : ''}`}
          onClick={() => setShowCamera(!showCamera)}
        >
          📸 Upload
        </button>
      </div>

      {showCamera && (
        <CameraCapture
          allCreatures={allCreatures}
          collected={collected}
          onDetected={(ids) => setMultiple(ids, true)}
        />
      )}

      <FilterControls
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        hemisphere={hemisphere}
        onHemisphereChange={setHemisphere}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        useCustomTime={useCustomTime}
        onUseCustomTimeChange={handleUseCustomTimeChange}
      />

      <div className="legend">
        <span className="legend-item"><span className="legend-dot available-now"></span> Available now</span>
        <span className="legend-item"><span className="legend-dot available-later"></span> Later today</span>
        <span className="legend-item"><span className="legend-dot leaving-soon"></span> Leaving soon</span>
        <span className="legend-item"><span className="legend-dot unavailable"></span> Unavailable</span>
        <span className="legend-item"><span className="legend-dot collected"></span> Collected</span>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (() => {
        const showCollect = showFilter !== 'collected';
        const showUncollect = showFilter === 'collected' || showFilter === 'all';
        return (
          <div className="bulk-bar">
            <span className="bulk-count">{selectedIds.size} selected</span>
            {showCollect && (
              <button className="bulk-btn bulk-collect" onClick={handleBulkCollect}>
                ✅ Mark Collected
              </button>
            )}
            {showUncollect && (
              <button className="bulk-btn bulk-uncollect" onClick={handleBulkUncollect}>
                ↩ Mark Uncollected
              </button>
            )}
            <button className="bulk-btn bulk-clear" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        );
      })()}

      <CreatureGrid
        creatures={filteredCreatures}
        collected={collected}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        currentDate={currentDate}
        hemisphere={hemisphere}
      />

      <footer className="app-footer">
        <button className="clear-data-btn" onClick={() => {
          if (window.confirm('Clear all collection data? This cannot be undone.')) {
            clearAll()
            setSelectedIds(new Set())
          }
        }}>
          Reset Collection Data
        </button>
      </footer>
    </div>
  )
}

export default App
