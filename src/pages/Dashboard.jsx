import { useMemo } from 'react'
import {
  TrendingUp, DollarSign, Activity, AlertTriangle, Shield,
  Wallet, Zap, Gauge, TrendingDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine
} from 'recharts'

function loadPositions() {
  try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') }
  catch { return [] }
}

/* ──────────────  Mock net-value data  ────────────── */
function generateNavData() {
  const data = []
  let nav = 580
  const now = new Date()
  for (let i = 60; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const chg = (Math.random() - 0.43) * 8
    nav = Math.max(nav + chg, 520)
    data.push({ date: d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }), nav: +nav.toFixed(2) })
  }
  return data
}

/* ──────────────  Quick risk scoring  ────────────── */
function computeRiskScore(positions, totalValue) {
  if (!positions.length) return { score: 0, level: '无数据', color: '#9a9da7' }
  // concentration risk
  const maxWeight = Math.max(...positions.map(p => {
    const mkt = (p.currentPrice || p.avgCost || 0) * p.shares
    return mkt / totalValue * 100
  }))
  const concentration = maxWeight > 40 ? 3 : maxWeight > 25 ? 2 : 1
  // count
  const count = positions.length > 3 ? 3 : positions.length > 1 ? 2 : 1
  const score = Math.min(10, concentration * 3 + count)
  return {
    score,
    level: score <= 3 ? '低风险' : score <= 6 ? '中等风险' : '⚠ 高风险',
    color: score <= 3 ? '#16a34a' : score <= 6 ? '#f59e0b' : '#dc2626',
  }
}

