// 通过 Yahoo Finance 免费接口获取实时股价
// 无需 API Key，但有跨域限制 — 浏览器端通过代理或直接请求

const CORS_PROXY = 'https://api.allorigins.win/raw?url='

/**
 * 获取单只股票实时价格
 * @param {string} symbol - 股票代码，如 NVDA, AAPL
 * @returns {Promise<{price: number, change: number, changePercent: number, name: string}>}
 */
export async function fetchStockPrice(symbol) {
  const cleanSymbol = symbol.toUpperCase().trim()

  try {
    // 方案1: 尝试直接请求 Yahoo Finance (可能被CORS阻止)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1d&range=1d`
    const data = await fetchWithTimeout(url, 5000)
    return parseYahooResponse(data, cleanSymbol)
  } catch {
    // 方案2: 通过代理
    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1d&range=1d`)}`
      const data = await fetchWithTimeout(proxyUrl, 8000)
      return parseYahooResponse(data, cleanSymbol)
    } catch {
      throw new Error(`无法获取 ${cleanSymbol} 的价格`)
    }
  }
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function parseYahooResponse(data, symbol) {
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error('无数据')

  const meta = result.meta
  const price = meta.regularMarketPrice
  const previousClose = meta.previousClose || meta.chartPreviousClose
  const change = price - previousClose
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

  return {
    symbol,
    name: meta.symbol || symbol,
    price,
    change: +change.toFixed(2),
    changePercent: +changePercent.toFixed(2),
    currency: meta.currency || 'USD',
    timestamp: new Date().toISOString(),
  }
}

/**
 * 批量获取多只股票价格
 * @param {string[]} symbols
 * @returns {Promise<Object>}
 */
export async function fetchMultiplePrices(symbols) {
  const results = {}
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        results[sym] = await fetchStockPrice(sym)
      } catch (e) {
        results[sym] = { symbol: sym, price: null, error: e.message }
      }
    })
  )
  return results
}
