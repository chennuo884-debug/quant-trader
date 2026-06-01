import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Activity, AlertTriangle, Shield, Wallet } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function loadPositions() {
  try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') }
  catch { return [] }
}

const portfolioSnapshots = [
  { date: '05/20', value: 520 }, { date: '05/22', value: 545 },
  { date: '05/24', value: 538 }, { date: '05/26', value: 568 },
  { date: '05/28', value: 582 }, { date: '05/30', value: 576 },
  { date: '06/01', value: 612 },
]

export default function Dashboard() {
  const positions = loadPositions()
  const totalMarket = positions.reduce((s, p) => s + (p.currentPrice || p.avgCost) * p.shares, 0)
  const totalCost = positions.reduce((s, p) => s + p.avgCost * p.shares, 0)
  const cash = 108.20
  const totalValue = totalMarket + cash
  const pnl = totalMarket - totalCost

  const alerts = [
    { type: 'warn', msg: 'NVDA 仓位 48.6%，超过40%上限', time: '今天' },
    { type: 'warn', msg: 'AI板块集中度 83%，超过60%上限', time: '今天' },
    { type: 'info', msg: '规则执行率 0% — 严重问题，需要改进', time: '复查' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>📊 交易仪表盘</h1>
        <p>欢迎回来，NUO。实时概览你的量化交易状态。</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={Wallet} label="总资产" value={`$${totalValue.toFixed(2)}`}
          change={`↑ +$36.40 (6.3%)`} changeColor="green" />
        <StatCard icon={DollarSign} label="可用现金" value={`$${cash.toFixed(2)}`}
          change={`占比 ${((cash/totalValue)*100).toFixed(1)}%`} />
        <StatCard icon={TrendingUp} label="持仓市值" value={`$${totalMarket.toFixed(2)}`}
          change={pnl >= 0 ? `↑ +$${pnl.toFixed(2)}` : `↓ $${pnl.toFixed(2)}`} changeColor={pnl >= 0 ? 'green' : 'red'} />
        <StatCard icon={Activity} label="今日盈亏" value="+$12.40"
          change="↑ +2.1%" changeColor="green" />
        <StatCard icon={Shield} label="风控状态" value="⚠ 2项"
          change="警告" changeColor="yellow" />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>📈 资产净值曲线</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={portfolioSnapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>🛡️ 当前告警</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12,
                background: a.type === 'warn' ? '#fffbeb' : '#eff6ff',
                borderRadius: 8, borderLeft: `3px solid ${a.type === 'warn' ? '#f59e0b' : '#2563eb'}`,
                fontSize: 13,
              }}>
                <AlertTriangle size={16} color={a.type === 'warn' ? '#f59e0b' : '#2563eb'} style={{ marginTop: 1 }} />
                <div>
                  <div>{a.msg}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 持仓速览 */}
      <div className="card">
        <h3>💼 持仓速览</h3>
        {positions.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={36} />
            <p>暂无持仓数据</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>前往「持仓管理」添加你的第一笔持仓</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>股票</th><th>数量</th><th>成本</th><th>现价</th><th>市值</th><th>盈亏</th><th>占比</th></tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i}>
                  <td><strong>{p.stock}</strong></td>
                  <td>{p.shares}股</td>
                  <td>${p.avgCost.toFixed(2)}</td>
                  <td>${(p.currentPrice || p.avgCost).toFixed(2)}</td>
                  <td>${((p.currentPrice || p.avgCost) * p.shares).toFixed(2)}</td>
                  <td className={((p.currentPrice || p.avgCost) - p.avgCost) >= 0 ? 'green' : 'red'}>
                    {((p.currentPrice || p.avgCost) - p.avgCost) >= 0 ? '+' : ''}
                    ${((p.currentPrice || p.avgCost) - p.avgCost).toFixed(2)}
                  </td>
                  <td>{((p.currentPrice || p.avgCost) * p.shares / totalValue * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, changeColor }) {
  return (
    <div className="stat-card">
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={14} color="var(--text-secondary)" />{label}
      </div>
      <div className="value">{value}</div>
      <div className={`change ${changeColor === 'green' ? 'green' : changeColor === 'red' ? 'red' : changeColor === 'yellow' ? 'yellow' : ''}`}
        style={!['green', 'red', 'yellow'].includes(changeColor) ? { color: 'var(--text-secondary)' } : {}}>
        {change}
      </div>
    </div>
  )
}
