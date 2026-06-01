import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const tradeLog = [
  { id: 1, date: '06/01', stock: 'NVDA', action: '买入', price: 148.50, shares: 2, reason: 'MA金叉 + RSI超卖反弹', rulesMatched: 'MA金叉(25分)+RSI超卖(15分)=40分⚠低于60分', followRules: false, pnl: '+$3.40', notes: '评分不足60分，提前进场' },
  { id: 2, date: '05/25', stock: 'MU', action: '买入', price: 85.20, shares: 1, reason: '财报超预期 + 放量突破', rulesMatched: '财报(20分)+放量(15分)+MA支撑(15分)=50分⚠', followRules: false, pnl: '+$7.10', notes: '财报后追涨，买价偏高' },
  { id: 3, date: '05/20', stock: 'SNDK', action: '未买入(观察)', price: '1187→1729', shares: '—', reason: '主观觉得太高，但规则触发了买入', rulesMatched: 'MA金叉(30分)+放量(15分)+财报(20分)=65分✓', followRules: false, pnl: '错过+45%', notes: '⚠ 情绪否决规则！重大教训' },
  { id: 4, date: '05/15', stock: 'NVDA', action: '买入', price: 142.00, shares: 1, reason: 'AI芯片需求持续，回调买入', rulesMatched: '仅RSI超卖(15分)=15分', followRules: false, pnl: '+$13.00', notes: '运气好但规则执行率低' },
]

const ruleComplianceData = [
  { month: '5月', compliance: 25, trades: 4 },
  { month: '6月', compliance: 0, trades: 1 },
]

const pnlByTrade = [
  { name: 'NVDA #1', pnl: 13.00 },
  { name: 'MU', pnl: 7.10 },
  { name: 'SNDK(错过)', pnl: 0 },
  { name: 'NVDA #2', pnl: 3.40 },
]

export default function TradeReview() {
  return (
    <div>
      <div className="page-header">
        <h1>📝 交易复盘</h1>
        <p>GPT方案核心：每笔交易必须复盘。不是看盈亏，是看有没有遵守规则。</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">总交易次数</div>
          <div className="value">4</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>含1次错过机会</div>
        </div>
        <div className="stat-card">
          <div className="label">胜率</div>
          <div className="value green">100%</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>3胜0负(已成交)</div>
        </div>
        <div className="stat-card">
          <div className="label">平均盈利</div>
          <div className="value green">+$7.83</div>
        </div>
        <div className="stat-card">
          <div className="label">规则执行率</div>
          <div className="value red">0%</div>
          <div className="change red">⚠ 0/4 全部违规!</div>
        </div>
        <div className="stat-card">
          <div className="label">错失利润</div>
          <div className="value red">+$540+</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>SNDK 因情绪否决规则</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>📊 规则执行率趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ruleComplianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Bar dataKey="compliance" fill="#dc2626" radius={[4, 4, 0, 0]} name="执行率 %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>💰 每笔交易盈亏</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlByTrade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Bar dataKey="pnl" fill="#16a34a" radius={[4, 4, 0, 0]} name="盈亏 $" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>📋 交易日志</h3>
        <table className="data-table">
          <thead>
            <tr><th>日期</th><th>股票</th><th>操作</th><th>价格</th><th>触发原因</th><th>规则评分</th><th>守规?</th><th>盈亏</th><th>备注</th></tr>
          </thead>
          <tbody>
            {tradeLog.map(t => (
              <tr key={t.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                <td><strong>{t.stock}</strong></td>
                <td><span className={`tag ${t.action.includes('买入') ? 'tag-green' : 'tag-yellow'}`}>{t.action}</span></td>
                <td>${typeof t.price === 'number' ? t.price.toFixed(2) : t.price}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12, maxWidth: 160 }}>{t.reason}</td>
                <td style={{ fontSize: 11 }}>{t.rulesMatched}</td>
                <td>{t.followRules ? <CheckCircle size={16} color="#16a34a" /> : <XCircle size={16} color="#dc2626" />}</td>
                <td className={String(t.pnl).startsWith('+') ? 'green' : 'red'}>{t.pnl}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 11, maxWidth: 180 }}>{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="two-col">
        <div className="card" style={{ borderLeft: '3px solid var(--accent-red)', background: '#fef2f2' }}>
          <h3>❌ 主要问题</h3>
          <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 2.2, fontSize: 13 }}>
            <li><strong>规则执行率 0%</strong> — 4笔交易全部未严格执行规则</li>
            <li><strong>SNDK最大失误</strong> — 规则触发买入(65分)，情绪否决，错过45%</li>
            <li><strong>评分不足也进场</strong> — 3笔买入评分都不够60分</li>
            <li><strong>FOMO驱动交易</strong> — MU财报后追涨，NVDA感觉回调就买</li>
          </ul>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--accent-green)', background: '#f0fdf4' }}>
          <h3>✅ 改进方案</h3>
          <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 2.2, fontSize: 13 }}>
            <li><strong>下笔交易评分 ≥ 60</strong>，否则不做</li>
            <li>每次下单前<strong>截图规则引擎评分</strong></li>
            <li>设置价格提醒代替盯盘，<strong>减少情绪干扰</strong></li>
            <li>每周日晚<strong>强制复盘30分钟</strong></li>
            <li>把 SNDK 犯错写在便签贴在屏幕旁</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
