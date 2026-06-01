import { useState } from 'react'
import { AlertTriangle, Shield, Bell } from 'lucide-react'

const riskParams = [
  { id: 1, name: '总资产最大回撤', value: 15, unit: '%', desc: '从最高点回撤超过此值，停止所有新开仓', current: 2.1, status: 'normal' },
  { id: 2, name: '单日亏损上限', value: 20, unit: '$', desc: '当日累计亏损达上限，强制停止交易', current: 0, status: 'normal' },
  { id: 3, name: '单票最大仓位', value: 40, unit: '%', desc: '单只股票不超过总资产此比例', current: 48.6, status: 'breach' },
  { id: 4, name: '行业集中度上限', value: 60, unit: '%', desc: '同一行业/主题仓位总和上限', current: 83, status: 'warn' },
  { id: 5, name: '最大同时持仓', value: 3, unit: '只', desc: '同时持有的股票数量上限', current: 2, status: 'normal' },
  { id: 6, name: '最低现金比例', value: 15, unit: '%', desc: '永远保留的现金缓冲', current: 17.7, status: 'normal' },
  { id: 7, name: '单周最大交易次数', value: 3, unit: '次', desc: '避免过度交易', current: 1, status: 'normal' },
  { id: 8, name: '盈利加仓条件', value: 5, unit: '%', desc: '持仓盈利超过此值后才可加仓', current: '—', status: 'normal' },
]

const alertHistory = [
  { id: 1, type: 'warning', stock: 'NVDA', message: '单票仓位 48.6% 超过 40% 上限', time: '今天 10:30', resolved: false },
  { id: 2, type: 'warning', stock: '—', message: 'AI板块集中度 83% 超过 60% 上限', time: '今天 10:30', resolved: false },
  { id: 3, type: 'info', stock: 'SNDK', message: '接近观察清单买入价 $1,650', time: '昨天 14:22', resolved: true },
  { id: 4, type: 'danger', stock: 'MU', message: '从高点回落 7.8%，接近 8% 移动止损线', time: '05/29 11:05', resolved: true },
]

export default function RiskControl() {
  const getStatusTag = (status) => {
    switch (status) {
      case 'normal': return <span className="tag tag-green">正常</span>
      case 'warn': return <span className="tag tag-yellow">警告</span>
      case 'breach': return <span className="tag tag-red">超标</span>
      default: return null
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>🛡️ 风控中心</h1>
        <p>GPT方案强调：小资金最重要的不是赚多少，而是不亏完。风控是量化系统的最后防线。</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">风控状态</div>
          <div className="value yellow">⚠ 2项警告</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>4/6 参数正常</div>
        </div>
        <div className="stat-card">
          <div className="label">当前回撤</div>
          <div className="value green">2.1%</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>距上限 15% 还有 12.9%</div>
        </div>
        <div className="stat-card">
          <div className="label">今日亏损</div>
          <div className="value green">$0.00</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>距上限 $20</div>
        </div>
        <div className="stat-card">
          <div className="label">VaR (95%)</div>
          <div className="value" style={{ color: '#f59e0b' }}>$18.40</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>单日最大可能亏损</div>
        </div>
      </div>

      <div className="card">
        <h3>⚙️ 风控参数配置</h3>
        <table className="data-table">
          <thead><tr><th>参数</th><th>阈值</th><th>当前值</th><th>状态</th><th>描述</th></tr></thead>
          <tbody>
            {riskParams.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td><span className="tag tag-blue">{p.value}{p.unit}</span></td>
                <td style={{ fontWeight: 600, color: typeof p.current === 'number' && p.current > p.value && p.status !== 'normal' ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                  {typeof p.current === 'number' ? `${p.current}${p.unit}` : p.current}
                </td>
                <td>{getStatusTag(p.status)}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>🔔 告警历史</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertHistory.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12,
                background: a.type === 'danger' ? '#fef2f2' : a.type === 'warning' ? '#fffbeb' : '#eff6ff',
                borderRadius: 8, opacity: a.resolved ? 0.5 : 1,
                borderLeft: `3px solid ${a.type === 'danger' ? '#dc2626' : a.type === 'warning' ? '#f59e0b' : '#2563eb'}`
              }}>
                <AlertTriangle size={16} color={a.type === 'danger' ? '#dc2626' : a.type === 'warning' ? '#f59e0b' : '#2563eb'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {a.stock !== '—' && <strong>[{a.stock}] </strong>}{a.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {a.time} · {a.resolved ? '已解决' : '⚠ 待处理'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--accent-red)', background: '#fef2f2' }}>
          <h3>⚠ GPT 对 $600 小资金的特别提醒</h3>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2.2 }}>
            <li>小资金的<strong style={{ color: 'var(--accent-red)' }}>首要目标不是高收益，是活下来</strong></li>
            <li>$100多现金意味着你<strong style={{ color: '#f59e0b' }}>只能再承受一次交易</strong></li>
            <li>NVDA 仓位 48.6% 超标，建议不要继续加仓 AI 板块</li>
            <li>如果 MU 从高点回落 8%，<strong style={{ color: 'var(--accent-red)' }}>移动止损应立即触发</strong></li>
            <li>不要因为「闪迪还在涨」就追——你现金只够一笔交易，用错代价很大</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
