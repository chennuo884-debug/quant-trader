import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook: Fetch real-time stock data from backend Yahoo Finance proxy.
 * Caches results locally to avoid duplicate requests.
 */
const cache = new Map()
const pendingRequests = new Map()

export function useStockQuote(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!symbol) return

    const cacheKey = `quote:${symbol}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < 60_000) {
      setData(cached.data)
      return
    }

    // Deduplicate concurrent requests
    if (pendingRequests.has(cacheKey)) {
      pendingRequests.get(cacheKey).then(d => { if (mountedRef.current) setData(d) })
      return
    }

    setLoading(true)
    const promise = fetch(`/api/stock/${symbol}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.hasData) {
          cache.set(cacheKey, { data: d, ts: Date.now() })
          if (mountedRef.current) { setData(d); setError(null) }
        } else if (d?.stale) {
          if (mountedRef.current) setData(d)
        } else {
          if (mountedRef.current) setError('无法获取数据')
        }
      })
      .catch(e => { if (mountedRef.current) setError(e.message) })
      .finally(() => { if (mountedRef.current) setLoading(false); pendingRequests.delete(cacheKey) })

    pendingRequests.set(cacheKey, promise)
  }, [symbol])

  const refresh = useCallback(async () => {
    if (!symbol) return
    cache.delete(`quote:${symbol}`)
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${symbol}`)
      const d = await res.json()
      cache.set(`quote:${symbol}`, { data: d, ts: Date.now() })
      if (mountedRef.current) { setData(d); setError(null) }
    } catch (e) {
      if (mountedRef.current) setError(e.message)
    }
    if (mountedRef.current) setLoading(false)
  }, [symbol])

  return { data, loading, error, refresh }
}

/**
 * Hook: Fetch historical data for a symbol
 */
export function useStockHistory(symbol, period = '6mo') {
  const [candles, setCandles] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    const cacheKey = `hist:${symbol}:${period}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < 300_000) {
      setCandles(cached.data)
      return
    }

    setLoading(true)
    fetch(`/api/stock/${symbol}/history?period=${period}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.candles?.length > 10) {
          cache.set(cacheKey, { data: d, ts: Date.now() })
          setCandles(d)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [symbol, period])

  return { candles, loading, setCandles }
}

/**
 * Hook: Fetch financials for a symbol
 */
export function useStockFinancials(symbol) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    const cacheKey = `fin:${symbol}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < 3_600_000) {
      setData(cached.data)
      return
    }

    setLoading(true)
    fetch(`/api/stock/${symbol}/financials`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          cache.set(cacheKey, { data: d, ts: Date.now() })
          setData(d)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [symbol])

  return { data, loading, refresh: () => {
    cache.delete(`fin:${symbol}`)
    setLoading(true)
    fetch(`/api/stock/${symbol}/financials`).then(r => r.json()).then(d => {
      cache.set(`fin:${symbol}`, { data: d, ts: Date.now() })
      setData(d)
    }).finally(() => setLoading(false))
  }}
}

/**
 * Hook: Fetch news for a symbol
 */
export function useStockNews(symbol) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    fetch(`/api/stock/${symbol}/news`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setNews(Array.isArray(d) ? d : []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false))
  }, [symbol])

  return { news, loading }
}

/**
 * Hook: Fetch multiple stock quotes at once (for dashboard/positions overview)
 */
export function useMultipleQuotes(symbols) {
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async (syms) => {
    if (!syms || syms.length === 0) return
    setLoading(true)
    const results = {}
    await Promise.all(syms.map(async (sym) => {
      try {
        const res = await fetch(`/api/stock/${sym}`)
        if (res.ok) {
          const d = await res.json()
          results[sym] = d
        }
      } catch {}
    }))
    setQuotes(results)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (symbols && symbols.length > 0) fetchAll(symbols)
  }, [JSON.stringify(symbols)])

  return { quotes, loading, refresh: () => fetchAll(symbols) }
}
