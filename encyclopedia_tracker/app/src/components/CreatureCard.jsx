import { getAvailabilityStatus, formatTimeOfDay, formatMonths } from '../utils/availability';
import './CreatureCard.css';

export default function CreatureCard({ creature, collected, selected, onSelect, currentDate, hemisphere }) {
  const isCollected = !!collected[creature['Unique Entry ID']];
  const isSelected = !!selected;
  const status = getAvailabilityStatus(creature, currentDate, hemisphere);
  const months = hemisphere === 'north' ? creature.timeOfYear?.north : creature.timeOfYear?.south;
  const weather = creature.weather;

  return (
    <div
      className={`creature-card ${status} ${isCollected ? 'collected' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(creature['Unique Entry ID'])}
      title={`${creature.Name}\n${isCollected ? '✓ Collected' : 'Not collected'}`}
    >
      <div className="card-icon">
        {creature.iconUrl ? (
          <img
            src={creature.iconUrl}
            alt={creature.Name}
            loading="lazy"
            width="64"
            height="64"
          />
        ) : (
          <div className="placeholder-icon">?</div>
        )}
        {isCollected && <div className="collected-badge">✓</div>}
      </div>
      <div className="card-name">{creature.Name}</div>
      <div className="card-details">
        <span className="card-time">{formatTimeOfDay(creature.timeOfDay)}</span>
        <span className="card-months">{formatMonths(months)}</span>
        {weather && <span className="card-weather">{weather.charAt(0).toUpperCase() + weather.slice(1)}</span>}
      </div>
    </div>
  );
}