export default function Dashboard() {
  const positions = useMemo(loadPositions, [])
  const navData = useMemo(generateNavData, [])

  const totalMarket = positions.reduce((s, p) => s + (p.currentPrice || p.avgCost) * p.shares, 0)
  const totalCost = positions.reduce((s, p) => s + p.avgCost * p.shares, 0)
  const cash = 108.20
  const totalValue = totalMarket + cash
  const pnl = totalMarket - totalCost
  const pnlPct = totalCost > 0 ? (pnl / totalCost * 100).toFixed(1) : '—'

  const risk = useMemo(() => computeRiskScore(positions, totalValue), [positions, totalValue])

  // Count alerts
  const alerts = [
    positions.some(p => {
      const w = (p.currentPrice || p.avgCost) * p.shares / totalValue * 100
      return w > 40
    }) && { msg: '单票仓位超过 40% 上限', level: 'warn' },
    positions.length >= 3 && { msg: '板块集中度 > 60%，过度集中于 AI/半导体', level: 'warn' },
    cash / totalValue < 0.15 && { msg: '现金比例低于 15% 安全线', level: 'info' },
    pnl < 0 && { msg: '组合浮亏，检查是否需要止损', level: 'error' },
  ].filter(Boolean)

  // Quick daily P&L simulation
  const todayPnl = navData.length >= 2
    ? (navData[navData.length - 1].nav - navData[navData.length - 2].nav).toFixed(2)
    : '0'
  const todayPnlPositive = Number(todayPnl) >= 0

  return (
    <div>
      <div className="page-header">
        <h1>交易仪表盘</h1>
        <p>欢迎回来，NUO。实时概览你的量化投资组合状态。</p>
      </div>

      {/* Key metrics */}
      <div className="stat-grid">
        <QuickStat
          icon={Wallet} label="总资产" value={`$${totalValue.toFixed(2)}`}
          sub={`现金 $${cash.toFixed(2)} (${(cash/totalValue*100).toFixed(1)}%)`}
        />
        <QuickStat
          icon={TrendingUp} label="持仓市值" value={`$${totalMarket.toFixed(2)}`}
          sub={totalCost > 0 ? `成本 $${totalCost.toFixed(2)}` : `${positions.length} 只持仓`}
        />
        <QuickStat
          icon={pnl >= 0 ? ArrowUpRight : ArrowDownRight}
          label="浮动盈亏"
          value={`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`}
          sub={`${pnl >= 0 ? '+' : ''}${pnlPct}%`}
          trend={pnl >= 0 ? 'up' : 'down'}
        />
        <QuickStat
          icon={Activity}
          label="今日波动"
          value={`${todayPnlPositive ? '+' : ''}$${todayPnl}`}
          sub={todayPnlPositive ? '↑ 日内上涨' : '↓ 日内下跌'}
          trend={todayPnlPositive ? 'up' : 'down'}
        />
        <QuickStat
          icon={Gauge}
          label="风险评分"
          value={`${risk.score}/10`}
          sub={risk.level}
          trend={risk.score <= 3 ? 'ok' : risk.score <= 6 ? 'warn' : 'bad'}
        />
        <QuickStat
          icon={Shield}
          label="风控状态"
          value={`${alerts.length} 项`}
          sub={alerts.length === 0 ? '全部正常' : '需关注'}
          trend={alerts.length === 0 ? 'ok' : 'warn'}
        />
      </div>

      {/* NAV chart + Alerts */}
      <div className="two-col">
        <div className="card">
          <h3>净值走势</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={navData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" />
              <XAxis dataKey="date" stroke="#9a9da7" fontSize={11} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis stroke="#9a9da7" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v) => `$${Number(v).toFixed(2)}`}
                contentStyle={{
                  background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)', color: '#0d0d12',
                }}
              />
              <ReferenceLine y={navData[0]?.nav} stroke="#9a9da7" strokeDasharray="4 4" />
              <defs>
                <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="nav" stroke="#6366f1" strokeWidth={2.5}
                fill="url(#navGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>⚠️ 实时告警</h3>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9a9da7' }}>
              <Shield size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p style={{ fontWeight: 500, color: '#16a34a' }}>✓ 所有指标正常</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12,
                  background: a.level === 'error' ? '#fef2f2' : a.level === 'warn' ? '#fffbeb' : '#f0f9ff',
                  borderRadius: 8, fontSize: 13,
                  borderLeft: `3px solid ${a.level === 'error' ? '#dc2626' : a.level === 'warn' ? '#f59e0b' : '#6366f1'}`,
                }}>
                  <AlertTriangle size={15} color={a.level === 'error' ? '#dc2626' : a.level === 'warn' ? '#f59e0b' : '#6366f1'} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ color: '#0d0d12' }}>{a.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick positions overview */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>持仓概览</h3>
          <span style={{ fontSize: 11, color: '#9a9da7' }}>
            {positions.length} 持仓 | 总市值 ${totalMarket.toFixed(2)}
          </span>
        </div>
        {positions.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={36} />
            <p style={{ fontWeight: 500 }}>暂无持仓数据</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>前往「持仓管理」添加你的第一笔持仓</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>股票</th><th>数量</th><th>成本</th><th>现价</th>
                <th>市值</th><th>盈亏</th><th>占比</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => {
                const price = p.currentPrice || p.avgCost
                const mktVal = price * p.shares
                const pnlPerShare = price - p.avgCost
                const weight = (mktVal / totalValue * 100).toFixed(1)
                return (
                  <tr key={i}>
                    <td><strong>{p.stock}</strong>{p.ticker && <div style={{ fontSize: 10, color: '#9a9da7' }}>{p.ticker}</div>}</td>
                    <td>{p.shares} 股</td>
                    <td>{p.avgCost > 0 ? `$${p.avgCost.toFixed(2)}` : '—'}</td>
                    <td>${price.toFixed(2)}</td>
                    <td><strong>${mktVal.toFixed(2)}</strong></td>
                    <td style={{
                      color: pnlPerShare >= 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                    }}>
                      {pnlPerShare >= 0 ? '+' : ''}${pnlPerShare.toFixed(2)}
                      {' '}<span style={{ fontSize: 10 }}>({(pnlPerShare / p.avgCost * 100).toFixed(1)}%)</span>
                    </td>
                    <td>
                      <span className="tag" style={{
                        color: weight > 40 ? '#dc2626' : weight > 25 ? '#f59e0b' : '#0d0d12',
                      }}>{weight}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ──────────────  Sub-component  ────────────── */
function QuickStat({ icon: Icon, label, value, sub, trend }) {
  const trendColors = {
    up: '#16a34a',
    down: '#dc2626',
    ok: '#16a34a',
    warn: '#f59e0b',
    bad: '#dc2626',
  }
  const accent = trendColors[trend]

  return (
    <div className="stat-card">
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={12} />{label}
      </div>
      <div className="value" style={accent ? { color: accent } : {}}>{value}</div>
      <div className="change">{sub}</div>
    </div>
  )
}
