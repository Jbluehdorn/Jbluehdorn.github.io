import './StatsBar.css';

export default function StatsBar({ allCreatures, fish, insects, seaCreatures, collected }) {
  const totalCollected = Object.keys(collected).length;
  const total = allCreatures.length;
  const pct = total > 0 ? Math.round((totalCollected / total) * 100) : 0;

  const fishCollected = fish.filter(c => collected[c['Unique Entry ID']]).length;
  const insectsCollected = insects.filter(c => collected[c['Unique Entry ID']]).length;
  const seaCollected = seaCreatures.filter(c => collected[c['Unique Entry ID']]).length;

  return (
    <div className="stats-bar">
      <div className="stats-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="progress-text">{totalCollected}/{total} ({pct}%)</span>
      </div>
      <div className="stats-breakdown">
        <span className="stat-item">🐟 {fishCollected}/{fish.length}</span>
        <span className="stat-item">🦗 {insectsCollected}/{insects.length}</span>
        <span className="stat-item">🦑 {seaCollected}/{seaCreatures.length}</span>
      </div>
    </div>
  );
}
