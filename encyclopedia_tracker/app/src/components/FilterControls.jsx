import './FilterControls.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FilterControls({
  currentDate,
  onDateChange,
  hemisphere,
  onHemisphereChange,
  showFilter,
  onShowFilterChange,
  useCustomTime,
  onUseCustomTimeChange,
}) {
  const month = currentDate.getMonth();
  const hour = currentDate.getHours();

  return (
    <div className="filter-controls">
      <div className="filter-row">
        <label className="filter-label">
          Hemisphere
          <div className="hemisphere-toggle">
            <button
              className={`hem-btn ${hemisphere === 'north' ? 'active' : ''}`}
              onClick={() => onHemisphereChange('north')}
            >
              🌎 North
            </button>
            <button
              className={`hem-btn ${hemisphere === 'south' ? 'active' : ''}`}
              onClick={() => onHemisphereChange('south')}
            >
              🌍 South
            </button>
          </div>
        </label>
      </div>

      <div className="filter-row">
        <label className="filter-label">
          <input
            type="checkbox"
            checked={useCustomTime}
            onChange={e => onUseCustomTimeChange(e.target.checked)}
          />
          Custom date/time
        </label>
      </div>

      {useCustomTime && (
        <div className="filter-row custom-time">
          <label className="filter-label">
            Month
            <select
              value={month}
              onChange={e => {
                const newDate = new Date(currentDate);
                newDate.setMonth(parseInt(e.target.value));
                onDateChange(newDate);
              }}
            >
              {MONTHS.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </label>
          <label className="filter-label">
            Hour
            <select
              value={hour}
              onChange={e => {
                const newDate = new Date(currentDate);
                newDate.setHours(parseInt(e.target.value));
                onDateChange(newDate);
              }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="filter-row">
        <label className="filter-label">
          Show
          <select value={showFilter} onChange={e => onShowFilterChange(e.target.value)}>
            <option value="available-now">Available now</option>
            <option value="available-month">Available this month</option>
            <option value="not-collected">Not yet collected</option>
            <option value="collected">Already collected</option>
            <option value="all">All creatures</option>
          </select>
        </label>
      </div>
    </div>
  );
}
