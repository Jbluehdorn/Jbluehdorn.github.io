import './VillagerRosterCard.css'

export default function VillagerRosterCard({ info, chattedToday, onToggleChat, onExpand, expanded, upcomingBirthday }) {
  return (
    <div className={`roster-card ${chattedToday ? 'chatted' : ''} ${expanded ? 'expanded' : ''} ${upcomingBirthday?.isToday ? 'birthday-today' : ''}`}
      onClick={onExpand}
    >
      <div className="roster-card-icon-wrap">
        <img src={info.iconImage} alt={info.name} className="roster-card-icon" />
        {upcomingBirthday && (
          <span className="birthday-badge" title={upcomingBirthday.isToday ? 'Birthday today!' : `Birthday in ${upcomingBirthday.daysUntil} day(s)`}>
            🎂
          </span>
        )}
      </div>
      <span className="roster-card-name">{info.name}</span>
      <button
        className={`chat-toggle ${chattedToday ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleChat(); }}
        title={chattedToday ? 'Chatted today ✓' : 'Tap to mark as chatted'}
      >
        💬
      </button>
    </div>
  );
}

export function VillagerDetailPanel({ info, streak, onRemove, chattedToday, onToggleChat }) {
  return (
    <div className="roster-detail-panel">
      <div className="detail-photo">
        {info.photoImage && <img src={info.photoImage} alt={info.name} />}
      </div>
      <div className="detail-fields">
        <h3 className="detail-name">{info.name}</h3>
        <div className="detail-row">
          <span className="detail-label">Personality</span>
          <span className="detail-value">{info.personality}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Species</span>
          <span className="detail-value">{info.species}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Gender</span>
          <span className="detail-value">{info.gender}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Birthday</span>
          <span className="detail-value">{info.birthday || 'Unknown'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Catchphrase</span>
          <span className="detail-value">"{info.catchphrase}"</span>
        </div>
        {info.hobby && (
          <div className="detail-row">
            <span className="detail-label">Hobby</span>
            <span className="detail-value">{info.hobby}</span>
          </div>
        )}
        {streak > 1 && (
          <div className="detail-row">
            <span className="detail-label">Chat streak</span>
            <span className="detail-value">🔥 {streak} days</span>
          </div>
        )}
        <div className="detail-actions">
          <button
            className={`detail-chat-btn ${chattedToday ? 'active' : ''}`}
            onClick={onToggleChat}
          >
            💬 {chattedToday ? 'Chatted today ✓' : 'Mark as chatted'}
          </button>
          <button className="detail-remove-btn" onClick={onRemove}>
            Remove from island
          </button>
        </div>
      </div>
    </div>
  );
}
