import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit3, Save, X, Download, Upload, Search, Wallet, RefreshCw, AlertCircle, TrendingUp, Loader2, ExternalLink, Newspaper } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#0d0d12', '#333', '#555', '#777', '#999', '#bbb']

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
  const [form, setForm] = useState({ stock: '', ticker: '', shares: '', avgCost: '', currentPrice: '', buyDate: '', notes: '' })
  const [search, setSearch] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [loadingPrices, setLoadingPrices] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])
  useEffect(() => { savePositions(positions) }, [positions])
  useEffect(() => { if (positions.length > 0) refreshPrices() }, []) // eslint-disable-line

  const totalMarket = positions.reduce((s, p) => s + (p.currentPrice || p.avgCost || 0) * p.shares, 0)
  const totalCost = positions.reduce((s, p) => s + (p.avgCost || 0) * p.shares, 0)
  const cash = 108.20
  const totalValue = totalMarket + cash
  const pieData = [
    ...positions.map((p, i) => ({ name: p.stock, value: (p.currentPrice || p.avgCost || 0) * p.shares, color: COLORS[i % COLORS.length] })),
    { name: '现金', value: cash, color: '#d0d3d9' },
  ]

  const refreshPrices = async () => {
    if (positions.length === 0) return
    setRefreshing(true)
    const symbols = positions.map(p => p.stock).filter(Boolean)
    setLoadingPrices(new Set(symbols))

    // Fetch real prices from backend Yahoo Finance proxy
    const results = {}
    await Promise.all(symbols.map(async (sym) => {
      try {
        const res = await fetch(`/api/stock/${sym}`)
        if (res.ok) {
          const data = await res.json()
          if (data?.quote?.price) {
            results[sym] = { price: data.quote.price, change: data.quote.change, changePercent: data.quote.changePercent }
          }
        }
      } catch {}
    }))

    if (!mountedRef.current) return
    setPositions(prev => prev.map(p => {
      const quote = results[p.stock]
      if (quote && quote.price != null) return { ...p, currentPrice: quote.price }
      return p
    }))
    setLastRefresh(new Date().toLocaleTimeString())
    setRefreshing(false)
    setLoadingPrices(new Set())
  }

  const openAdd = () => {
    setForm({ stock: '', ticker: '', shares: '', avgCost: '', currentPrice: '', buyDate: new Date().toISOString().split('T')[0], notes: '' })
    setEditingIdx(null); setFormErrors({}); setShowModal(true)
  }

  const openEdit = (idx) => {
    setForm({ ...positions[idx] }); setEditingIdx(idx); setFormErrors({}); setShowModal(true)
  }

  const handleSave = async () => {
    const errors = {}
    if (!form.stock.trim()) errors.stock = '请输入股票代码'
    if (!form.shares || form.shares <= 0) errors.shares = '请输入持有数量'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    setSaving(true)
    const entry = { ...form, shares: +form.shares, avgCost: form.avgCost ? +form.avgCost : 0, currentPrice: form.currentPrice ? +form.currentPrice : 0 }

    if (editingIdx !== null) {
      const u = [...positions]; u[editingIdx] = entry; setPositions(u)
    } else {
      setPositions([...positions, entry])
    }

    if (entry.stock && !entry.currentPrice) {
      const sym = entry.stock
      setLoadingPrices(prev => new Set([...prev, sym]))
      try {
        const results = await fetchMultiplePrices([sym])
        if (!mountedRef.current) return
        const quote = results[sym]
        if (quote && quote.price != null) {
          setPositions(prev => prev.map(p => p.stock === sym ? { ...p, currentPrice: quote.price } : p))
        }
      } catch {}
      setLoadingPrices(prev => { const n = new Set(prev); n.delete(sym); return n })
    }
    setShowModal(false); setSaving(false)
  }

  const handleDelete = (idx) => setPositions(positions.filter((_, i) => i !== idx))

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(positions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'positions_backup.json'; a.click()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try { const data = JSON.parse(ev.target.result); if (Array.isArray(data)) setPositions(data) }
      catch { alert('文件格式错误') }
    }
    reader.readAsText(file)
  }

  const filtered = search
    ? positions.filter(p => p.stock.toUpperCase().includes(search.toUpperCase()) || (p.ticker || '').toUpperCase().includes(search.toUpperCase()))
    : positions

  return (
    <div>
      <div className="page-header">
        <h1>持仓管理</h1>
        <p>录入持仓，一键刷新实时股价。成本价为选填。</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="label">持仓总市值</div><div className="value">${totalMarket.toFixed(2)}</div></div>
        <div className="stat-card"><div className="label">持仓成本</div><div className="value">${totalCost.toFixed(2)}</div><div className="change">{totalCost > 0 ? '投入本金' : '未设置成本'}</div></div>
        <div className="stat-card">
          <div className="label">浮动盈亏</div>
          <div className="value" style={{ color: totalMarket - totalCost >= 0 ? '#16a34a' : '#dc2626' }}>
            {totalCost > 0 ? (totalMarket - totalCost >= 0 ? '+' : '-') + '$' + Math.abs(totalMarket - totalCost).toFixed(2) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">持仓数量</div>
          <div className="value">{positions.length}<span style={{ fontSize: 14, fontWeight: 400, color: '#9a9da7' }}> 只</span></div>
          <div className="change" style={{ color: '#6b6e77' }}>
            <button className="btn btn-outline btn-sm" onClick={refreshPrices} disabled={refreshing} style={{ marginTop: 6, fontSize: 11 }}>
              {refreshing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
              {refreshing ? '刷新中...' : lastRefresh ? `已刷新 ${lastRefresh}` : '刷新价格'}
            </button>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0 }}>持仓明细</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="input-with-icon">
                <Search size={13} />
                <input placeholder="搜索..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ padding: '6px 10px 6px 28px', border: '1px solid #e4e6ea', borderRadius: 6, fontSize: 12, width: 130, background: '#fff' }} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13} /> 添加</button>
              <button className="btn btn-outline btn-sm" onClick={handleExport} title="导出"><Download size={13} /></button>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }} title="导入">
                <Upload size={13} />
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Wallet size={36} />
              <p style={{ fontWeight: 500 }}>还没有持仓记录</p>
              <p style={{ fontSize: 12, marginTop: 4, marginBottom: 14 }}>点击「添加」录入第一笔持仓</p>
              <button className="btn btn-primary" onClick={openAdd}><Plus size={13} /> 添加持仓</button>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>股票</th><th>数量</th><th>成本</th><th>实时价</th><th>市值</th><th>盈亏</th><th>操作</th></tr></thead>
              <tbody>
                {filtered.map((p, i) => {
                  const price = p.currentPrice || 0
                  const mktVal = price * p.shares
                  const pnl = p.avgCost > 0 ? (price - p.avgCost) : 0
                  const pnlPct = p.avgCost > 0 ? ((price - p.avgCost) / p.avgCost * 100) : 0
                  const isLoading = loadingPrices.has(p.stock)
                  return (
                    <tr key={i}>
                      <td><strong>{p.stock}</strong>{p.ticker && <div style={{ fontSize: 10, color: '#9a9da7' }}>{p.ticker}</div>}</td>
                      <td>{p.shares} 股</td>
                      <td>{p.avgCost > 0 ? `$${p.avgCost.toFixed(2)}` : <span style={{ color: '#9a9da7', fontSize: 11 }}>未设</span>}</td>
                      <td>
                        {isLoading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#9a9da7', fontSize: 11 }}><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />获取中</span>
                          : price > 0 ? <span style={{ fontWeight: 500 }}>${price.toFixed(2)}</span>
                          : <span style={{ color: '#9a9da7', fontSize: 11 }}>点击刷新</span>}
                      </td>
                      <td><strong>${mktVal.toFixed(2)}</strong></td>
                      <td style={{ fontSize: 12, color: p.avgCost > 0 && price > 0 ? (pnl >= 0 ? '#16a34a' : '#dc2626') : '#9a9da7' }}>
                        {p.avgCost > 0 && price > 0 ? <>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}<br /><span style={{ fontSize: 10 }}>({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span></> : '—'}
                      </td>
                      <td style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)} title="编辑"><Edit3 size={13} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(i)} title="删除"><Trash2 size={13} color="#9a9da7" /></button>
                        <a href={`https://finance.yahoo.com/quote/${p.stock}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm" title="Yahoo Finance" style={{ textDecoration: 'none' }}><ExternalLink size={13} color="#6366f1" /></a>
                        <a href={`https://finance.yahoo.com/quote/${p.stock}/news`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm" title="新闻" style={{ textDecoration: 'none' }}><Newspaper size={13} color="#f59e0b" /></a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>仓位分布</h3>
          {totalMarket > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8, color: '#000' }}
                    formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {pieData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b6e77' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
                    {entry.name} {(entry.value / totalValue * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state"><TrendingUp size={32} /><p style={{ fontSize: 12 }}>添加持仓后可查看分布</p></div>
          )}

          <div style={{ marginTop: 16, padding: 14, background: '#fafbfc', borderRadius: 8, fontSize: 11, color: '#6b6e77', lineHeight: 2 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#0d0d12' }}>使用提示</div>
            <ul style={{ paddingLeft: 16 }}>
              <li>填入<strong>股票代码+数量</strong>后点击「刷新价格」自动获取实时股价</li>
              <li><strong>成本价是选填</strong> — 不填也能看市值</li>
              <li>所有数据保存在浏览器本地，不会上传到任何服务器</li>
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <h3>{editingIdx !== null ? '编辑持仓' : '添加持仓'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>股票代码 <span className="hint">必填</span></label>
                <input value={form.stock} onChange={e => { setForm({ ...form, stock: e.target.value.toUpperCase() }); setFormErrors({ ...formErrors, stock: '' }) }}
                  placeholder="例如 NVDA" autoFocus style={formErrors.stock ? { borderColor: '#dc2626' } : {}} />
                {formErrors.stock && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} /> {formErrors.stock}</div>}
              </div>
              <div className="form-group">
                <label>中文名 <span className="hint">选填</span></label>
                <input value={form.ticker || ''} onChange={e => setForm({ ...form, ticker: e.target.value })} placeholder="例如 英伟达" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>持有数量（股） <span className="hint">必填</span></label>
                <input type="number" step="0.01" min="0.01" value={form.shares || ''}
                  onChange={e => { setForm({ ...form, shares: e.target.value }); setFormErrors({ ...formErrors, shares: '' }) }}
                  placeholder="例如 2" style={formErrors.shares ? { borderColor: '#dc2626' } : {}} />
                {formErrors.shares && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} /> {formErrors.shares}</div>}
              </div>
              <div className="form-group">
                <label>当前价格 ($) <span className="hint">自动获取</span></label>
                <input type="number" step="0.01" min="0" value={form.currentPrice || ''}
                  onChange={e => setForm({ ...form, currentPrice: e.target.value })} placeholder="留空自动获取实时价" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>平均成本 ($) <span className="hint">选填</span></label>
                <input type="number" step="0.01" min="0" value={form.avgCost || ''}
                  onChange={e => setForm({ ...form, avgCost: e.target.value })} placeholder="不填不影响看市值" />
              </div>
              <div className="form-group">
                <label>买入日期</label>
                <input type="date" value={form.buyDate || ''} onChange={e => setForm({ ...form, buyDate: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>备注</label>
              <input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="例如 MA 金叉买入" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving}><X size={13} /> 取消</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> 获取价格...</> : <><Save size={13} /> 保存</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
