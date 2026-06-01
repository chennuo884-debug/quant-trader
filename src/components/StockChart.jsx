import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

// 模拟K线数据 - Yahoo Finance免费接口可替换
function generateMockCandles(days = 120) {
  const candles = []
  let close = 150, high, low, open
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 4
    open = close
    close = close + change
    high = Math.max(open, close) + Math.random() * 2
    low = Math.min(open, close) - Math.random() * 2
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    candles.push({
      time: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    })
  }
  return candles
}

export default function StockChart({ symbol = 'NVDA', height = 400, showVolume = true }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#475569',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#2563eb', style: 2, labelBackgroundColor: '#2563eb' },
        horzLine: { color: '#2563eb', style: 2, labelBackgroundColor: '#2563eb' },
      },
      rightPriceScale: { borderColor: '#e2e8f0' },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderDownColor: '#dc2626',
      borderUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      wickUpColor: '#16a34a',
    })

    const volumeSeries = showVolume ? chart.addHistogramSeries({
      color: '#26a69a55',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    }) : null

    if (volumeSeries) {
      chart.priceScale('').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      })
    }

    const data = generateMockCandles()
    candleSeries.setData(data)

    if (volumeSeries) {
      volumeSeries.setData(data.map(d => ({
        time: d.time,
        value: Math.floor(Math.random() * 5000000 + 2000000),
        color: d.close >= d.open ? '#16a34a44' : '#dc262644',
      })))
    }

    // 添加MA均线
    const ma20Line = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
    })
    const ma20Data = data.map((d, i) => {
      if (i < 19) return { time: d.time, value: undefined }
      const slice = data.slice(i - 19, i + 1)
      const avg = slice.reduce((s, c) => s + c.close, 0) / 20
      return { time: d.time, value: +avg.toFixed(2) }
    })
    ma20Line.setData(ma20Data)

    chart.timeScale().fitContent()
    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, height, showVolume])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
        fontSize: 13, color: 'var(--text-secondary)'
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{symbol}</span>
        <span className="tag tag-yellow">MA20</span>
        <span style={{ fontSize: 11 }}>日K</span>
      </div>
      <div ref={containerRef} style={{ width: '100%', minHeight: height }} />
    </div>
  )
}

// TradingView 全功能图表的 iframe 嵌入
export function TradingViewChart({ symbol = 'NASDAQ:NVDA', height = 600 }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height,
      borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)',
    }}>
      <iframe
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=MA:20,MA:60,RSI:14&theme=light&style=1&timezone=Asia/Shanghai&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=zh_CN`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`${symbol} Chart`}
      />
    </div>
  )
}

// 迷你图表组件（用于观察列表）
export function MiniChart({ symbol = 'NVDA', width = 120, height = 50 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width, height,
      layout: { background: { color: 'transparent' } },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      rightPriceScale: { visible: false, borderVisible: false },
      timeScale: { visible: false, borderVisible: false },
      handleScroll: false, handleScale: false,
    })

    const lineSeries = chart.addLineSeries({
      color: '#2563eb',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    const data = generateMockCandles(60).map(c => ({ time: c.time, value: c.close }))
    lineSeries.setData(data)
    chart.timeScale().fitContent()

    return () => chart.remove()
  }, [symbol, width, height])

  return <div ref={containerRef} style={{ width, height }} />
}
