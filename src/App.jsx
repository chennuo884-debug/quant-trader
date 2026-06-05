import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import QuantAnalysis from './pages/QuantAnalysis'
import RuleEngine from './pages/RuleEngine'
import PositionTracker from './pages/PositionTracker'
import Watchlist from './pages/Watchlist'
import Charts from './pages/Charts'
import RiskControl from './pages/RiskControl'
import TradeReview from './pages/TradeReview'
import TradeJournal from './pages/TradeJournal'
import GPTAnalysis from './pages/GPTAnalysis'
import SocialMonitor from './pages/SocialMonitor'
import APISettings from './pages/APISettings'
import LoginPage from './pages/LoginPage'
import './App.css'

function ProtectedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f2f3f5', fontSize: 14, color: '#9a9da7',
      }}>
        加载中...
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quant" element={<QuantAnalysis />} />
          <Route path="/rules" element={<RuleEngine />} />
          <Route path="/positions" element={<PositionTracker />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/risk" element={<RiskControl />} />
          <Route path="/review" element={<TradeReview />} />
          <Route path="/journal" element={<TradeJournal />} />
          <Route path="/gpt" element={<GPTAnalysis />} />
          <Route path="/social" element={<SocialMonitor />} />
          <Route path="/api" element={<APISettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
