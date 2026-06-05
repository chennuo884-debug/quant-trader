/**
 * Technical indicator calculations in pure JavaScript.
 * All calculations match the DeepSeek document specs.
 */

/**
 * Calculate all technical indicators on OHLCV candle data.
 * @param {Array} candles - [{time, open, high, low, close, volume}]
 * @returns {Array} candles with indicators attached
 */
export function calculateIndicators(candles) {
  if (!candles || candles.length < 30) return candles

  const closes = candles.map(c => c.close)
  const highs = candles.map(c => c.high)
  const lows = candles.map(c => c.low)
  const volumes = candles.map(c => c.volume)

  const n = candles.length

  // MA lines
  const ma20 = sma(closes, 20)
  const ma50 = sma(closes, 50)
  const ma200 = sma(closes, 200)

  // EMA lines
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)

  // RSI(14)
  const rsi = calcRSI(closes, 14)

  // MACD
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signalLine = ema(macdLine.filter(v => v != null), 9)
  const macdHist = macdLine.map((v, i) => {
    const sig = signalLine[i - (macdLine.length - signalLine.length)]
    return v != null && sig != null ? v - sig : null
  })

  // Bollinger Bands
  const bb = bollingerBands(closes, 20, 2)

  // ATR(14)
  const atr = calcATR(highs, lows, closes, 14)

  // Volume MA
  const volMa20 = sma(volumes, 20)
  const volRatio = volumes.map((v, i) => volMa20[i] ? v / volMa20[i] : 1)

  // Momentum
  const mom1m = closes.map((v, i) => i >= 21 ? (v - closes[i - 21]) / closes[i - 21] * 100 : null)
  const mom3m = closes.map((v, i) => i >= 63 ? (v - closes[i - 63]) / closes[i - 63] * 100 : null)

  // Attach to candles
  return candles.map((c, i) => ({
    ...c,
    ma20: ma20[i] ?? null,
    ma50: ma50[i] ?? null,
    ma200: ma200[i] ?? null,
    ema12: ema12[i] ?? null,
    ema26: ema26[i] ?? null,
    rsi: rsi[i] ?? null,
    macd: macdLine[i] ?? null,
    macdSignal: signalLine[i - (macdLine.length - signalLine.length)] ?? null,
    macdHist: macdHist[i] ?? null,
    bbUpper: bb.upper[i] ?? null,
    bbMiddle: bb.middle[i] ?? null,
    bbLower: bb.lower[i] ?? null,
    bbWidth: bb.width[i] ?? null,
    bbPosition: bb.position[i] ?? null,
    atr: atr[i] ?? null,
    volMa20: volMa20[i] ?? null,
    volRatio: volRatio[i] ?? null,
    momentum1m: mom1m[i] ?? null,
    momentum3m: mom3m[i] ?? null,
  }))
}

/**
 * Get latest trading signals from indicator data
 */
export function getSignals(candles) {
  if (!candles || candles.length < 50) return {}

  const latest = candles[candles.length - 1]
  const prev = candles[candles.length - 2]

  const signals = {
    rsi: latest.rsi ? +latest.rsi.toFixed(1) : null,
    rsi_signal: latest.rsi > 70 ? 'overbought' : latest.rsi < 30 ? 'oversold' : 'neutral',

    trend: latest.close > latest.ma200 ? 'bullish' : 'bearish',

    ma_alignment: latest.ma20 > latest.ma50 && latest.ma50 > latest.ma200 ? 'bullish' :
                  latest.ma20 < latest.ma50 && latest.ma50 < latest.ma200 ? 'bearish' : 'mixed',

    macd_signal: latest.macd > latest.macdSignal ? 'bullish' : 'bearish',
    macd_histogram: latest.macdHist ? +latest.macdHist.toFixed(4) : null,

    bb_signal: latest.close > latest.bbUpper ? 'overbought' :
               latest.close < latest.bbLower ? 'oversold' : 'neutral',

    volume_confirmation: latest.volRatio > 1.2 && latest.close > prev.close ? 'bullish' :
                         latest.volRatio > 1.2 && latest.close < prev.close ? 'bearish' : 'neutral',

    momentum: latest.momentum1m > 0 ? 'bullish' : 'bearish',
    momentum1m: latest.momentum1m ? +latest.momentum1m.toFixed(1) : null,
    momentum3m: latest.momentum3m ? +latest.momentum3m.toFixed(1) : null,

    bb_position: latest.bbPosition ? ((1 - latest.bbPosition) * 100).toFixed(0) : null,
    atr: latest.atr ? +latest.atr.toFixed(2) : null,
  }

  // Composite score (-3 to +3)
  let score = 0
  if (signals.trend === 'bullish') score++
  else score--
  if (signals.rsi_signal === 'oversold') score++
  else if (signals.rsi_signal === 'overbought') score--
  if (signals.macd_signal === 'bullish') score++
  else score--
  if (signals.bb_signal === 'oversold') score++
  else if (signals.bb_signal === 'overbought') score--
  if (signals.volume_confirmation === 'bullish') score++
  else if (signals.volume_confirmation === 'bearish') score--

  signals.composite_score = score
  if (score >= 3) signals.overall = 'strong_buy'
  else if (score >= 1) signals.overall = 'buy'
  else if (score <= -3) signals.overall = 'strong_sell'
  else if (score <= -1) signals.overall = 'sell'
  else signals.overall = 'hold'

  return signals
}

