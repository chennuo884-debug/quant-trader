/**
 * Yahoo Finance data fetcher via public API endpoints.
 * No API key needed — uses Yahoo's public query endpoints.
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com'
const YAHOO_QUOTE = 'https://query2.finance.yahoo.com'

async function yahooFetch(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      if (i === retries) throw e
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

/**
 * Fetch real-time stock quote
 */
export async function fetchStockData(symbol) {
  const clean = symbol.toUpperCase().trim()
  const url = `${YAHOO_QUOTE}/v7/finance/quote?symbols=${clean}`
  const data = await yahooFetch(url)
  const result = data?.quoteResponse?.result?.[0]
  if (!result) throw new Error(`No data for ${clean}`)

  return {
    symbol: result.symbol,
    name: result.longName || result.shortName || clean,
    price: result.regularMarketPrice,
    change: result.regularMarketChange,
    changePercent: result.regularMarketChangePercent,
    open: result.regularMarketOpen,
    high: result.regularMarketDayHigh,
    low: result.regularMarketDayLow,
    volume: result.regularMarketVolume,
    avgVolume: result.averageDailyVolume3Month,
    marketCap: result.marketCap,
    pe: result.trailingPE,
    forwardPE: result.forwardPE,
    pb: result.priceToBook,
    beta: result.beta,
    dividendYield: result.dividendYield,
    fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    targetMeanPrice: result.targetMeanPrice,
    recommendationMean: result.recommendationMean,
    sector: result.sector,
    industry: result.industry,
    currency: result.currency || 'USD',
    exchange: result.fullExchangeName,
  }
}

/**
 * Fetch historical OHLCV data
 */
export async function fetchHistoricalData(symbol, period = '2y') {
  const clean = symbol.toUpperCase().trim()
  const intervalMap = { '1mo': '1d', '3mo': '1d', '6mo': '1d', '1y': '1d', '2y': '1d', '5y': '1wk' }
  const interval = intervalMap[period] || '1d'

  // Map period to Yahoo's range parameter
  const rangeMap = { '1mo': '1mo', '3mo': '3mo', '6mo': '6mo', '1y': '1y', '2y': '2y', '5y': '5y' }
  const range = rangeMap[period] || '2y'

  const url = `${YAHOO_BASE}/v8/finance/chart/${clean}?range=${range}&interval=${interval}&includePrePost=false`
  const data = await yahooFetch(url)
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error(`No history for ${clean}`)

  const { timestamp, indicators } = result
  const quote = indicators?.quote?.[0] || {}
  const adjClose = indicators?.adjclose?.[0]?.adjclose || quote.close

  const candles = timestamp.map((ts, i) => ({
    time: new Date(ts * 1000).toISOString().split('T')[0],
    open: quote.open?.[i] ?? null,
    high: quote.high?.[i] ?? null,
    low: quote.low?.[i] ?? null,
    close: adjClose?.[i] ?? quote.close?.[i] ?? null,
    volume: quote.volume?.[i] ?? 0,
  })).filter(c => c.open != null && c.close != null)

  return candles
}

/**
 * Fetch news for a stock
 */
export async function fetchNews(symbol) {
  const clean = symbol.toUpperCase().trim()
  // Use Yahoo Finance's news RSS endpoint
  const url = `${YAHOO_BASE}/v1/finance/search?q=${clean}&newsCount=10`
  try {
    const data = await yahooFetch(url)
    const news = data?.news || []
    return news.map(item => ({
      title: item.title,
      source: item.publisher || 'Yahoo Finance',
      url: item.link,
      published: new Date(item.providerPublishTime * 1000).toISOString(),
      summary: item.summary || '',
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
      sentiment: analyzeSentiment(item.title),
    }))
  } catch {
    return []
  }
}

/**
 * Fetch financial statements
 */
export async function fetchFinancials(symbol) {
  const clean = symbol.toUpperCase().trim()
  const url = `${YAHOO_BASE}/ws/finance/v1/finance/quoteSummary/${clean}?modules=financialData,defaultKeyStatistics,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,calendarEvents`
  const data = await yahooFetch(url)
  const modules = data?.quoteSummary?.result?.[0] || {}

  const fd = modules.financialData || {}
  const dks = modules.defaultKeyStatistics || {}

  return {
    symbol: clean,
    profitability: {
      grossMargin: fd.grossMargins,
      operatingMargin: fd.operatingMargins,
      netMargin: fd.profitMargins,
      roe: fd.returnOnEquity,
      roa: fd.returnOnAssets,
    },
    valuation: {
      pe: dks.trailingPE || fd.trailingPE,
      forwardPE: dks.forwardPE || fd.forwardPE,
      peg: dks.pegRatio,
      pb: dks.priceToBook,
      ps: dks.priceToSales,
      evToEbitda: dks.enterpriseToEbitda,
    },
    financialHealth: {
      debtToEquity: fd.debtToEquity,
      currentRatio: fd.currentRatio,
      quickRatio: fd.quickRatio,
      freeCashflow: fd.freeCashflow,
      operatingCashflow: fd.operatingCashflow,
      totalCash: fd.totalCash,
      totalDebt: fd.totalDebt,
    },
    growth: {
      revenueGrowth: fd.revenueGrowth,
      earningsGrowth: fd.earningsGrowth,
      earningsQuarterlyGrowth: fd.earningsQuarterlyGrowth,
    },
    dividend: {
      yield: fd.dividendYield,
      rate: fd.dividendRate,
      payoutRatio: dks.payoutRatio,
    },
    management: {
      heldPercentInsiders: dks.heldPercentInsiders,
      heldPercentInstitutions: dks.heldPercentInstitutions,
      shortPercentOfFloat: dks.shortPercentOfFloat,
      shortRatio: dks.shortRatio,
    },
    events: modules.calendarEvents || {},
  }
}

// Simple sentiment heuristic
function analyzeSentiment(text) {
  const positive = ['up', 'rise', 'gain', 'beat', 'bull', 'buy', 'outperform', 'upgrade', 'growth', 'positive', 'strong', 'rally']
  const negative = ['down', 'fall', 'drop', 'miss', 'bear', 'sell', 'underperform', 'downgrade', 'decline', 'negative', 'weak', 'crash', 'risk']
  const t = text.toLowerCase()
  let score = 0
  positive.forEach(w => { if (t.includes(w)) score++ })
  negative.forEach(w => { if (t.includes(w)) score-- })
  return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
}
