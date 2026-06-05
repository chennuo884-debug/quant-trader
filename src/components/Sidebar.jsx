import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, Wallet, Shield,
  ClipboardList, Eye, BarChart3, MessageSquare, Settings,
  TrendingUp, Activity, Zap, ChevronDown, ChevronUp,
  LineChart, Target, PieChart, FileText, Radio, LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navSections = [
  {
    label: '概览',
    items: [
      { path: '/', icon: LayoutDashboard, label: '仪表盘' },
      { path: '/quant', icon: Activity, label: '量化分析' },
    ],
  },
  {
    label: '交易核心',
    items: [
      { path: '/rules', icon: GitBranch, label: '规则引擎' },
      { path: '/positions', icon: Wallet, label: '持仓管理' },
      { path: '/watchlist', icon: Eye, label: '观察列表' },
      { path: '/charts', icon: BarChart3, label: 'K线图表' },
    ],
  },
  {
    label: '风控 & 复盘',
    items: [
      { path: '/risk', icon: Shield, label: '风控中心' },
      { path: '/review', icon: ClipboardList, label: '交易复盘' },
      { path: '/journal', icon: FileText, label: '交易日志' },
    ],
  },
  {
    label: '智能辅助',
    items: [
      { path: '/gpt', icon: MessageSquare, label: 'AI 分析' },
      { path: '/social', icon: Radio, label: '社交监控' },
      { path: '/api', icon: Settings, label: 'API 设置' },
    ],
  },
]

export default function Sidebar({ user }) {
  const { logout } = useAuth()
  const [expandedSections, setExpandedSections] = useState({
    '概览': true,
    '交易核心': true,
    '风控 & 复盘': true,
    '智能辅助': true,
  })

  const toggleSection = (label) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={20} color="#fff" strokeWidth={1.8} />
        </div>
        <div className="logo-text">
          Quant<span>Trader</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="nav-section">
            <button
              className="nav-section-header"
              onClick={() => toggleSection(section.label)}
            >
              <span>{section.label}</span>
              {expandedSections[section.label]
                ? <ChevronUp size={12} />
                : <ChevronDown size={12} />
              }
            </button>

            {expandedSections[section.label] && (
              <div className="nav-section-items">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="nav-icon-wrap">
                      <item.icon size={15} />
                    </div>
                    <span>{item.label}</span>
                    {item.path === '/quant' && (
                      <span className="nav-badge">NEW</span>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-stats">
          <div className="footer-stat">
            <div className="footer-stat-value">$612.00</div>
            <div className="footer-stat-label">总资产</div>
          </div>
          <div className="footer-stat-divider" />
          <div className="footer-stat">
            <div className="footer-stat-value" style={{ color: '#4ade80' }}>+$23.50</div>
            <div className="footer-stat-label">今日盈亏</div>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">N</div>
          <div className="user-info" style={{ flex: 1 }}>
            <div className="user-name">{user?.email?.split('@')[0] || 'NUO'}</div>
            <div className="user-role">{user?.email || '量化投资者'}</div>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-sm" title="退出登录" style={{ color: '#5a5d6e' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
