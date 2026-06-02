import { useState, useEffect } from 'react'
import { Plus, Trash2, Bell, X, Save, Search } from 'lucide-react'
import { MiniChart } from '../components/StockChart'

function loadWatchlist() { try { return JSON.parse(localStorage.getItem('qt_watchlist') || '[]') } catch { return [] } }
function saveWatchlist(data) { localStorage.setItem('qt_watchlist', JSON.stringify(data)) }

export default function Watchlist() {
  const [items, setItems] = useState(loadWatchlist)
  const [showModal, setShowModal] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [form, setForm] = useState({ stock: '', ticker: '', currentPrice: 0, targetBuy: 0, notes: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { saveWatchlist(items) }, [items])

  const openAdd = () => { setForm({ stock: '', ticker: '', currentPrice: 0, targetBuy: 0, notes: '' }); setEditingIdx(null); setShowModal(true) }
  const openEdit = (idx) => { setForm({ ...items[idx] }); setEditingIdx(idx); setShowModal(true) }
  const handleSave = () => {
    if (!form.stock) return
    if (editingIdx !== null) { const u = [...items]; u[editingIdx] = { ...form }; setItems(u) }
    else setItems([...items, { ...form }])
    setShowModal(false)
  }
  const handleDelete = (idx) => setItems(items.filter((_, i) => i !== idx))

  const filtered = search
    ? items.filter(w => w.stock.toUpperCase().includes(search.toUpperCase()) || (w.ticker || '').toUpperCase().includes(search.toUpperCase()))
    : items

  return (
    <div>
      <div className="page-header">
        <h1>观察列表</h1>
        <p>跟踪你感兴趣的股票，设定目标买入价。等它回到你的买入区间，不要追涨。</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div className="input-with-icon">
          <Search size={13} />
          <input placeholder="搜索..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 10px 7px 28px', border: '1px solid #e4e6ea', borderRadius: 6, fontSize: 13, width: 200, background: '#fff' }} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13} /> 添加观察</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Bell size={36} /><p style={{ fontWeight: 500 }}>观察列表为空</p><p style={{ fontSize: 12, marginTop: 4 }}>添加你感兴趣的股票，设定目标买入价</p><button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}><Plus size={13} /> 添加第一只股票</button></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map((w, i) => {
            const gap = w.targetBuy > 0 ? ((w.currentPrice - w.targetBuy) / w.targetBuy * 100) : 0
            const atBuy = w.targetBuy > 0 && w.currentPrice <= w.targetBuy
            return (
              <div key={i} className="card" style={{ padding: 18, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 10, right: 12, display: 'flex', gap: 2 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(i)}><Plus size={13} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(i)} style={{ color: '#9a9da7' }}><Trash2 size={13} /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div><div style={{ fontSize: 16, fontWeight: 600 }}>{w.stock}</div>{w.ticker && <div style={{ fontSize: 11, color: '#9a9da7' }}>{w.ticker}</div>}</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>${w.currentPrice.toLocaleString()}</div>
                    {gap !== 0 && <div style={{ fontSize: 11, color: gap > 0 ? '#dc2626' : '#16a34a' }}>{gap > 0 ? '↑' : '↓'} {Math.abs(gap).toFixed(1)}% vs 目标价</div>}
                  </div>
                </div>
                <MiniChart symbol={w.stock} width={300} height={50} />
                <div style={{ display: 'flex', gap: 16, fontSize: 12, marginTop: 8 }}>
                  <div><span style={{ color: '#6b6e77' }}>目标买入: </span><span className="tag">${w.targetBuy.toLocaleString()}</span></div>
                  {w.targetBuy > 0 && gap > 0 && <div style={{ color: '#dc2626' }}>还需回调 {gap.toFixed(1)}%</div>}
                  {atBuy && <div style={{ color: '#16a34a', fontWeight: 600 }}>✓ 已到买入区间</div>}
                </div>
                {w.notes && <div style={{ marginTop: 10, fontSize: 11, color: '#6b6e77', padding: 8, background: '#fafbfc', borderRadius: 4 }}>{w.notes}</div>}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingIdx !== null ? '编辑观察' : '添加观察'}</h3>
            <div className="form-row">
              <div className="form-group"><label>股票代码 <span className="hint">必填</span></label><input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value.toUpperCase() })} placeholder="SNDK" /></div>
              <div className="form-group"><label>中文名</label><input value={form.ticker || ''} onChange={e => setForm({ ...form, ticker: e.target.value })} placeholder="闪迪" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>当前价格 ($)</label><input type="number" step="0.01" value={form.currentPrice || ''} onChange={e => setForm({ ...form, currentPrice: +e.target.value })} placeholder="1729.00" /></div>
              <div className="form-group"><label>目标买入价 ($)</label><input type="number" step="0.01" value={form.targetBuy || ''} onChange={e => setForm({ ...form, targetBuy: +e.target.value })} placeholder="1650.00" /></div>
            </div>
            <div className="form-group"><label>备注</label><input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="等回调 10% 或 MA20 支撑" /></div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}><X size={13} /> 取消</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={13} /> 保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
