import { useState, useEffect } from 'react'
import { TradingViewChart } from '../components/StockChart'
import { Search, PanelLeftClose, PanelLeft, Maximize2, X } from 'lucide-react'

const popularStocks = [
  { symbol: 'NASDAQ:NVDA', name: '英伟达', short: 'NVDA' },
  { symbol: 'NASDAQ:MU', name: '美光科技', short: 'MU' },
  { symbol: 'NASDAQ:SNDK', name: '闪迪', short: 'SNDK' },
  { symbol: 'NASDAQ:AVGO', name: '博通', short: 'AVGO' },
  { symbol: 'NASDAQ:AMD', name: 'AMD', short: 'AMD' },
  { symbol: 'NASDAQ:INTC', name: '英特尔', short: 'INTC' },
  { symbol: 'NASDAQ:TSLA', name: '特斯拉', short: 'TSLA' },
  { symbol: 'NASDAQ:AAPL', name: '苹果', short: 'AAPL' },
  { symbol: 'NASDAQ:MSFT', name: '微软', short: 'MSFT' },
  { symbol: 'NASDAQ:GOOGL', name: '谷歌', short: 'GOOGL' },
  { symbol: 'NASDAQ:AMZN', name: '亚马逊', short: 'AMZN' },
  { symbol: 'NASDAQ:META', name: 'Meta', short: 'META' },
]

export default function Charts() {
  const [activeSymbol, setActiveSymbol] = useState('NASDAQ:NVDA')
  const [activeName, setActiveName] = useState('英伟达')
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const filtered = search
    ? popularStocks.filter(s =>
        s.name.includes(search.toUpperCase()) || s.symbol.includes(search.toUpperCase()))
    : popularStocks

  // === FULLSCREEN OVERLAY ===
  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: '#f2f3f5',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e4e6ea',
          flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{activeName}</span>
            <span style={{ fontSize: 12, color: '#9a9da7' }}>{activeSymbol}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {['1分','5分','15分','1小时','日线','周线'].map(l => (
                <button key={l} className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '3px 7px' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Stock picker in top bar */}
            <div className="input-with-icon">
              <Search size={13} />
              <input
                placeholder="搜索股票..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '5px 10px 5px 28px', border: '1px solid #e4e6ea', borderRadius: 6, fontSize: 12, width: 140, background: '#f5f6f8' }}
              />
            </div>
            {/* Dropdown list */}
            {search && (
              <div style={{
                position: 'absolute', top: 48, right: 140, width: 200, maxHeight: 300,
                background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflowY: 'auto', zIndex: 10,
              }}>
                {filtered.map(s => (
                  <button key={s.symbol} onClick={() => { setActiveSymbol(s.symbol); setActiveName(s.name); setSearch('') }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                      border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12,
                      color: activeSymbol === s.symbol ? '#000' : '#555',
                    }}>
                    {s.name} <span style={{ color: '#aaa', fontSize: 10 }}>{s.short}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="btn btn-outline btn-sm" onClick={() => setPanelOpen(!panelOpen)}>
              {panelOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setFullscreen(false)}>
              <X size={14} /> 退出全屏
            </button>
          </div>
        </div>
        <div style={{ flex: 1, padding: 8 }}>
          <TradingViewChart symbol={activeSymbol} height={winSize.h - 70} />
        </div>
      </div>
    )
  }

  // === NORMAL VIEW ===
  const chartHeight = winSize.h - 240

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1>K线图表</h1>
          <p>TradingView 全功能图表 — 支持指标、画线、多周期切换</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? <PanelLeftClose size={13} /> : <PanelLeft size={13} />}
            {panelOpen ? '收起列表' : '展开列表'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setFullscreen(true)}>
            <Maximize2 size={13} /> 全屏
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        {panelOpen && (
          <div style={{ width: 190, flexShrink: 0 }}>
            <div className="input-with-icon" style={{ marginBottom: 8 }}>
              <Search size={13} />
              <input
                placeholder="搜索股票..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '7px 10px 7px 28px', border: '1px solid #e4e6ea', borderRadius: 8, fontSize: 12, width: '100%', background: '#fff' }}
              />
            </div>
            <div className="card" style={{ padding: 6, maxHeight: chartHeight + 40, overflowY: 'auto' }}>
              {filtered.map(s => (
                <button
                  key={s.symbol}
                  onClick={() => { setActiveSymbol(s.symbol); setActiveName(s.name) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                    border: 'none', background: activeSymbol === s.symbol ? '#f5f6f8' : 'transparent',
                    borderRadius: 6, cursor: 'pointer', fontSize: 12,
                    fontWeight: activeSymbol === s.symbol ? 600 : 400,
                    color: activeSymbol === s.symbol ? '#000' : '#6b6e77',
                  }}
                >
                  <div>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#9a9da7' }}>{s.short}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 8, flexWrap: 'wrap', gap: 6,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {activeName}
                <span style={{ fontSize: 12, color: '#9a9da7', fontWeight: 400, marginLeft: 8 }}>{activeSymbol}</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {['1分','5分','15分','1小时','日线','周线'].map(l => (
                  <button key={l} className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '3px 8px' }}>{l}</button>
                ))}
              </div>
            </div>
            <TradingViewChart symbol={activeSymbol} height={chartHeight} />
          </div>
        </div>
      </div>
    </div>
  )
}