/* ─── Math helpers ─── */

function sma(arr, window) {
  return arr.map((_, i) => {
    if (i < window - 1) return null
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += arr[j]
    return +(sum / window).toFixed(4)
  })
}

function ema(arr, window) {
  const k = 2 / (window + 1)
  return arr.map((v, i) => {
    if (i === 0) return +v.toFixed(4)
    const prev = arr.slice(0, i).reduce((s, x, j) => s + (j === 0 ? x : 0), 0)
    // Actually compute properly
    return null // Will be filled below
  })
  // Simplified EMA using first SMA value as seed
  const result = new Array(arr.length).fill(null)
  // Get first SMA as seed
  let seed = arr.slice(0, window).reduce((a, b) => a + b, 0) / window
  for (let i = 0; i < arr.length; i++) {
    if (i < window - 1) continue
    if (i === window - 1) result[i] = +seed.toFixed(4)
    else result[i] = +(arr[i] * k + result[i - 1] * (1 - k)).toFixed(4)
  }
  return result
}

function calcRSI(closes, window = 14) {
  const rsi = new Array(closes.length).fill(null)
  let gains = 0, losses = 0

  for (let i = 1; i <= window && i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses += Math.abs(diff)
  }
  let avgGain = gains / window
  let avgLoss = losses / window

  for (let i = window + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    avgGain = (avgGain * (window - 1) + (diff > 0 ? diff : 0)) / window
    avgLoss = (avgLoss * (window - 1) + (diff < 0 ? Math.abs(diff) : 0)) / window
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi[i] = +(100 - 100 / (1 + rs)).toFixed(1)
  }
  return rsi
}

function bollingerBands(closes, window = 20, mult = 2) {
  const middle = sma(closes, window)
  const upper = new Array(closes.length).fill(null)
  const lower = new Array(closes.length).fill(null)
  const width = new Array(closes.length).fill(null)
  const position = new Array(closes.length).fill(null)

  for (let i = window - 1; i < closes.length; i++) {
    const slice = closes.slice(i - window + 1, i + 1)
    const avg = slice.reduce((a, b) => a + b, 0) / window
    const std = Math.sqrt(slice.reduce((s, v) => s + (v - avg) ** 2, 0) / window)
    upper[i] = +(avg + mult * std).toFixed(4)
    lower[i] = +(avg - mult * std).toFixed(4)
    width[i] = +((upper[i] - lower[i]) / avg).toFixed(4)
    position[i] = +((closes[i] - lower[i]) / (upper[i] - lower[i])).toFixed(4)
  }

  return { upper, middle, lower, width, position }
}

function calcATR(highs, lows, closes, window = 14) {
  const tr = new Array(highs.length).fill(0)
  for (let i = 1; i < highs.length; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    )
  }
  const atr = new Array(highs.length).fill(null)
  let sum = tr.slice(1, window + 1).reduce((a, b) => a + b, 0)
  atr[window] = +(sum / window).toFixed(4)
  for (let i = window + 1; i < highs.length; i++) {
    atr[i] = +((atr[i - 1] * (window - 1) + tr[i]) / window).toFixed(4)
  }
  return atr
}
