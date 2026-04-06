import './TabBar.css'

export default function TabBar({ routes, activeRoute, onNavigate }) {
  return (
    <nav className="acnh-tab-bar" role="tablist">
      {routes.map(({ id, label, emoji }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeRoute === id}
          className={`acnh-tab${activeRoute === id ? ' active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          <span className="tab-emoji">{emoji}</span>
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
