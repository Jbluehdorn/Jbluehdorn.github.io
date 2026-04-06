import { useState, useMemo } from 'react'
import { useArtworkData } from './hooks/useArtworkData'
import { useArtCollected } from './hooks/useArtCollected'
import ArtCard from './components/ArtCard'
import ArtDetail from './components/ArtDetail'
import './art-tracker.css'

export default function ArtTracker() {
  const { artwork, paintings, statues, loading, error } = useArtworkData();
  const { isCollected, toggle, count } = useArtCollected();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [collectedFilter, setCollectedFilter] = useState('all');
  const [selectedArt, setSelectedArt] = useState(null);

  const normalize = (s) => s.toLowerCase();

  const filtered = useMemo(() => {
    let items = artwork;

    if (typeFilter === 'paintings') items = paintings;
    else if (typeFilter === 'statues') items = statues;

    if (search.trim()) {
      const q = normalize(search);
      items = items.filter(a =>
        normalize(a.name).includes(q) ||
        normalize(a.art_name).includes(q) ||
        normalize(a.author).includes(q)
      );
    }

    if (collectedFilter === 'collected') {
      items = items.filter(a => isCollected(a.name));
    } else if (collectedFilter === 'not-collected') {
      items = items.filter(a => !isCollected(a.name));
    }

    return items;
  }, [artwork, paintings, statues, typeFilter, search, collectedFilter, isCollected]);

  const paintingsCollected = paintings.filter(a => isCollected(a.name)).length;
  const statuesCollected = statues.filter(a => isCollected(a.name)).length;
  const total = artwork.length;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  if (loading) {
    return (
      <div className="art-loading">
        <div className="loading-spinner">🖼️</div>
        <p>Loading artwork data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="art-error">Error loading data: {error}</div>;
  }

  return (
    <div className="art-tracker">
      {/* Stats bar */}
      <div className="art-stats-bar">
        <div className="stats-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-text">{count}/{total} ({pct}%)</span>
        </div>
        <div className="stats-breakdown">
          <span className="stat-item">🖼️ {paintingsCollected}/{paintings.length}</span>
          <span className="stat-item">🗿 {statuesCollected}/{statues.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="art-filters">
        <input
          type="text"
          className="art-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search art, artist, or title..."
          autoComplete="off"
        />
        <div className="art-filter-row">
          <label className="art-filter-label">
            Type
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All ({artwork.length})</option>
              <option value="paintings">Paintings ({paintings.length})</option>
              <option value="statues">Statues ({statues.length})</option>
            </select>
          </label>
          <label className="art-filter-label">
            Show
            <select value={collectedFilter} onChange={(e) => setCollectedFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="not-collected">Not donated</option>
              <option value="collected">Donated</option>
            </select>
          </label>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="art-empty">
          <span className="empty-icon">🖼️</span>
          <p>No artwork matches your filters.</p>
        </div>
      ) : (
        <>
          <div className="art-grid">
            {filtered.map(art => (
              <ArtCard
                key={art.name}
                art={art}
                collected={isCollected(art.name)}
                selected={selectedArt === art.name}
                onClick={() => setSelectedArt(selectedArt === art.name ? null : art.name)}
              />
            ))}
          </div>

          {selectedArt && (() => {
            const art = artwork.find(a => a.name === selectedArt);
            if (!art) return null;
            return (
              <ArtDetail
                art={art}
                collected={isCollected(art.name)}
                onToggle={() => toggle(art.name)}
              />
            );
          })()}
        </>
      )}
    </div>
  );
}
