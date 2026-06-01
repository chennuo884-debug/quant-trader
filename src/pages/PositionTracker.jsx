import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X, Download, Upload, Search, Wallet, RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchMultiplePrices } from '../utils/stockApi'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

function loadPositions() {
  try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') }
  catch { return [] }
}
function savePositions(data) {
  localStorage.setItem('qt_positions', JSON.stringify(data))
}

export default function PositionTracker() {
  const [positions, setPositions] = useState(loadPositions)
  const [showModal, setShowModal] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [form, setForm] = useState({ stock: '', ticker: '', shares: 0, avgCost: 0, currentPrice: 0, buyDate: '', notes: '' })
  const [search, setSearch] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  useEffect(() => { savePositions(positions) }, [positions])

  // 启动时自动刷新一次价格
  useEffect(() => {
    if (positions.length > 0) {
      refreshPrices()
    }
  }, []) // eslint-disable-line

  const totalMarket = positions.reduce((s, p) => s + (p.currentPrice || p.avgCost || 0) * p.shares, 0)
  const totalCost = positions.reduce((s, p) => s + (p.avgCost || 0) * p.shares, 0)
  const cash = 108.20
  const totalValue = totalMarket + cash
  const pieData = [
    ...positions.map((p, i) => ({ name: p.stock, value: (p.currentPrice || p.avgCost || 0) * p.shares, color: COLORS[i % COLORS.length] })),
    { name: '现金', value: cash, color: '#94a3b8' },
  ]

  // === 实时价格刷新 ===
  const refreshPrices = async () => {
    if (positions.length === 0) return
    setRefreshing(true)
    const symbols = positions.map(p => p.stock).filter(Boolean)
    try {
      const results = await fetchMultiplePrices(symbols)
      setPositions(prev => prev.map(p => {
        const quote = results[p.stock]
        if (quote && quote.price) {
          return { ...p, currentPrice: quote.price }
        }
        return p
      }))
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (e) {
      console.warn('价格刷新部分失败', e)
    }
    setRefreshing(false)
  }

  // === 表单操作 ===
  const openAdd = () => {
    setForm({ stock: '', ticker: '', shares: '', avgCost: '', currentPrice: '', buyDate: new Date().toISOString().split('T')[0], notes: '' })
    setEditingIdx(null)
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (idx) => {
    setForm({ ...positions[idx] })
    setEditingIdx(idx)
    setFormErrors({})
    setShowModal(true)
  }

  const handleSave = () => {
    const errors = {}
    if (!form.stock.trim()) errors.stock = '请输入股票代码'
    if (!form.shares || form.shares <= 0) errors.shares = '请输入持有数量'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    const entry = {
      ...form,
      shares: +form.shares,
      avgCost: form.avgCost ? +form.avgCost : 0,
      currentPrice: form.currentPrice ? +form.currentPrice : 0,
    }
    if (editingIdx !== null) {
      const updated = [...positions]
      updated[editingIdx] = entry
      setPositions(updated)
    } else {
      const newPositions = [...positions, entry]
      setPositions(newPositions)
      // 新增后自动刷新价格
      if (entry.stock && !entry.currentPrice) {
        setTimeout(() => fetchMultiplePrices([entry.stock]).then(results => {
          const quote = results[entry.stock]
          if (quote && quote.price) {
            setPositions(prev => prev.map(p => p.stock === entry.stock ? { ...p, currentPrice: quote.price } : p))
          }
        }), 300)
      }
    }
    setShowModal(false)
  }

  const handleDelete = (idx) => {
    setPositions(positions.filter((_, i) => i !== idx))
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(positions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'positions_backup.json'; a.click()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data)) setPositions(data)
      } catch { alert('文件格式错误') }
    }
    reader.readAsText(file)
  }

  const filtered = search
    ? positions.filter(p => p.stock.toUpperCase().includes(search.toUpperCase()) || (p.ticker || '').toUpperCase().includes(search.toUpperCase()))
    : positions

  return (
    <div>
      <div className="page-header">
        <h1>💰 持仓管理</h1>
        <p>录入持仓，一键刷新实时股价。成本价为选填，不填也能看市值。</p>
      </div>

      {/* 顶部统计卡 */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">持仓总市值</div>
          <div className="value blue">${totalMarket.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">持仓成本</div>
          <div className="value">${totalCost.toFixed(2)}</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>{totalCost > 0 ? `投入本金` : '未设置成本'}</div>
        </div>
        <div className="stat-card">
          <div className="label">浮动盈亏</div>
          <div className={`value ${totalMarket - totalCost >= 0 ? 'green' : 'red'}`}>
            {totalCost > 0 ? (totalMarket - totalCost >= 0 ? '+' : '-') + '$' + Math.abs(totalMarket - totalCost).toFixed(2) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">持仓数量</div>
          <div className="value">{positions.length}<span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}> 只</span></div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>
            <button className="btn btn-primary btn-sm" onClick={refreshPrices} disabled={refreshing}
              style={{ marginTop: 6, fontSize: 11 }}>
              <RefreshCw size={12} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
              {refreshing ? '刷新中...' : lastRefresh ? `已刷新 ${lastRefresh}` : '刷新价格'}
            </button>
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* 持仓明细表 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0 }}>📦 持仓明细</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-secondary)' }} />
                <input
                  placeholder="搜索..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '8px 12px 8px 32px', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: 13, width: 140, background: '#fff' }}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> 添加</button>
              <button className="btn btn-outline btn-sm" onClick={handleExport} title="导出备份"><Download size={14} /></button>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }} title="导入备份">
                <Upload size={14} />
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Wallet size={40} style={{ opacity: 0.25 }} />
              <p style={{ fontWeight: 600 }}>还没有持仓记录</p>
              <p style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>点击「添加」录入第一笔持仓</p>
              <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> 添加持仓</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>股票</th>
                  <th>数量</th>
                  <th>成本</th>
                  <th>实时价</th>
                  <th>市值</th>
                  <th>盈亏</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const price = p.currentPrice || 0
                  const mktVal = price * p.shares
                  const pnl = p.avgCost > 0 ? (price - p.avgCost) : 0
                  const pnlPct = p.avgCost > 0 ? ((price - p.avgCost) / p.avgCost * 100) : 0
                  return (
                    <tr key={i}>
                      <td>
                        <strong>{p.stock}</strong>
                        {p.ticker && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.ticker}</div>}
                      </td>
                      <td>{p.shares}股</td>
                      <td>{p.avgCost > 0 ? `$${p.avgCost.toFixed(2)}` : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>未设</span>}</td>
                      <td>
                        {price > 0 ? (
                          <span style={{ fontWeight: 600 }}>${price.toFixed(2)}</span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontStyle: 'italic' }}>点击刷新</span>
                        )}
                      </td>
                      <td><strong>${mktVal.toFixed(2)}</strong></td>
                      <td>
                        {p.avgCost > 0 && price > 0 ? (
                          <span className={pnl >= 0 ? 'green' : 'red'} style={{ fontSize: 13 }}>
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}<br />
                            <span style={{ fontSize: 11 }}>({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}><Edit3 size={14} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(i)} style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 仓位分布图 */}
        <div className="card">
          <h3>📊 仓位分布</h3>
          {totalMarket > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value) => `$${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {pieData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: entry.color }} />
                    {entry.name} {(entry.value / totalValue * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <TrendingUp size={36} style={{ opacity: 0.25 }} />
              <p style={{ fontSize: 13 }}>添加持仓后可查看分布</p>
            </div>
          )}

          {/* 快捷说明 */}
          <div style={{ marginTop: 16, padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>💡 使用提示</div>
            <ul style={{ paddingLeft: 16, color: 'var(--text-secondary)', lineHeight: 2 }}>
              <li>填入<strong>股票代码+数量</strong>后，点击「刷新价格」自动获取实时股价</li>
              <li><strong>成本价是选填</strong>的 — 不填也能看市值，只是看不到盈亏</li>
              <li>所有数据保存在浏览器本地，不会上传到任何服务器</li>
            </ul>
          </div>
        </div>
      </div>

      {/* === 弹窗 === */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <h3>{editingIdx !== null ? '✏️ 编辑持仓' : '➕ 添加持仓'}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>股票代码 <span className="hint">必填</span></label>
                <input
                  value={form.stock}
                  onChange={e => { setForm({ ...form, stock: e.target.value.toUpperCase() }); setFormErrors({ ...formErrors, stock: '' }) }}
                  placeholder="例如 NVDA"
                  style={formErrors.stock ? { borderColor: 'var(--accent-red)' } : {}}
                />
                {formErrors.stock && <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {formErrors.stock}</div>}
              </div>
              <div className="form-group">
                <label>中文名 <span className="hint">选填</span></label>
                <input value={form.ticker || ''} onChange={e => setForm({ ...form, ticker: e.target.value })} placeholder="例如 英伟达" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>持有数量（股） <span className="hint">必填</span></label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={form.shares || ''}
                  onChange={e => { setForm({ ...form, shares: e.target.value }); setFormErrors({ ...formErrors, shares: '' }) }}
                  placeholder="例如 2"
                  style={formErrors.shares ? { borderColor: 'var(--accent-red)' } : {}}
                />
                {formErrors.shares && <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> {formErrors.shares}</div>}
              </div>
              <div className="form-group">
                <label>当前价格 ($) <span className="hint">刷新自动填入</span></label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.currentPrice || ''}
                  onChange={e => setForm({ ...form, currentPrice: e.target.value })}
                  placeholder="留空，保存后点刷新"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>平均成本 ($) <span className="hint">选填</span></label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.avgCost || ''}
                  onChange={e => setForm({ ...form, avgCost: e.target.value })}
                  placeholder="不填不影响看市值"
                />
              </div>
              <div className="form-group">
                <label>买入日期</label>
                <input type="date" value={form.buyDate || ''} onChange={e => setForm({ ...form, buyDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>备注</label>
              <input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="例如 MA金叉买入" />
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}><X size={14} /> 取消</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> 保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 全局动画 */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
