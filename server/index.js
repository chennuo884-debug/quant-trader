import express from 'express'
import cors from 'cors'
import { fetchStockData, fetchHistoricalData, fetchNews, fetchFinancials } from './yahooFinance.js'
import { calculateIndicators, getSignals } from './indicators.js'
import { fetchSocialPosts } from './socialMedia.js'
import { setupAuth } from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Setup auth routes
setupAuth(app)

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = {
  price: 60_000,        // 1 min
  history: 300_000,     // 5 min
  financials: 3_600_000, // 1 hour
  news: 300_000,        // 5 min
  social: 600_000,      // 10 min
}

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.ts > item.ttl) { cache.delete(key); return null }
  return item.data
}

function setCache(key, data, ttl) {
  cache.set(key, { data, ts: Date.now(), ttl })
}

// ─── Stock price + indicators ──────────────────────────
app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params
  const cacheKey = `stock:${symbol}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  try {
    const [quote, hist] = await Promise.all([
      fetchStockData(symbol),
      fetchHistoricalData(symbol, '6mo')
    ])
    const indicators = calculateIndicators(hist)
    const signals = getSignals(indicators)
    const result = { symbol, quote, signals, hasData: true }
    setCache(cacheKey, result, CACHE_TTL.price)
    res.json(result)
  } catch (e) {
    // Return cached expired data if available
    const stale = cache.get(cacheKey)
    if (stale) return res.json({ ...stale.data, stale: true })
    res.json({ symbol, hasData: false, error: e.message, signals: getMockSignals() })
  }
})

// ─── Historical data ───────────────────────────────────
app.get('/api/stock/:symbol/history', async (req, res) => {
  const { symbol } = req.params
  const period = req.query.period || '2y'
  const cacheKey = `hist:${symbol}:${period}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  try {
    const data = await fetchHistoricalData(symbol, period)
    const indicators = calculateIndicators(data)
    const result = { symbol, candles: data, indicators }
    setCache(cacheKey, result, CACHE_TTL.history)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── Financials ────────────────────────────────────────
app.get('/api/stock/:symbol/financials', async (req, res) => {
  const { symbol } = req.params
  const cacheKey = `fin:${symbol}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  try {
    const data = await fetchFinancials(symbol)
    setCache(cacheKey, data, CACHE_TTL.financials)
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ─── News ──────────────────────────────────────────────
app.get('/api/stock/:symbol/news', async (req, res) => {
  const { symbol } = req.params
  const cacheKey = `news:${symbol}`
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  try {
    const news = await fetchNews(symbol)
    setCache(cacheKey, news, CACHE_TTL.news)
    res.json(news)
  } catch (e) {
    getMockNews(symbol).then(n => res.json(n))
  }
})

// ─── Social Media ──────────────────────────────────────
app.get('/api/social', async (req, res) => {
  const cacheKey = 'social:latest'
  const cached = getCached(cacheKey)
  if (cached) return res.json(cached)

  try {
    const posts = await fetchSocialPosts()
    setCache(cacheKey, posts, CACHE_TTL.social)
    res.json(posts)
  } catch (e) {
    res.json(getMockSocialPosts())
  }
})

// ─── AI Analysis ───────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { symbol, positions, rules } = req.body

  try {
    const [quote, hist] = await Promise.all([
      fetchStockData(symbol),
      fetchHistoricalData(symbol, '1y')
    ])
    const indicators = calculateIndicators(hist)
    const signals = getSignals(indicators)

    const analysis = {
      symbol,
      quote,
      signals,
      timestamp: new Date().toISOString(),
    }
    res.json(analysis)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`📊 QuantTrader API running on http://localhost:${PORT}`)
})

/* ─── Mock helpers (fallback when Yahoo is down) ─── */
function getMockSignals() {
  return {
    rsi: 52, rsi_signal: 'neutral',
    macd_signal: 'bullish', trend: 'bullish',
    bb_signal: 'neutral',
    composite_score: 1, overall: 'hold'
  }
}

function getMockNews(symbol) {
  return [
    { title: `${symbol} Q2 Earnings Beat Estimates`, source: 'Reuters', url: '#', published: new Date().toISOString(), sentiment: 'positive' },
    { title: `Analyst Upgrades ${symbol} to Buy`, source: 'Bloomberg', url: '#', published: new Date().toISOString(), sentiment: 'positive' },
    { title: `${symbol} Announces New Product Line`, source: 'CNBC', url: '#', published: new Date().toISOString(), sentiment: 'neutral' },
  ]
}

function getMockSocialPosts() {
  return [
    { id: 1, platform: 'truthsocial', author: 'Donald Trump', handle: '@realDonaldTrump', content: 'The economy is doing GREAT. Markets are at all time highs!', translated: '经济表现很好。市场创历史新高！', timestamp: new Date().toISOString(), sentiment: 'positive', affectedStocks: ['SPY'] },
    { id: 2, platform: 'x', author: 'Sernnity', handle: '@sernnity', content: 'NVDA positioning looks very interesting here. Accumulation zone.', translated: 'NVDA持仓看起来非常有趣。积累区间。', timestamp: new Date(Date.now() - 3600000).toISOString(), sentiment: 'positive', affectedStocks: ['NVDA'] },
    { id: 3, platform: 'truthsocial', author: 'Donald Trump', handle: '@realDonaldTrump', content: 'CHINA trade deal coming along very nicely. Big progress!', translated: '中国贸易协议进展非常顺利。重大进展！', timestamp: new Date(Date.now() - 7200000).toISOString(), sentiment: 'positive', affectedStocks: ['BABA', 'FXI'] },
  ]
}
