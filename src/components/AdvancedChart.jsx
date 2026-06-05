import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from 'lightweight-charts'
import { Loader2 } from 'lucide-react'

function generateMockCandles(days = 180) {
  const candles = []
  let close = 150
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 5
    const open = close
    close = Math.max(close + change, 10)
    const high = Math.max(open, close) + Math.random() * 3
    const low = Math.min(open, close) - Math.random() * 3
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    candles.push({
      time: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 8000000 + 2000000),
    })
  }
  return candles
}

const INDICATOR_CONFIG = {
  ma20: { color: '#f59e0b', width: 1.5, window: 20, type: 'sma' },
  ma50: { color: '#6366f1', width: 1.5, window: 50, type: 'sma' },
  ma200: { color: '#ef4444', width: 1.5, window: 200, type: 'sma' },
  ema12: { color: '#06b6d4', width: 1, window: 12, type: 'ema' },
  ema26: { color: '#f97316', width: 1, window: 26, type: 'ema' },
}

function calcSMA(data, window) {
  return data.map((_, i) => {
    if (i < window - 1) return null
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += data[j]
    return +((sum / window)).toFixed(4)
  })
}

function calcEMA(data, window) {
  const k = 2 / (window + 1)
  const result = new Array(data.length).fill(null)
  let seed = data.slice(0, window).reduce((a, b) => a + b, 0) / window
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) continue
    if (i === window - 1) result[i] = +seed.toFixed(4)
    else result[i] = +(data[i] * k + result[i - 1] * (1 - k)).toFixed(4)
  }
  return result
}

function calcBollingerBands(closes, window = 20, mult = 2) {
  const middle = calcSMA(closes, window)
  const upper = new Array(closes.length).fill(null)
  const lower = new Array(closes.length).fill(null)
  for (let i = window - 1; i < closes.length; i++) {
    const slice = closes.slice(i - window + 1, i + 1)
    const avg = slice.reduce((a, b) => a + b, 0) / window
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - avg) ** 2, 0) / window)
    upper[i] = +(avg + mult * std).toFixed(4)
    lower[i] = +(avg - mult * std).toFixed(4)
  }
  return { middle, upper, lower }
}

function calcRSI(closes, window = 14) {
  const rsi = new Array(closes.length).fill(null)
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= window && i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) avgGain += diff
    else avgLoss += Math.abs(diff)
  }
  avgGain /= window
  avgLoss /= window
  for (let i = window + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (window - 1) + (diff > 0 ? diff : 0)) / window
    avgLoss = (avgLoss * (window - 1) + (diff < 0 ? Math.abs(diff) : 0)) / window
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi[i] = +(100 - 100 / (1 + rs)).toFixed(1)
  }
  return rsi
}

