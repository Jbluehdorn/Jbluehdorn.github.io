import { useHashRoute } from './hooks/useHashRoute'
import TabBar from './components/TabBar'
import Encyclopedia from './features/encyclopedia/Encyclopedia'
import VillagerCalc from './features/villager-calc/VillagerCalc'
import VillagerTracker from './features/villager-tracker/VillagerTracker'
import ArtTracker from './features/art-tracker/ArtTracker'

const FEATURES = {
  'encyclopedia': Encyclopedia,
  'villager-calc': VillagerCalc,
  'villager-tracker': VillagerTracker,
  'art-tracker': ArtTracker,
}

export default function App() {
  const { route, navigate, routes } = useHashRoute()
  const ActiveFeature = FEATURES[route]

  return (
    <div className="acnh-app">
      <header className="acnh-header">
        <h1>🏝️ ACNH Toolbox</h1>
        <p className="acnh-subtitle">Your Animal Crossing companion</p>
      </header>

      <TabBar routes={routes} activeRoute={route} onNavigate={navigate} />

      <main className="acnh-content">
        {ActiveFeature ? <ActiveFeature /> : <p>Tool not found.</p>}
      </main>

      <footer className="acnh-footer">
        <p>ACNH Toolbox — not affiliated with Nintendo</p>
      </footer>
    </div>
  )
}
