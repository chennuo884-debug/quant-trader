// 通过多个免费接口获取实时股价
// 无需 API Key

// 多个 CORS 代理，第一个失败则尝试下一个
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

/**
 * 获取单只股票实时价格
 * @param {string} symbol - 股票代码，如 NVDA, AAPL
 * @returns {Promise<{price: number, change: number, changePercent: number, name: string}>}
 */
export async function fetchStockPrice(symbol) {
  const cleanSymbol = symbol.toUpperCase().trim()
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1d&range=1d`

  // 先尝试直接请求
  try {
    const data = await fetchWithTimeout(url, 4000)
    return parseYahooResponse(data, cleanSymbol)
  } catch {
    // 无需操作，尝试代理
  }

  // 依次尝试各个代理
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`
      const data = await fetchWithTimeout(proxyUrl, 6000)
      return parseYahooResponse(data, cleanSymbol)
    } catch {
      continue
    }
  }

  throw new Error(`无法获取 ${cleanSymbol} 的价格，请检查网络`)
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
  const validSymbols = symbols.filter(s => s && s.trim())
  if (validSymbols.length === 0) return results

  // 并发请求所有股票
  const promises = validSymbols.map(async (sym) => {
    try {
      results[sym] = await fetchStockPrice(sym)
    } catch (e) {
      results[sym] = { symbol: sym, price: null, error: e.message }
    }
  })

  await Promise.allSettled(promises)
  return results
}
