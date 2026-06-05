import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, Download, Upload, Search, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus, Calendar, DollarSign, FileText, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function loadTrades() { try { return JSON.parse(localStorage.getItem('qt_trades') || '[]') } catch { return [] } }
function saveTrades(data) { localStorage.setItem('qt_trades', JSON.stringify(data)) }

const ACTIONS = ['买入', '卖出', '加仓', '减仓']
const REASONS = ['MA金叉', 'RSI超卖', '放量突破', '财报超预期', '固定止盈', '移动止损', '固定止损', 'MA死叉', 'RSI超买', '时间止损', '主观判断', '其他']

export default function TradeJournal() {
  const [trades, setTrades] = useState(loadTrades)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => { saveTrades(trades) }, [trades])

  function emptyForm() {
    return { stock: '', action: '买入', price: '', shares: '', date: new Date().toISOString().split('T')[0], reason: '', ruleScore: '', followedRule: true, notes: '' }
  }

  const openAdd = () => { setForm(emptyForm()); setEditingId(null); setErrors({}); setShowModal(true) }
  const openEdit = (trade) => { setForm({ ...trade }); setEditingId(trade.id); setErrors({}); setShowModal(true) }

  const handleSave = () => {
    const errs = {}
    if (!form.stock.trim()) errs.stock = '请输入股票代码'
    if (!form.price || form.price <= 0) errs.price = '请输入价格'
    if (!form.shares || form.shares <= 0) errs.shares = '请输入数量'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    if (editingId !== null) {
      setTrades(trades.map(t => t.id === editingId ? { ...form, id: editingId } : t))
    } else {
      setTrades([{ ...form, id: Date.now() }, ...trades])
    }
    setShowModal(false)
  }

  const handleDelete = (id) => setTrades(trades.filter(t => t.id !== id))

  // Stats
  const totalBuy = trades.filter(t => t.action === '买入' || t.action === '加仓').reduce((s, t) => s + t.price * t.shares, 0)
  const totalSell = trades.filter(t => t.action === '卖出' || t.action === '减仓').reduce((s, t) => s + t.price * t.shares, 0)
  const ruleComplianceCount = trades.filter(t => t.followedRule).length
  const complianceRate = trades.length > 0 ? (ruleComplianceCount / trades.length * 100).toFixed(0) : '—'

  // Chart data
  const actionData = [
    { name: '买入', value: trades.filter(t => t.action === '买入').length, color: '#16a34a' },
    { name: '卖出', value: trades.filter(t => t.action === '卖出').length, color: '#dc2626' },
    { name: '加仓', value: trades.filter(t => t.action === '加仓').length, color: '#4ade80' },
    { name: '减仓', value: trades.filter(t => t.action === '减仓').length, color: '#f87171' },
  ]
  const monthlyData = {}
  trades.forEach(t => {
    const m = t.date?.substring(0, 7) || '?'
    if (!monthlyData[m]) monthlyData[m] = { month: m, count: 0, compliant: 0 }
    monthlyData[m].count++
    if (t.followedRule) monthlyData[m].compliant++
  })
  const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))

  // Filter
  const filtered = trades.filter(t => {
    if (search && !t.stock.toUpperCase().includes(search.toUpperCase()) && !t.reason.includes(search)) return false
    if (filterAction && t.action !== filterAction) return false
    return true
  })

  return (
    <div>
      <div className="page-header">
        <h1>交易日志</h1>
        <p>记录每笔买卖操作，AI 会基于此分析你的交易纪律和规则执行率。</p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <QuickStat icon={FileText} label="总交易" value={trades.length} sub={`${trades.filter(t => t.followedRule).length} 笔守规`} color="#0d0d12" />
        <QuickStat icon={DollarSign} label="总买入" value={`$${totalBuy.toFixed(0)}`} sub="含加仓" color="#16a34a" />
        <QuickStat icon={DollarSign} label="总卖出" value={`$${totalSell.toFixed(0)}`} sub="含减仓" color="#dc2626" />
        <QuickStat icon={CheckCircle} label="规则执行率" value={`${complianceRate}%`}
          sub={complianceRate >= 80 ? '优秀' : complianceRate >= 50 ? '需改进' : trades.length === 0 ? '无数据' : '严重问题'}
          color={complianceRate >= 80 ? '#16a34a' : complianceRate >= 50 ? '#f59e0b' : '#dc2626'} />
      </div>

      {/* Charts */}
      <div className="two-col">
        <div className="card">
          <h3>交易分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={actionData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                {actionData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e4e6ea' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            {actionData.filter(d => d.value > 0).map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b6e77' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />{d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>月度交易活动</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" />
              <XAxis dataKey="month" stroke="#9a9da7" fontSize={11} />
              <YAxis stroke="#9a9da7" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e4e6ea', color: '#000' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="总笔数" />
              <Bar dataKey="compliant" fill="#4ade80" radius={[4, 4, 0, 0]} name="守规笔数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="input-with-icon">
            <Search size={13} />
            <input placeholder="搜索股票/原因..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '7px 10px 7px 28px', border: '1px solid #e4e6ea', borderRadius: 7, fontSize: 12, width: 180 }} />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #e4e6ea', borderRadius: 7, fontSize: 12, background: '#fff' }}>
            <option value="">全部操作</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}
          style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
          <Plus size={14} /> 记录交易</button>
      </div>

      {/* Trade table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <FileText size={36} />
            <p style={{ fontWeight: 500 }}>还没有交易记录</p>
            <p style={{ fontSize: 12, marginTop: 4, marginBottom: 14 }}>记录你的买卖操作，AI 会分析你的交易纪律</p>
            <button className="btn btn-primary" onClick={openAdd}
              style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
              <Plus size={13} /> 记录第一笔交易</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>日期</th><th>股票</th><th>操作</th><th>价格</th><th>数量</th>
                <th>金额</th><th>触发原因</th><th>规则评分</th><th>守规</th><th>备注</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ color: '#6b6e77', fontSize: 12 }}>{t.date}</td>
                  <td><strong>{t.stock}</strong></td>
                  <td>
                    <span className="tag" style={{
                      background: t.action.includes('买') || t.action.includes('加') ? '#f0fdf4' : '#fef2f2',
                      color: t.action.includes('买') || t.action.includes('加') ? '#16a34a' : '#dc2626',
                      borderColor: t.action.includes('买') || t.action.includes('加') ? '#bbf7d0' : '#fecaca',
                    }}>
                      {t.action.includes('买') || t.action.includes('加') ? <TrendingUp size={10} style={{ marginRight: 2 }} /> : <TrendingDown size={10} style={{ marginRight: 2 }} />}
                      {t.action}
                    </span>
                  </td>
                  <td>${Number(t.price).toFixed(2)}</td>
                  <td>{t.shares} 股</td>
                  <td><strong>${(t.price * t.shares).toFixed(2)}</strong></td>
                  <td style={{ fontSize: 12, color: '#6b6e77' }}>{t.reason || '—'}</td>
                  <td>{t.ruleScore ? <span className="tag">{t.ruleScore}分</span> : '—'}</td>
                  <td>
                    {t.followedRule
                      ? <CheckCircle size={16} color="#16a34a" />
                      : <XCircle size={16} color="#dc2626" />}
                  </td>
                  <td style={{ fontSize: 11, color: '#6b6e77', maxWidth: 120 }}>{t.notes || '—'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}><Edit3 size={12} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t.id)}><Trash2 size={12} color="#9a9da7" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3>{editingId !== null ? '编辑交易' : '记录交易'}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>股票代码 <span className="hint">必填</span></label>
                <input value={form.stock} onChange={e => { setForm({ ...form, stock: e.target.value.toUpperCase() }); setErrors({ ...errors, stock: '' }) }}
                  placeholder="NVDA" autoFocus style={errors.stock ? { borderColor: '#dc2626' } : {}} />
                {errors.stock && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.stock}</div>}
              </div>
              <div className="form-group">
                <label>操作</label>
                <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>价格 ($) <span className="hint">必填</span></label>
                <input type="number" step="0.01" min="0.01" value={form.price || ''}
                  onChange={e => { setForm({ ...form, price: e.target.value }); setErrors({ ...errors, price: '' }) }}
                  placeholder="148.50" style={errors.price ? { borderColor: '#dc2626' } : {}} />
                {errors.price && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.price}</div>}
              </div>
              <div className="form-group">
                <label>数量（股）<span className="hint">必填</span></label>
                <input type="number" step="0.01" min="0.01" value={form.shares || ''}
                  onChange={e => { setForm({ ...form, shares: e.target.value }); setErrors({ ...errors, shares: '' }) }}
                  placeholder="2" style={errors.shares ? { borderColor: '#dc2626' } : {}} />
                {errors.shares && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.shares}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>交易日期</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>触发原因</label>
                <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                  <option value="">— 选择 —</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>规则评分</label>
                <input value={form.ruleScore || ''} onChange={e => setForm({ ...form, ruleScore: e.target.value })} placeholder="65" />
              </div>
              <div className="form-group">
                <label>是否遵守规则</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className={`btn btn-sm ${form.followedRule ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setForm({ ...form, followedRule: true })}
                    style={form.followedRule ? { background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)', border: 'none' } : {}}>
                    <CheckCircle size={12} /> 是的</button>
                  <button className={`btn btn-sm ${!form.followedRule ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => setForm({ ...form, followedRule: false })}
                    style={!form.followedRule ? { background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)', border: 'none' } : {}}>
                    <XCircle size={12} /> 违规</button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>备注</label>
              <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="例如：感觉NVDA要涨就追进去了，没等规则评分满60分" rows={2} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}><X size={13} /> 取消</button>
              <button className="btn btn-primary" onClick={handleSave}
                style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
                <Save size={13} /> 保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickStat({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon size={12} />{label}</div>
      <div className="value" style={{ color }}>{value}</div>
      <div className="change">{sub}</div>
    </div>
  )
}
