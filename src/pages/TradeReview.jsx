import { CheckCircle, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const tradeLog = [
  { id: 1, date: '06/01', stock: 'NVDA', action: '买入', price: 148.50, shares: 2, reason: 'MA 金叉 + RSI 超卖反弹', rules: '40分 ⚠', ok: false, pnl: '+$3.40', notes: '评分不足 60 分，提前进场' },
  { id: 2, date: '05/25', stock: 'MU', action: '买入', price: 85.20, shares: 1, reason: '财报超预期 + 放量突破', rules: '50分 ⚠', ok: false, pnl: '+$7.10', notes: '财报后追涨，买价偏高' },
  { id: 3, date: '05/20', stock: 'SNDK', action: '未买入', price: '—', shares: '—', reason: '规则触发但主观否决', rules: '65分 ✓', ok: false, pnl: '错过+45%', notes: '情绪否决规则！重大教训' },
  { id: 4, date: '05/15', stock: 'NVDA', action: '买入', price: 142.00, shares: 1, reason: '回调买入', rules: '15分', ok: false, pnl: '+$13.00', notes: '运气好但规则执行率低' },
]

const ruleData = [{ month: '5月', compliance: 25 }, { month: '6月', compliance: 0 }]
const pnlData = [{ name: 'NVDA #1', pnl: 13 }, { name: 'MU', pnl: 7.1 }, { name: 'SNDK', pnl: 0 }, { name: 'NVDA #2', pnl: 3.4 }]

export default function TradeReview() {
  return (
    <div>
      <div className="page-header">
        <h1>交易复盘</h1>
        <p>每笔交易必须复盘。不是看盈亏，是看有没有遵守规则。</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="label">总交易次数</div><div className="value">4</div><div className="change">含 1 次错过机会</div></div>
        <div className="stat-card"><div className="label">胜率</div><div className="value" style={{ color: '#16a34a' }}>100%</div><div className="change">3 胜 0 负（已成交）</div></div>
        <div className="stat-card"><div className="label">平均盈利</div><div className="value" style={{ color: '#16a34a' }}>+$7.83</div></div>
        <div className="stat-card"><div className="label">规则执行率</div><div className="value" style={{ color: '#dc2626' }}>0%</div><div className="change" style={{ color: '#dc2626' }}>0/4 全部违规</div></div>
        <div className="stat-card"><div className="label">错失利润</div><div className="value" style={{ color: '#dc2626' }}>+$540+</div><div className="change">SNDK 因情绪否决规则</div></div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>规则执行率趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ruleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" />
              <XAxis dataKey="month" stroke="#9a9da7" fontSize={12} />
              <YAxis stroke="#9a9da7" fontSize={12} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8, color: '#000' }} />
              <Bar dataKey="compliance" fill="#dc2626" radius={[4, 4, 0, 0]} name="执行率 %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>每笔交易盈亏</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" />
              <XAxis dataKey="name" stroke="#9a9da7" fontSize={11} />
              <YAxis stroke="#9a9da7" fontSize={12} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8, color: '#000' }} />
              <Bar dataKey="pnl" fill="#0d0d12" radius={[4, 4, 0, 0]} name="盈亏 $" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>交易日志</h3>
        <table className="data-table">
          <thead><tr><th>日期</th><th>股票</th><th>操作</th><th>价格</th><th>触发原因</th><th>规则评分</th><th>守规?</th><th>盈亏</th><th>备注</th></tr></thead>
          <tbody>
            {tradeLog.map(t => (
              <tr key={t.id}>
                <td style={{ color: '#6b6e77' }}>{t.date}</td>
                <td><strong>{t.stock}</strong></td>
                <td><span className="tag">{t.action}</span></td>
                <td>{typeof t.price === 'number' ? `$${t.price.toFixed(2)}` : t.price}</td>
                <td style={{ color: '#6b6e77', fontSize: 11, maxWidth: 150 }}>{t.reason}</td>
                <td style={{ fontSize: 11, color: '#6b6e77' }}>{t.rules}</td>
                <td>{t.ok ? <CheckCircle size={14} color="#16a34a" /> : <XCircle size={14} color="#dc2626" />}</td>
                <td style={{ fontWeight: 500, color: String(t.pnl).startsWith('+') ? '#16a34a' : '#dc2626' }}>{t.pnl}</td>
                <td style={{ color: '#6b6e77', fontSize: 11, maxWidth: 150 }}>{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>主要问题</h3>
          <ul style={{ paddingLeft: 20, color: '#6b6e77', lineHeight: 2.2, fontSize: 13 }}>
            <li><strong style={{ color: '#dc2626' }}>规则执行率 0%</strong> — 4 笔交易全部未严格执行规则</li>
            <li><strong style={{ color: '#0d0d12' }}>SNDK 最大失误</strong> — 规则触发买入(65分)，情绪否决，错过 45%</li>
            <li><strong style={{ color: '#0d0d12' }}>评分不足也进场</strong> — 3 笔买入评分都不够 60 分</li>
            <li><strong style={{ color: '#0d0d12' }}>FOMO 驱动交易</strong> — 财报后追涨，感觉回调就买</li>
          </ul>
        </div>
        <div className="card">
          <h3>改进方案</h3>
          <ul style={{ paddingLeft: 20, color: '#6b6e77', lineHeight: 2.2, fontSize: 13 }}>
            <li><strong style={{ color: '#16a34a' }}>下笔交易评分 ≥ 60</strong>，否则不做</li>
            <li>每次下单前<strong style={{ color: '#0d0d12' }}>截图规则引擎评分</strong></li>
            <li>设置价格提醒代替盯盘，<strong style={{ color: '#0d0d12' }}>减少情绪干扰</strong></li>
            <li>每周日晚<strong style={{ color: '#0d0d12' }}>强制复盘 30 分钟</strong></li>
            <li>把 SNDK 犯错写在便签贴在屏幕旁</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
