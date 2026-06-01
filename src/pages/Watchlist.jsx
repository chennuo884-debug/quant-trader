import { useState, useEffect } from 'react'
import { Plus, Trash2, Bell, TrendingUp, TrendingDown, X, Save, Search } from 'lucide-react'
import { MiniChart } from '../components/StockChart'

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem('qt_watchlist') || '[]') }
  catch { return [] }
}
function saveWatchlist(data) {
  localStorage.setItem('qt_watchlist', JSON.stringify(data))
}

export default function Watchlist() {
  const [items, setItems] = useState(loadWatchlist)
  const [showModal, setShowModal] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [form, setForm] = useState({ stock: '', ticker: '', currentPrice: 0, targetBuy: 0, notes: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { saveWatchlist(items) }, [items])

  const openAdd = () => {
    setForm({ stock: '', ticker: '', currentPrice: 0, targetBuy: 0, notes: '' })
    setEditingIdx(null)
    setShowModal(true)
  }

  const openEdit = (idx) => {
    setForm({ ...items[idx] })
    setEditingIdx(idx)
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.stock) return
    if (editingIdx !== null) {
      const updated = [...items]
      updated[editingIdx] = { ...form }
      setItems(updated)
    } else {
      setItems([...items, { ...form }])
    }
    setShowModal(false)
  }

  const handleDelete = (idx) => setItems(items.filter((_, i) => i !== idx))

  const filtered = search
    ? items.filter(w => w.stock.toUpperCase().includes(search.toUpperCase()) || (w.ticker || '').toUpperCase().includes(search.toUpperCase()))
    : items

  return (
    <div>
      <div className="page-header">
        <h1>👀 观察列表</h1>
        <p>跟踪你感兴趣的股票，设定目标买入价。不要因为「涨了」就追——等它回到你的买入区间。</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
          <input
            placeholder="搜索观察股票..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 12px 9px 34px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, width: 220 }}
          />
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14} /> 添加观察</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bell size={40} />
            <p>观察列表为空</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>添加你感兴趣的股票，设定目标买入价，避免FOMO追涨</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}><Plus size={14} /> 添加第一只股票</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((w, i) => {
            const gap = w.targetBuy > 0 ? ((w.currentPrice - w.targetBuy) / w.targetBuy * 100) : 0
            return (
              <div key={i} className="card" style={{ padding: 20, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}><Plus size={14} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(i)} style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{w.stock}</div>
                    {w.ticker && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.ticker}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>${w.currentPrice.toLocaleString()}</div>
                    {gap !== 0 && (
                      <div style={{ fontSize: 12, color: gap > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {gap > 0 ? '↑ ' : '↓ '}{Math.abs(gap).toFixed(1)}% vs 目标价
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <MiniChart symbol={w.stock} width={300} height={50} />
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>目标买入: </span>
                    <span className="tag tag-green">${w.targetBuy.toLocaleString()}</span>
                  </div>
                  {w.targetBuy > 0 && w.currentPrice > w.targetBuy && (
                    <div style={{ color: 'var(--accent-red)' }}>
                      还需回调 {gap.toFixed(1)}% 才到买点
                    </div>
                  )}
                  {w.targetBuy > 0 && w.currentPrice <= w.targetBuy && (
                    <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                      ✅ 已到买入区间!
                    </div>
                  )}
                </div>
                {w.notes && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', padding: 8, background: '#f8fafc', borderRadius: 6 }}>
                    📝 {w.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingIdx !== null ? '✏️ 编辑观察' : '➕ 添加观察'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>股票代码 <span className="hint">必填</span></label>
                <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value.toUpperCase() })} placeholder="SNDK" />
              </div>
              <div className="form-group">
                <label>中文名</label>
                <input value={form.ticker || ''} onChange={e => setForm({ ...form, ticker: e.target.value })} placeholder="闪迪" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>当前价格 ($)</label>
                <input type="number" step="0.01" value={form.currentPrice || ''} onChange={e => setForm({ ...form, currentPrice: +e.target.value })} placeholder="1729.00" />
              </div>
              <div className="form-group">
                <label>目标买入价 ($)</label>
                <input type="number" step="0.01" value={form.targetBuy || ''} onChange={e => setForm({ ...form, targetBuy: +e.target.value })} placeholder="1650.00" />
              </div>
            </div>
            <div className="form-group">
              <label>备注</label>
              <input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="如：等回调10%或MA20支撑" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}><X size={14} /> 取消</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> 保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
