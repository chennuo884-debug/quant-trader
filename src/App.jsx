import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import RuleEngine from './pages/RuleEngine'
import PositionTracker from './pages/PositionTracker'
import Watchlist from './pages/Watchlist'
import Charts from './pages/Charts'
import RiskControl from './pages/RiskControl'
import TradeReview from './pages/TradeReview'
import GPTAnalysis from './pages/GPTAnalysis'
import APISettings from './pages/APISettings'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rules" element={<RuleEngine />} />
            <Route path="/positions" element={<PositionTracker />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/risk" element={<RiskControl />} />
            <Route path="/review" element={<TradeReview />} />
            <Route path="/gpt" element={<GPTAnalysis />} />
            <Route path="/api" element={<APISettings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
