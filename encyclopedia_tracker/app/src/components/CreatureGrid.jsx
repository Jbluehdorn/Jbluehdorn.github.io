import { useMemo, useState } from 'react';
import CreatureCard from './CreatureCard';
import './CreatureGrid.css';

export default function CreatureGrid({ creatures, collected, selectedIds, onSelect, currentDate, hemisphere }) {
  const [collapsed, setCollapsed] = useState({});

  const groups = useMemo(() => {
    if (!creatures || creatures.length === 0) return [];
    const map = new Map();
    for (const c of creatures) {
      const loc = c.location || 'Unknown';
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc).push(c);
    }
    return [...map.entries()];
  }, [creatures]);

  const toggleCollapse = (loc) => {
    setCollapsed(prev => ({ ...prev, [loc]: !prev[loc] }));
  };

  if (!creatures || creatures.length === 0) {
    return (
      <div className="creature-grid-empty">
        <div className="empty-icon">🍃</div>
        <p>No creatures match your current filters.</p>
        <p className="empty-hint">Try changing the filter or switching tabs.</p>
      </div>
    );
  }

  return (
    <div className="creature-grid-section">
      {groups.map(([location, group]) => {
        const isCollapsed = !!collapsed[location];
        return (
          <div key={location} className="location-group">
            <h3 className="location-label" onClick={() => toggleCollapse(location)}>
              <span className={`collapse-arrow${isCollapsed ? ' collapsed' : ''}`}>▾</span>
              📍 {location}
              <span className="grid-count">({group.length})</span>
            </h3>
            {!isCollapsed && (
              <div className="creature-grid">
                {group.map(creature => (
                  <CreatureCard
                    key={creature['Unique Entry ID']}
                    creature={creature}
                    collected={collected}
                    selected={selectedIds?.has(creature['Unique Entry ID'])}
                    onSelect={onSelect}
                    currentDate={currentDate}
                    hemisphere={hemisphere}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
