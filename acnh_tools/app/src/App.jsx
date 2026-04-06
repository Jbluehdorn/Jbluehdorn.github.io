import { useHashRoute } from './hooks/useHashRoute'
import { useGameDate } from './hooks/useGameDate'
import TabBar from './components/TabBar'
import Encyclopedia from './features/encyclopedia/Encyclopedia'
import VillagerCalc from './features/villager-calc/VillagerCalc'
import VillagerTracker from './features/villager-tracker/VillagerTracker'
import ArtTracker from './features/art-tracker/ArtTracker'

const FEATURE_KEYS = ['encyclopedia', 'villager-calc', 'villager-tracker', 'art-tracker']

export default function App() {
  const { route, navigate, routes } = useHashRoute()
  const gameDate = useGameDate()

  const FEATURES = {
    'encyclopedia': <Encyclopedia gameDate={gameDate} />,
    'villager-calc': <VillagerCalc />,
    'villager-tracker': <VillagerTracker gameDate={gameDate} />,
    'art-tracker': <ArtTracker />,
  }

  return (
    <div className="acnh-app">
      <header className="acnh-header">
        <h1>🏝️ ACNH Toolbox</h1>
        <p className="acnh-subtitle">Your Animal Crossing companion</p>
      </header>

      <TabBar routes={routes} activeRoute={route} onNavigate={navigate} />

      <main className="acnh-content">
        {FEATURES[route] || <p>Tool not found.</p>}
      </main>

      <footer className="acnh-footer">
        <p>ACNH Toolbox — not affiliated with Nintendo</p>
      </footer>
    </div>
  )
}
