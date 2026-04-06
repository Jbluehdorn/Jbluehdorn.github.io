import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useVillagerData } from './hooks/useVillagerData'
import { createVillagerEngine } from './hooks/villagerEngine'
import { useIslandResidents } from '../../hooks/useIslandResidents'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import './villager-calc.css'

function VillagerSearch({ engine, onAdd, excludeNames, placeholder, id }) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [active, setActive] = useState(-1);
  const wrapperRef = useRef(null);
  const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (!val.trim()) { setSuggestions([]); setActive(-1); return; }
    const nv = normalize(val);
    const filtered = engine.getAllVillagerNames().filter(n =>
      normalize(n).startsWith(nv) && !excludeNames.some(sv => sv.toLowerCase() === n.toLowerCase())
    ).slice(0, 8);
    setSuggestions(filtered);
    setActive(filtered.length > 0 ? 0 : -1);
  };

  const submit = (name) => {
    onAdd(name);
    setText('');
    setSuggestions([]);
    setActive(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0 && suggestions[active]) submit(suggestions[active]); }
    else if (e.key === 'Escape') { setSuggestions([]); setActive(-1); }
  };

  return (
    <div className="vc-search-row" ref={wrapperRef}>
      <div className="vc-search-wrapper">
        <input id={id} type="text" value={text} onChange={handleChange} onKeyDown={handleKeyDown} placeholder={placeholder} autoComplete="off" />
        {suggestions.length > 0 && (
          <ul className="vc-suggestions">
            {suggestions.map((name, i) => {
              const info = engine.getVillagerInfo(name);
              return (
                <li key={name} className={i === active ? 'active' : ''} onMouseDown={() => submit(name)} onMouseEnter={() => setActive(i)}>
                  {info?.iconImage && <img src={info.iconImage} alt="" className="suggestion-icon" />}
                  <span>{name}</span>
                  {info && <span className="species-tag">{info.species}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <button className="btn-primary" onClick={() => { if (active >= 0 && suggestions[active]) submit(suggestions[active]); }}>Add</button>
    </div>
  );
}

export default function VillagerCalc() {
  const { villagers, loading, error } = useVillagerData();
  const { residents: islandVillagers, addResident: addIslandVillager, removeResident: removeIslandVillager } = useIslandResidents();
  const [islandExpanded, setIslandExpanded] = useState(true);
  const [selectedVillagers, setSelectedVillagers] = useLocalStorage('acnh_villager_calc_wishlist', []);
  const [ticketCount, setTicketCount] = useState(1);
  const fileInputRef = useRef(null);

  const engine = useMemo(() => {
    if (villagers.length === 0) return null;
    return createVillagerEngine(villagers);
  }, [villagers]);

  const handleAddIslandVillager = useCallback((name) => {
    if (!engine) return;
    const info = engine.getVillagerInfo(name);
    if (info) addIslandVillager(info.name);
  }, [engine, addIslandVillager]);

  const addVillager = useCallback((name) => {
    if (!engine) return;
    const info = engine.getVillagerInfo(name);
    if (!info) return;
    setSelectedVillagers(prev => {
      if (prev.some(v => v.toLowerCase() === info.name.toLowerCase())) return prev;
      return [...prev, info.name];
    });
  }, [engine, setSelectedVillagers]);

  const removeVillager = useCallback((name) => {
    setSelectedVillagers(prev => prev.filter(v => v !== name));
  }, [setSelectedVillagers]);

  const allExcludedFromIsland = useMemo(() => [...islandVillagers], [islandVillagers]);
  const allExcludedFromWishlist = useMemo(() => [...selectedVillagers, ...islandVillagers], [selectedVillagers, islandVillagers]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      text.split(',').map(n => n.trim()).filter(Boolean).forEach(name => addVillager(name));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTicketChange = (e) => {
    const raw = e.target.value;
    if (raw === '') { setTicketCount(''); return; }
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 1) setTicketCount(val);
  };

  const handleTicketBlur = () => {
    if (ticketCount === '' || ticketCount < 1) setTicketCount(1);
  };

  const results = useMemo(() => {
    if (!engine || selectedVillagers.length === 0 || ticketCount === '' || ticketCount < 1) return null;
    return engine.calculateResults(selectedVillagers, ticketCount, islandVillagers);
  }, [engine, selectedVillagers, ticketCount, islandVillagers]);

  const formatPercent = (p) => {
    if (p >= 1) return '100%';
    if (p < 0.0001) return '<0.01%';
    return (p * 100).toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="vc-loading">
        <div className="loading-spinner">🎫</div>
        <p>Loading villager data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="vc-error">Error loading data: {error}</div>;
  }

  if (!engine) return null;

  return (
    <div className="villager-calc">
      <div className="vc-section-box">
        <div className="vc-section-header" onClick={() => setIslandExpanded(prev => !prev)}>
          <span className="vc-section-header-left">
            <span className={"vc-collapse-arrow" + (islandExpanded ? " expanded" : "")}>▶</span>
            <label>Your Island Residents ({islandVillagers.length}/10)</label>
          </span>
        </div>
        {islandExpanded && <p className="vc-section-hint">Your island residents won't show up on mystery islands</p>}
        {islandExpanded && (
          <div className="vc-section-body">
            <VillagerSearch engine={engine} onAdd={handleAddIslandVillager} excludeNames={allExcludedFromIsland} placeholder="Add a current resident..." id="island-search" />
            {islandVillagers.length > 0 && (
              <div className="vc-pills" style={{marginTop: '8px'}}>
                {islandVillagers.map(name => {
                  const info = engine.getVillagerInfo(name);
                  return (
                    <span key={name} className="pill island" title={name}>
                      {info?.iconImage && <img src={info.iconImage} alt={name} className="pill-icon" />}
                      <span className="pill-name">{name}</span>
                      <button className="remove-btn" onClick={() => removeIslandVillager(name)}>✕</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="vc-input-section">
        <div className="vc-search-container">
          <label className="section-label" htmlFor="villager-search">Dreamie Wishlist</label>
          <VillagerSearch engine={engine} onAdd={addVillager} excludeNames={allExcludedFromWishlist} placeholder="Add a dreamie..." id="villager-search" />
        </div>

        <div className="vc-file-upload">
          <label className="section-label">Upload CSV</label>
          <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>
            📁 Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {selectedVillagers.length > 0 && (
        <div className="vc-villager-list">
          <label className="section-label">Dreamie Wishlist ({selectedVillagers.length})</label>
          <div className="vc-pills">
            {selectedVillagers.map(name => {
              const info = engine.getVillagerInfo(name);
              return (
                <span key={name} className="pill" title={name}>
                  {info?.iconImage && <img src={info.iconImage} alt={name} className="pill-icon" />}
                  <span className="pill-name">{name}</span>
                  <button className="remove-btn" onClick={() => removeVillager(name)}>✕</button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="vc-ticket-section">
        <label className="section-label" htmlFor="ticket-count">Number of Tickets (Attempts)</label>
        <div className="vc-ticket-input-row">
          <button className="vc-ticket-btn" onClick={() => setTicketCount(prev => Math.max(1, prev - 1))}>−</button>
          <input
            id="ticket-count"
            type="number"
            min="1"
            value={ticketCount}
            onChange={handleTicketChange}
            onBlur={handleTicketBlur}
          />
          <button className="vc-ticket-btn" onClick={() => setTicketCount(prev => prev + 1)}>+</button>
        </div>
      </div>

      {results && (
        <div className="vc-output-section">
          <h2>Results — {results.attempts} Ticket{results.attempts !== 1 ? 's' : ''}</h2>

          {results.mostLikely && (
            <div className="vc-highlight-box">
              <span className="vc-highlight-label">Most Likely to See</span>
              <div className="vc-highlight-content">
                {results.mostLikely.icon && <img src={results.mostLikely.icon} alt="" className="vc-highlight-icon" />}
                <span className="vc-highlight-name">{results.mostLikely.name}</span>
                <span className="vc-highlight-value">{formatPercent(results.mostLikely.probabilityInAttempts)}</span>
              </div>
            </div>
          )}

          <div className="vc-highlight-box">
            <span className="vc-highlight-label">Chance of Seeing At Least One From Your List</span>
            <span className="vc-highlight-value big">{formatPercent(results.combinedProbability)}</span>
          </div>

          <div className="vc-individual-results">
            <h3>Individual Probabilities</h3>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th className="hide-mobile">Villager</th>
                  <th className="hide-mobile">Species</th>
                  <th>Per Attempt</th>
                  <th>In {results.attempts} Attempt{results.attempts !== 1 ? 's' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {results.individual.map(r => (
                  <tr key={r.name}>
                    <td>{r.icon && <img src={r.icon} alt={r.name} title={r.name} className="vc-table-icon" />}</td>
                    <td className="hide-mobile">{r.name}</td>
                    <td className="hide-mobile">{r.species}</td>
                    <td>{formatPercent(r.singleProbability)}</td>
                    <td className="vc-prob-cell">{formatPercent(r.probabilityInAttempts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
