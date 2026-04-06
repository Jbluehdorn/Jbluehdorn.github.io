import './DiversityPanel.css'

export default function DiversityPanel({ analysis }) {
  const { species, personality, gender, gaps } = analysis;

  return (
    <div className="diversity-panel">
      <h3 className="diversity-title">🌈 Island Diversity</h3>

      {gaps.length > 0 && (
        <div className="diversity-gaps">
          {gaps.map((gap, i) => (
            <span key={i} className={`gap-tag ${gap.type}`}>
              {gap.type === 'warning' ? '⚠️' : 'ℹ️'} {gap.message}
            </span>
          ))}
        </div>
      )}

      <div className="diversity-groups">
        <div className="diversity-group">
          <h4>Species</h4>
          <div className="diversity-bars">
            {species.map(s => (
              <div key={s.name} className="diversity-bar-row">
                <span className="bar-label">{s.name}</span>
                <div className="bar-track">
                  <div className="bar-fill species-fill" style={{ width: `${(s.count / 10) * 100}%` }} />
                </div>
                <span className="bar-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="diversity-group">
          <h4>Personality</h4>
          <div className="diversity-bars">
            {personality.map(p => (
              <div key={p.name} className={`diversity-bar-row ${p.count === 0 ? 'missing' : ''}`}>
                <span className="bar-label">{p.name}</span>
                <div className="bar-track">
                  <div className="bar-fill personality-fill" style={{ width: `${(p.count / 10) * 100}%` }} />
                </div>
                <span className="bar-count">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="diversity-group">
          <h4>Gender</h4>
          <div className="diversity-bars">
            {gender.map(g => (
              <div key={g.name} className="diversity-bar-row">
                <span className="bar-label">{g.name}</span>
                <div className="bar-track">
                  <div className="bar-fill gender-fill" style={{ width: `${(g.count / 10) * 100}%` }} />
                </div>
                <span className="bar-count">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
