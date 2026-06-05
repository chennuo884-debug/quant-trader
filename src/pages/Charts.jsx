import { useState, useMemo, useEffect } from 'react'
import { Search, PanelLeftClose, PanelLeft, Maximize2, X, Settings } from 'lucide-react'
import AdvancedChart from '../components/AdvancedChart'

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

const INDICATORS = [
  { key: 'ma20', label: 'MA20', color: '#f59e0b', default: true, desc: '20日简单移动均线' },
  { key: 'ma50', label: 'MA50', color: '#6366f1', default: true, desc: '50日简单移动均线' },
  { key: 'ma200', label: 'MA200', color: '#ef4444', default: false, desc: '200日简单移动均线' },
  { key: 'ema12', label: 'EMA12', color: '#06b6d4', default: false, desc: '12日指数移动均线（快线）' },
  { key: 'ema26', label: 'EMA26', color: '#f97316', default: false, desc: '26日指数移动均线（慢线）' },
  { key: 'bb', label: '布林带', color: '#8b5cf6', default: false, desc: 'MA20 ± 2σ 标准差通道' },
  { key: 'macd', label: 'MACD', color: '#ec4899', default: true, desc: '快慢线交叉信号' },
  { key: 'rsi', label: 'RSI(14)', color: '#14b8a6', default: true, desc: '超买>70 / 超卖<30' },
  { key: 'volume', label: '成交量', color: '#9a9da7', default: true, desc: '含20日均量对比' },
]

const INTERVALS = ['1分', '5分', '15分', '1小时', '日线', '周线']

export default function Charts() {
  const [activeSymbol, setActiveSymbol] = useState('NASDAQ:NVDA')
  const [activeName, setActiveName] = useState('英伟达')
  const [activeShort, setActiveShort] = useState('NVDA')
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [activeInterval, setActiveInterval] = useState('日线')
  const [enabledIndicators, setEnabledIndicators] = useState(
    INDICATORS.filter(i => i.default).map(i => i.key)
  )
  const [showIndicatorSettings, setShowIndicatorSettings] = useState(false)

  // Update window size
  useEffect(() => {
    const onResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleIndicator = (key) => {
    setEnabledIndicators(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const filtered = search
    ? popularStocks.filter(s => s.name.includes(search.toUpperCase()) || s.short.includes(search.toUpperCase()))
    : popularStocks

  const chartHeight = winSize.h - 320

  // Fullscreen mode
  if (fullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#f2f3f5', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e4e6ea', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{activeName}</span>
            <span style={{ fontSize: 12, color: '#9a9da7' }}>{activeSymbol}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {INTERVALS.map(l => (
                <button key={l} className={`btn btn-sm ${activeInterval === l ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveInterval(l)}
                  style={activeInterval === l ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none', fontSize: 10, padding: '3px 7px' } : { fontSize: 10, padding: '3px 7px' }}>
                  {l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setFullscreen(false)}><X size={14} /> 退出全屏</button>
          </div>
        </div>
        <div style={{ flex: 1, padding: 8 }}>
          <AdvancedChart symbol={activeShort} height={winSize.h - 120} indicators={enabledIndicators} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1>K线图表</h1>
          <p>支持多指标切换 — 移动均线、布林带、MACD、RSI、成交量</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowIndicatorSettings(!showIndicatorSettings)}>
            <Settings size={13} /> 指标设置
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? <PanelLeftClose size={13} /> : <PanelLeft size={13} />}
            {panelOpen ? '收起列表' : '展开列表'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setFullscreen(true)}
            style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
            <Maximize2 size={13} /> 全屏
          </button>
        </div>
      </div>

      {/* Indicator Settings Panel */}
      {showIndicatorSettings && (
        <div className="card" style={{ padding: 14, marginBottom: 12, border: '2px solid #e0e7ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 13 }}>📐 技术指标开关</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowIndicatorSettings(false)}><X size={13} /></button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {INDICATORS.map(ind => {
              const enabled = enabledIndicators.includes(ind.key)
              return (
                <button
                  key={ind.key}
                  onClick={() => toggleIndicator(ind.key)}
                  title={ind.desc}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    border: `2px solid ${enabled ? ind.color : '#e4e6ea'}`,
                    background: enabled ? `${ind.color}10` : '#fff',
                    color: enabled ? ind.color : '#9a9da7',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <div style={{
                    width: 10, height: 3, borderRadius: 2,
                    background: enabled ? ind.color : '#d0d3d9',
                  }} />
                  {ind.label}
                  <span style={{ fontSize: 9, opacity: 0.6 }}>{ind.desc.split('——')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 14 }}>
        {panelOpen && (
          <div style={{ width: 190, flexShrink: 0 }}>
            <div className="input-with-icon" style={{ marginBottom: 8 }}>
              <Search size={13} />
              <input placeholder="搜索股票..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '7px 10px 7px 28px', border: '1px solid #e4e6ea', borderRadius: 8, fontSize: 12, width: '100%', background: '#fff' }} />
            </div>
            <div className="card" style={{ padding: 6, maxHeight: 500, overflowY: 'auto' }}>
              {filtered.map(s => (
                <button key={s.symbol} onClick={() => { setActiveSymbol(s.symbol); setActiveName(s.name); setActiveShort(s.short) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                    border: 'none', background: activeSymbol === s.symbol ? '#f5f3ff' : 'transparent',
                    borderRadius: 6, cursor: 'pointer', fontSize: 12,
                    fontWeight: activeSymbol === s.symbol ? 600 : 400,
                    color: activeSymbol === s.symbol ? '#4338ca' : '#6b6e77',
                  }}>
                  <div>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#9a9da7' }}>{s.short}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header bar */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {activeName}
                <span style={{ fontSize: 12, color: '#9a9da7', fontWeight: 400, marginLeft: 8 }}>{activeSymbol}</span>
                <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 500, marginLeft: 8, padding: '2px 8px', background: '#f5f3ff', borderRadius: 4 }}>
                  已启 {enabledIndicators.length}/{INDICATORS.length} 指标</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {INTERVALS.map(l => (
                  <button key={l}
                    className={`btn btn-sm ${activeInterval === l ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveInterval(l)}
                    style={activeInterval === l
                      ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none', fontSize: 10, padding: '3px 8px' }
                      : { fontSize: 10, padding: '3px 8px' }}>
                    {l}</button>
                ))}
              </div>
            </div>
            <AdvancedChart symbol={activeShort} height={chartHeight} indicators={enabledIndicators} />
          </div>
        </div>
      </div>
    </div>
  )
}
