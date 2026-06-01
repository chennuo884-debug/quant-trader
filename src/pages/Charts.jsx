import { useState } from 'react'
import { TradingViewChart } from '../components/StockChart'
import { Search } from 'lucide-react'

const popularStocks = [
  { symbol: 'NASDAQ:NVDA', name: '英伟达 NVIDIA' },
  { symbol: 'NASDAQ:MU', name: '美光科技 Micron' },
  { symbol: 'NASDAQ:SNDK', name: '闪迪 SanDisk' },
  { symbol: 'NASDAQ:AVGO', name: '博通 Broadcom' },
  { symbol: 'NASDAQ:AMD', name: 'AMD' },
  { symbol: 'NASDAQ:INTC', name: '英特尔 Intel' },
  { symbol: 'NASDAQ:TSLA', name: '特斯拉 Tesla' },
  { symbol: 'NASDAQ:AAPL', name: '苹果 Apple' },
  { symbol: 'NASDAQ:MSFT', name: '微软 Microsoft' },
  { symbol: 'NASDAQ:GOOGL', name: '谷歌 Alphabet' },
  { symbol: 'NASDAQ:AMZN', name: '亚马逊 Amazon' },
  { symbol: 'NASDAQ:META', name: 'Meta' },
]

export default function Charts() {
  const [activeSymbol, setActiveSymbol] = useState('NASDAQ:NVDA')
  const [activeName, setActiveName] = useState('英伟达 NVIDIA')
  const [search, setSearch] = useState('')

  const filtered = search
    ? popularStocks.filter(s => s.name.toUpperCase().includes(search.toUpperCase()) || s.symbol.toUpperCase().includes(search.toUpperCase()))
    : popularStocks

  return (
    <div>
      <div className="page-header">
        <h1>📈 K线图表</h1>
        <p>TradingView 全功能图表 — 支持指标、画线、多周期切换、保存图片</p>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 股票选择器 — 固定窄列 */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
            <input
              placeholder="搜索股票..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 12px 9px 34px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13, width: '100%', background: '#fff' }}
            />
          </div>
          <div className="card" style={{
            padding: 4, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto',
          }}>
            {filtered.map(s => (
              <button
                key={s.symbol}
                onClick={() => { setActiveSymbol(s.symbol); setActiveName(s.name) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                  border: 'none', background: activeSymbol === s.symbol ? 'var(--accent-blue-light)' : 'transparent',
                  borderRadius: 8, cursor: 'pointer', marginBottom: 0, fontSize: 13,
                  fontWeight: activeSymbol === s.symbol ? 600 : 400,
                  color: activeSymbol === s.symbol ? 'var(--accent-blue)' : 'var(--text-primary)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* 图表区 — 占满剩余空间 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{activeName}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { k: '1', l: '1分' }, { k: '5', l: '5分' }, { k: '15', l: '15分' },
                  { k: '60', l: '1小时' }, { k: 'D', l: '日线' }, { k: 'W', l: '周线' },
                ].map(t => (
                  <button
                    key={t.k}
                    onClick={() => {}}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <TradingViewChart symbol={activeSymbol} height={window.innerHeight - 260} />
          </div>
        </div>
      </div>
    </div>
  )
}
