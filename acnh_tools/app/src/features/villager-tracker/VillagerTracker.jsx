import { useState, useMemo } from 'react'
import { useIslandResidents } from '../../hooks/useIslandResidents'
import { useVillagerData } from '../villager-calc/hooks/useVillagerData'
import { createVillagerEngine } from '../villager-calc/hooks/villagerEngine'
import { useChatTracker } from './hooks/useChatTracker'
import { analyzeDiversity, getUpcomingBirthdays } from './hooks/diversity'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmModal from '../../components/ConfirmModal'
import VillagerRosterCard, { VillagerDetailPanel } from './components/VillagerRosterCard'
import './villager-tracker.css'

export default function VillagerTracker({ gameDate }) {
  const { villagers, loading, error } = useVillagerData();
  const { residents, addResident, removeResident, isFull, maxResidents } = useIslandResidents();
  const { currentDate, setCurrentDate, useCustomTime, setUseCustomTime } = gameDate;
  const { hasChattedToday, toggleChat, getChatStreak, chattedCount, today } = useChatTracker(currentDate);
  const [expandedVillager, setExpandedVillager] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [groupBy, setGroupBy] = useState('none');
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const engine = useMemo(() => {
    if (villagers.length === 0) return null;
    return createVillagerEngine(villagers);
  }, [villagers]);

  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const searchResults = useMemo(() => {
    if (!engine || !searchText.trim()) return [];
    const nv = normalize(searchText);
    return engine.getAllVillagers()
      .filter(v => normalize(v.name).startsWith(nv) && !residents.includes(v.name))
      .slice(0, 8);
  }, [engine, searchText, residents]);

  const diversity = useMemo(() => {
    if (!engine) return { species: [], personality: [], gender: [], gaps: [] };
    return analyzeDiversity(residents, engine);
  }, [engine, residents]);

  const upcomingBirthdays = useMemo(() => {
    if (!engine) return [];
    return getUpcomingBirthdays(residents, engine);
  }, [engine, residents]);

  const handleAddResident = (name) => {
    addResident(name);
    setSearchText('');
    setShowSuggestions(false);
    setActiveSearchIndex(-1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSearchIndex >= 0 && searchResults[activeSearchIndex]) {
        handleAddResident(searchResults[activeSearchIndex].name);
      } else if (searchResults.length > 0) {
        handleAddResident(searchResults[0].name);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSearchIndex(-1);
    }
  };

  const handleRemoveResident = async (name) => {
    const yes = await confirm(`Remove ${name} from your island?`);
    if (yes) {
      removeResident(name);
      if (expandedVillager === name) setExpandedVillager(null);
    }
  };

  // Group residents based on groupBy selection
  const groupedResidents = useMemo(() => {
    if (!engine || residents.length === 0) return [];
    if (groupBy === 'none') {
      return [{ label: null, members: residents }];
    }
    const groups = new Map();
    for (const name of residents) {
      const info = engine.getVillagerInfo(name);
      if (!info) continue;
      const key = groupBy === 'species' ? info.species
        : groupBy === 'personality' ? info.personality
        : info.gender;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(name);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([label, members]) => ({ label, members }));
  }, [engine, residents, groupBy]);

  if (loading) {
    return (
      <div className="vt-loading">
        <div className="loading-spinner">🏠</div>
        <p>Loading villager data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="vt-error">Error loading data: {error}</div>;
  }

  return (
    <div className="villager-tracker">
      {/* Header stats */}
      <div className="vt-header-stats">
        <div className="vt-stat">
          <span className="vt-stat-value">{residents.length}/{maxResidents}</span>
          <span className="vt-stat-label">Residents</span>
        </div>
        <div className="vt-stat">
          <span className="vt-stat-value">{chattedCount}/{residents.length}</span>
          <span className="vt-stat-label">Chatted Today</span>
        </div>
        <div className="vt-stat">
          <span className="vt-stat-date">{today}</span>
          <span className="vt-stat-label">ACNH Day</span>
        </div>
      </div>

      {/* Date controls */}
      <div className="vt-date-controls">
        <label className="vt-date-toggle">
          <input
            type="checkbox"
            checked={useCustomTime}
            onChange={e => setUseCustomTime(e.target.checked)}
          />
          Custom date
        </label>
        {useCustomTime && (
          <input
            type="date"
            className="vt-date-input"
            value={currentDate.toISOString().split('T')[0]}
            onChange={e => {
              const d = new Date(e.target.value + 'T12:00:00');
              if (!isNaN(d)) setCurrentDate(d);
            }}
          />
        )}
      </div>

      {/* Birthday alerts */}
      {upcomingBirthdays.length > 0 && (
        <div className="vt-birthdays">
          {upcomingBirthdays.map(b => (
            <span key={b.name} className={`birthday-alert ${b.isToday ? 'today' : ''}`}>
              🎂 {b.isToday ? `${b.name}'s birthday is today!` : `${b.name}'s birthday in ${b.daysUntil} day${b.daysUntil !== 1 ? 's' : ''}`}
            </span>
          ))}
        </div>
      )}

      {/* Add villager search */}
      {!isFull && engine && (
        <div className="vt-add-section">
          <div className="vt-search-wrapper">
            <input
              type="text"
              className="vt-search-input"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setShowSuggestions(true); setActiveSearchIndex(-1); }}
              onFocus={() => searchText.trim() && setShowSuggestions(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Add a villager to your island..."
              autoComplete="off"
            />
            {showSuggestions && searchResults.length > 0 && (
              <ul className="vt-suggestions">
                {searchResults.map((v, i) => (
                  <li key={v.name} className={i === activeSearchIndex ? 'active' : ''} onMouseDown={() => handleAddResident(v.name)} onMouseEnter={() => setActiveSearchIndex(i)}>
                    <img src={v.iconImage} alt="" className="suggestion-icon" />
                    <span>{v.name}</span>
                    <span className="species-tag">{v.species}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Group-by dropdown + Roster */}
      {residents.length === 0 ? (
        <div className="vt-empty">
          <span className="empty-icon">🏝️</span>
          <p>No villagers on your island yet.</p>
          <p className="empty-hint">Search above to add your residents!</p>
        </div>
      ) : (
        <>
          <div className="vt-group-controls">
            <label className="vt-group-label">
              Group by
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                <option value="none">None</option>
                <option value="species">Species</option>
                <option value="personality">Personality</option>
                <option value="gender">Gender</option>
              </select>
            </label>
            {diversity.gaps.length > 0 && (
              <div className="vt-gap-tags">
                {diversity.gaps.map((gap, i) => (
                  <span key={i} className={`gap-tag ${gap.type}`}>
                    {gap.type === 'warning' ? '⚠️' : 'ℹ️'} {gap.message}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="vt-roster">
            {groupedResidents.map(({ label, members }) => (
              <div key={label || 'all'} className="vt-roster-group">
                {label && (
                  <h4 className="vt-group-heading">
                    {label}
                    <span className="vt-group-count">{members.length}</span>
                  </h4>
                )}
                <div className="vt-roster-grid">
                  {members.map(name => {
                    const info = engine?.getVillagerInfo(name);
                    if (!info) return null;
                    const birthday = upcomingBirthdays.find(b => b.name === name);
                    return (
                      <VillagerRosterCard
                        key={name}
                        info={info}
                        chattedToday={hasChattedToday(name)}
                        onToggleChat={() => toggleChat(name)}
                        onExpand={() => setExpandedVillager(expandedVillager === name ? null : name)}
                        expanded={expandedVillager === name}
                        upcomingBirthday={birthday}
                      />
                    );
                  })}
                </div>
                {/* Detail panel renders below the grid for the selected villager in this group */}
                {expandedVillager && members.includes(expandedVillager) && (() => {
                  const info = engine?.getVillagerInfo(expandedVillager);
                  if (!info) return null;
                  return (
                    <VillagerDetailPanel
                      info={info}
                      streak={getChatStreak(expandedVillager)}
                      onRemove={() => handleRemoveResident(expandedVillager)}
                      chattedToday={hasChattedToday(expandedVillager)}
                      onToggleChat={() => toggleChat(expandedVillager)}
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        message={confirmState?.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
