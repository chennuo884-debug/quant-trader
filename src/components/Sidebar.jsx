import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, Wallet, Shield,
  ClipboardList, Eye, BarChart3, MessageSquare, Settings, TrendingUp
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/rules', icon: GitBranch, label: '规则引擎' },
  { path: '/positions', icon: Wallet, label: '持仓管理' },
  { path: '/watchlist', icon: Eye, label: '观察列表' },
  { path: '/charts', icon: BarChart3, label: 'K线图表' },
  { path: '/risk', icon: Shield, label: '风控中心' },
  { path: '/review', icon: ClipboardList, label: '交易复盘' },
  { path: '/gpt', icon: MessageSquare, label: 'GPT 分析' },
  { path: '/api', icon: Settings, label: 'API 设置' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <TrendingUp size={17} color="#000" strokeWidth={2.5} />
        </div>
        <div className="logo-text">Quant<span>Trader</span></div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrap">
              <item.icon size={16} />
            </div>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info at bottom */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">N</div>
          <div>
            <div className="user-name">NUO</div>
            <div className="user-role">个人投资者</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
