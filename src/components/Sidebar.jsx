import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, Wallet, Shield,
  ClipboardList, Eye, BarChart3, MessageSquare, Settings, TrendingUp
} from 'lucide-react'

const navSections = [
  {
    label: '交易系统', icon: TrendingUp, items: [
      { path: '/', icon: LayoutDashboard, label: '仪表盘', color: '#2563eb' },
      { path: '/rules', icon: GitBranch, label: '规则引擎', color: '#7c3aed' },
      { path: '/risk', icon: Shield, label: '风控中心', color: '#f59e0b' },
      { path: '/review', icon: ClipboardList, label: '交易复盘', color: '#0891b2' },
    ]
  },
  {
    label: '投资管理', icon: Wallet, items: [
      { path: '/positions', icon: Wallet, label: '持仓管理', color: '#16a34a' },
      { path: '/watchlist', icon: Eye, label: '观察列表', color: '#f59e0b' },
      { path: '/charts', icon: BarChart3, label: 'K线图表', color: '#dc2626' },
    ]
  },
  {
    label: 'AI 辅助', icon: MessageSquare, items: [
      { path: '/gpt', icon: MessageSquare, label: 'GPT 分析', color: '#7c3aed' },
      { path: '/api', icon: Settings, label: 'API 设置', color: '#64748b' },
    ]
  },
]

// 这个映射表用来让 active 态下图标变白
const colorMap = {
  '#2563eb': '#2563eb', '#7c3aed': '#7c3aed', '#f59e0b': '#f59e0b',
  '#0891b2': '#0891b2', '#16a34a': '#16a34a', '#dc2626': '#dc2626', '#64748b': '#64748b',
}

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <TrendingUp size={21} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="logo-text">Quant<span>Trader</span></div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section, si) => (
          <div key={si}>
            <div className="nav-section">{section.label}</div>
            {section.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => {
                  // active态下图标容器背景变色，图标变白
                  return {}
                }}
              >
                {({ isActive }) => (
                  <>
                    <div className="nav-icon-wrap" style={isActive ? {
                      background: item.color,
                      boxShadow: `0 3px 10px ${item.color}44`,
                    } : {}}>
                      <item.icon size={17} color={isActive ? '#fff' : item.color} />
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
            {si < navSections.length - 1 && <div className="nav-divider" />}
          </div>
        ))}
      </nav>

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