export default function AdvancedChart({ symbol = 'NVDA', height = 500, indicators = ['ma20', 'ma50', 'macd', 'rsi', 'volume'] }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [candleData, setCandleData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/stock/${symbol}/history?period=6mo`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.candles?.length > 30) {
          setCandleData(data.candles)
        } else {
          setCandleData(generateMockCandles(180))
        }
      })
      .catch(() => setCandleData(generateMockCandles(180)))
      .finally(() => setLoading(false))
  }, [symbol])

  useEffect(() => {
    if (!candleData || !containerRef.current) return

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = containerRef.current
    try {
      const chart = createChart(container, {
        height,
        layout: { background: { color: '#ffffff' }, textColor: '#6b6e77' },
        grid: { vertLines: { color: '#f0f1f4' }, horzLines: { color: '#f0f1f4' } },
        crosshair: {
          mode: 1,
          vertLine: { color: '#6366f1', style: 2, labelBackgroundColor: '#6366f1' },
          horzLine: { color: '#6366f1', style: 2, labelBackgroundColor: '#6366f1' },
        },
        rightPriceScale: { borderColor: '#e4e6ea', scaleMargins: { top: 0.05, bottom: 0.2 } },
        timeScale: { borderColor: '#e4e6ea', timeVisible: true, secondsVisible: false },
      })

      // V5 API: chart.addSeries(SeriesType, options)
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#16a34a', downColor: '#dc2626',
        borderUpColor: '#16a34a', borderDownColor: '#dc2626',
        wickUpColor: '#16a34a', wickDownColor: '#dc2626',
      })
      candleSeries.setData(candleData)

      const closes = candleData.map(c => c.close)

      // MA/EMA lines
      for (const key of ['ma20', 'ma50', 'ma200', 'ema12', 'ema26']) {
        if (!indicators.includes(key)) continue
        const cfg = INDICATOR_CONFIG[key]
        if (!cfg) continue
        const ma = cfg.type === 'ema' ? calcEMA(closes, cfg.window) : calcSMA(closes, cfg.window)
        const lineData = candleData.map((c, i) => ({ time: c.time, value: ma[i] })).filter(d => d.value != null)
        if (lineData.length < 2) continue
        const ls = chart.addSeries(LineSeries, { color: cfg.color, lineWidth: cfg.width, priceLineVisible: false, lastValueVisible: true })
        ls.setData(lineData)
      }

      // Bollinger Bands
      if (indicators.includes('bb')) {
        const bb = calcBollingerBands(closes, 20, 2)
        const upperData = candleData.map((c, i) => ({ time: c.time, value: bb.upper[i] })).filter(d => d.value != null)
        const lowerData = candleData.map((c, i) => ({ time: c.time, value: bb.lower[i] })).filter(d => d.value != null)
        if (upperData.length > 1) {
          const upperArea = chart.addSeries(AreaSeries, {
            lineColor: '#8b5cf640', topColor: '#8b5cf608', bottomColor: '#8b5cf602',
            lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
          })
          upperArea.setData(upperData)
          const lowerArea = chart.addSeries(AreaSeries, {
            lineColor: '#8b5cf640', topColor: '#8b5cf608', bottomColor: '#8b5cf602',
            lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
          })
          lowerArea.setData(lowerData)
        }
      }

      // MACD subplot
      if (indicators.includes('macd')) {
        const ema12v = calcEMA(closes, 12)
        const ema26v = calcEMA(closes, 26)
        const macdVals = ema12v.map((v, i) => v != null && ema26v[i] != null ? +(v - ema26v[i]).toFixed(4) : null)
        const signalLine = calcEMA(macdVals.filter(v => v != null), 9)
        const offset = macdVals.length - signalLine.length

        const macdData = candleData.map((c, i) => ({ time: c.time, value: macdVals[i] })).filter(d => d.value != null)
        const signalData = candleData.slice(offset).map((c, i) => ({ time: c.time, value: signalLine[i] })).filter(d => d.value != null)
        const histData = candleData.map((c, i) => {
          const sig = i >= offset ? signalLine[i - offset] : null
          return macdVals[i] != null && sig != null
            ? { time: c.time, value: +(macdVals[i] - sig).toFixed(4), color: macdVals[i] >= sig ? '#16a34a80' : '#dc262680' }
            : null
        }).filter(d => d != null)

        const macdPane = chart.addSubchart({
          height: 120,
          handleScale: false,
          handleScroll: false,
        })

        if (histData.length > 0) {
          const histSeries = macdPane.addSeries(HistogramSeries, { priceFormat: { type: 'volume', precision: 4 } })
          histSeries.setData(histData)
        }

        if (macdData.length > 1) {
          const macdLine = macdPane.addSeries(LineSeries, { color: '#ec4899', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true })
          macdLine.setData(macdData)
        }

        if (signalData.length > 1) {
          const sigLine = macdPane.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: true })
          sigLine.setData(signalData)
        }
      }

      // RSI subplot
      if (indicators.includes('rsi')) {
        const rsiVals = calcRSI(closes, 14)
        const rsiData = candleData.map((c, i) => ({ time: c.time, value: rsiVals[i] })).filter(d => d.value != null)

        if (rsiData.length > 1) {
          const rsiPane = chart.addSubchart({ height: 100, handleScale: false, handleScroll: false })
          const rsiLine = rsiPane.addSeries(LineSeries, {
            color: '#14b8a6', lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true,
          })
          rsiLine.setData(rsiData)

          // Overbought/Oversold reference lines (just last 2 points for a horizontal line)
          const obRef = rsiPane.addSeries(LineSeries, { color: '#dc262640', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          obRef.setData([{ time: rsiData[0].time, value: 70 }, { time: rsiData[rsiData.length - 1].time, value: 70 }])
          const osRef = rsiPane.addSeries(LineSeries, { color: '#16a34a40', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          osRef.setData([{ time: rsiData[0].time, value: 30 }, { time: rsiData[rsiData.length - 1].time, value: 30 }])
        }
      }

      // Volume subplot
      if (indicators.includes('volume')) {
        const volData = candleData.map(c => ({
          time: c.time,
          value: c.volume || 0,
          color: c.close >= c.open ? '#16a34a40' : '#dc262640',
        }))
        const volMa20 = calcSMA(candleData.map(c => c.volume || 0), 20)
        const volMaData = candleData.map((c, i) => ({ time: c.time, value: volMa20[i] })).filter(d => d.value != null)

        const volPane = chart.addSubchart({ height: 80, handleScale: false, handleScroll: false })
        const volSeries = volPane.addSeries(HistogramSeries, { priceFormat: { type: 'volume' } })
        volSeries.setData(volData)

        if (volMaData.length > 1) {
          const volMaLine = volPane.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
          volMaLine.setData(volMaData)
        }
      }

      chart.timeScale().fitContent()
      chartRef.current = chart

      const handleResize = () => {
        if (container) chart.applyOptions({ width: container.clientWidth })
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
        chartRef.current = null
      }
    } catch (err) {
      console.error('Chart creation failed:', err)
      setError(err.message)
    }
  }, [candleData, height, indicators])

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff', borderRadius: 6, border: '1px solid #e4e6ea', fontSize: 11, color: '#6b6e77' }}>
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> 加载数据...
        </div>
      )}
      {error ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 13 }}>
          <p>图表加载失败: {error}</p>
          <p style={{ fontSize: 11, color: '#9a9da7', marginTop: 4 }}>请确保后端服务器已启动 (npm run server)</p>
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', minHeight: height }} />
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
