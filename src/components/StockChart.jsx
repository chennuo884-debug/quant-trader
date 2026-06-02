import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

function generateMockCandles(days = 120) {
  const candles = []
  let close = 150
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 4
    const open = close
    close = close + change
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
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

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#6b6e77',
      },
      grid: {
        vertLines: { color: '#f0f1f4' },
        horzLines: { color: '#f0f1f4' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#0d0d12', style: 2, labelBackgroundColor: '#0d0d12' },
        horzLine: { color: '#0d0d12', style: 2, labelBackgroundColor: '#0d0d12' },
      },
      rightPriceScale: { borderColor: '#e4e6ea' },
      timeScale: { borderColor: '#e4e6ea', timeVisible: true },
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
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    }) : null

    if (volumeSeries) {
      chart.priceScale('').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    }

    const data = generateMockCandles()
    candleSeries.setData(data)

    if (volumeSeries) {
      volumeSeries.setData(data.map(d => ({
        time: d.time,
        value: Math.floor(Math.random() * 5000000 + 2000000),
        color: d.close >= d.open ? '#16a34a33' : '#dc262633',
      })))
    }

    const ma20Line = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
    })
    const ma20Data = data.map((d, i) => {
      if (i < 19) return { time: d.time }
      const slice = data.slice(i - 19, i + 1)
      const avg = slice.reduce((s, c) => s + c.close, 0) / 20
      return { time: d.time, value: +avg.toFixed(2) }
    })
    ma20Line.setData(ma20Data)

    chart.timeScale().fitContent()

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
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
        fontSize: 12, color: 'var(--text-secondary)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{symbol}</span>
        <span className="tag">MA20</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>日K</span>
      </div>
      <div ref={containerRef} style={{ width: '100%', minHeight: height }} />
    </div>
  )
}

// TradingView - dark widget for contrast in fullscreen
export function TradingViewChart({ symbol = 'NASDAQ:NVDA', height = 600 }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height,
      borderRadius: 8, overflow: 'hidden', border: '1px solid #e4e6ea',
      background: '#131722',
    }}>
      <iframe
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f7f8fa&studies=MA:20,MA:60,RSI:14&theme=light&style=1&timezone=Asia/Shanghai&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=zh_CN`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={`${symbol} Chart`}
      />
    </div>
  )
}

// Mini chart
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
    const series = chart.addLineSeries({
      color: '#0d0d12',
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    const data = generateMockCandles(60).map(c => ({ time: c.time, value: c.close }))
    series.setData(data)
    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [symbol, width, height])

  return <div ref={containerRef} style={{ width, height }} />
}
