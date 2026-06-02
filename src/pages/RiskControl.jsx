import { AlertTriangle } from 'lucide-react'

const riskParams = [
  { id: 1, name: '总资产最大回撤', value: 15, unit: '%', desc: '从最高点回撤超过此值，停止所有新开仓', current: 2.1, status: 'ok' },
  { id: 2, name: '单日亏损上限', value: 20, unit: '$', desc: '当日累计亏损达上限，强制停止交易', current: 0, status: 'ok' },
  { id: 3, name: '单票最大仓位', value: 40, unit: '%', desc: '单只股票不超过总资产此比例', current: 48.6, status: 'bad' },
  { id: 4, name: '行业集中度上限', value: 60, unit: '%', desc: '同一行业/主题仓位总和上限', current: 83, status: 'warn' },
  { id: 5, name: '最大同时持仓', value: 3, unit: '只', desc: '同时持有的股票数量上限', current: 2, status: 'ok' },
  { id: 6, name: '最低现金比例', value: 15, unit: '%', desc: '永远保留的现金缓冲', current: 17.7, status: 'ok' },
  { id: 7, name: '单周最大交易次数', value: 3, unit: '次', desc: '避免过度交易', current: 1, status: 'ok' },
  { id: 8, name: '盈利加仓条件', value: 5, unit: '%', desc: '持仓盈利超过此值后才可加仓', current: '—', status: 'ok' },
]

const alertHistory = [
  { id: 1, stock: 'NVDA', message: '单票仓位 48.6% 超过 40% 上限', time: '今天 10:30', active: true },
  { id: 2, stock: '—', message: 'AI 板块集中度 83% 超过 60% 上限', time: '今天 10:30', active: true },
  { id: 3, stock: 'SNDK', message: '接近观察清单买入价 $1,650', time: '昨天 14:22', active: false },
  { id: 4, stock: 'MU', message: '从高点回落 7.8%，接近 8% 移动止损线', time: '05/29 11:05', active: false },
]

const statusStyle = { ok: { tag: '正常', color: '#16a34a' }, warn: { tag: '警告', color: '#f59e0b' }, bad: { tag: '超标', color: '#dc2626' } }

export default function RiskControl() {
  return (
    <div>
      <div className="page-header">
        <h1>风控中心</h1>
        <p>小资金最重要的不是赚多少，而是不亏完。风控是量化系统的最后防线。</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="label">风控状态</div><div className="value" style={{ color: '#f59e0b' }}>2 项警告</div><div className="change">4/8 参数正常</div></div>
        <div className="stat-card"><div className="label">当前回撤</div><div className="value" style={{ color: '#16a34a' }}>2.1%</div><div className="change">距上限 15% 还有 12.9%</div></div>
        <div className="stat-card"><div className="label">今日亏损</div><div className="value" style={{ color: '#16a34a' }}>$0</div><div className="change">距上限 $20</div></div>
        <div className="stat-card"><div className="label">VaR (95%)</div><div className="value">$18.40</div><div className="change">单日最大可能亏损</div></div>
      </div>

      <div className="card">
        <h3>风控参数配置</h3>
        <table className="data-table">
          <thead><tr><th>参数</th><th>阈值</th><th>当前值</th><th>状态</th><th>描述</th></tr></thead>
          <tbody>
            {riskParams.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td><span className="tag">{p.value}{p.unit}</span></td>
                <td style={{ fontWeight: 500, color: typeof p.current === 'number' && p.current > p.value ? '#dc2626' : '#0d0d12' }}>
                  {typeof p.current === 'number' ? `${p.current}${p.unit}` : p.current}
                </td>
                <td><span className="tag" style={{ color: statusStyle[p.status].color, borderColor: statusStyle[p.status].color, background: `${statusStyle[p.status].color}08` }}>{statusStyle[p.status].tag}</span></td>
                <td style={{ color: '#6b6e77', fontSize: 12 }}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>告警历史</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertHistory.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12,
                background: a.active ? '#fafbfc' : '#fff', borderRadius: 8, opacity: a.active ? 1 : 0.45,
                borderLeft: `3px solid ${a.active ? '#f59e0b' : '#d0d3d9'}`,
              }}>
                <AlertTriangle size={14} color={a.active ? '#f59e0b' : '#9a9da7'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>
                    {a.stock !== '—' && <strong>[{a.stock}] </strong>}{a.message}
                  </div>
                  <div style={{ fontSize: 10, color: '#9a9da7', marginTop: 2 }}>{a.time} · {a.active ? '⚠ 待处理' : '已解决'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>对小资金的特别提醒</h3>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: '#6b6e77', lineHeight: 2.2 }}>
            <li>小资金的<strong style={{ color: '#dc2626' }}>首要目标不是高收益，是活下来</strong></li>
            <li>$100 多现金意味着你<strong style={{ color: '#f59e0b' }}>只能再承受一次交易</strong></li>
            <li>NVDA 仓位 48.6% 超标，建议不要继续加仓 AI 板块</li>
            <li>如果 MU 从高点回落 8%，<strong style={{ color: '#dc2626' }}>移动止损应立即触发</strong></li>
            <li>不要因为「闪迪还在涨」就追 — 现金只够一笔交易</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
