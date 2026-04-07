import React, { useState, useEffect } from 'react'
import { useEpisodes } from './hooks/useEpisodes'
import { useSpinWheel } from './hooks/useSpinWheel'
import { useAudio } from './hooks/useAudio'
import TapeShelf from './components/TapeShelf.jsx'
import WinnerBanner from './components/WinnerBanner.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { Settings } from 'lucide-react'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const {
    episodes,
    enabledTypes,
    toggleType,
    enableAll,
    disableAll,
    typeCounts,
  } = useEpisodes()

  const { playTick, playWinner } = useAudio()

  const {
    spinning,
    winner,
    highlightId,
    selectedId,
    setEpisodes,
    spin,
    dismissWinner,
  } = useSpinWheel({ playTick, playWinner })

  useEffect(() => {
    setEpisodes(episodes)
  }, [episodes, setEpisodes])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🎬 BOTW Wheel 🎬</h1>
        <div className="header-controls">
          <button
            className="config-icon"
            onClick={() => setSettingsOpen(true)}
            disabled={spinning}
            aria-label="Settings"
            title="Filters"
          >
            <Settings size={22} />
          </button>
          <button
            className="spin-button"
            onClick={spin}
            disabled={spinning || episodes.length === 0}
          >
            {spinning ? 'Picking…' : 'SPIN'}
          </button>
        </div>
      </header>

      <main className="shelf-stage">
        <TapeShelf
          episodes={episodes}
          highlightId={highlightId}
          selectedId={selectedId}
        />
      </main>

      <WinnerBanner winner={winner} onDismiss={dismissWinner} />

      <SettingsPanel
        show={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        enabledTypes={enabledTypes}
        onToggleType={toggleType}
        onEnableAll={enableAll}
        onDisableAll={disableAll}
        typeCounts={typeCounts}
      />
    </div>
  )
}
