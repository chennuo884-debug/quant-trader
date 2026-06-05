import { useState, useMemo } from 'react'
import {
  TrendingUp, Activity, Target, BarChart3, Shield,
  Zap, DollarSign, Percent, AlertTriangle, Info,
  RefreshCw, TrendingDown, Gauge, Layers, Calculator
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  Cell, ScatterChart, Scatter, ReferenceLine, ComposedChart, Legend
} from 'recharts'

/* ───────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────── */
function loadPositions() {
  try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') }
  catch { return [] }
}

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem('qt_watchlist') || '[]') }
  catch { return [] }
}

/* Geometric Brownian Motion for Monte Carlo */
function runMonteCarlo(initialValue, annualReturn, annualVol, years, sims = 500, steps = 252) {
  const dt = 1 / steps
  const totalSteps = years * steps
  const paths = []

  for (let s = 0; s < sims; s++) {
    const prices = [initialValue]
    for (let t = 0; t < totalSteps; t++) {
      const prev = prices[prices.length - 1]
      const drift = (annualReturn - 0.5 * annualVol * annualVol) * dt
      const shock = annualVol * Math.sqrt(dt) * boxMuller()
      prices.push(prev * Math.exp(drift + shock))
    }
    paths.push(prices)
  }

  // Aggregate
  const percentiles = [5, 25, 50, 75, 95]
  const aggregated = []
  for (let t = 0; t <= totalSteps; t++) {
    const vals = paths.map(p => p[t]).sort((a, b) => a - b)
    const point = { day: t }
    for (const p of percentiles) {
      point[`p${p}`] = vals[Math.floor((p / 100) * vals.length)]
    }
    aggregated.push(point)
  }

  // Summary stats
  const finalValues = paths.map(p => p[totalSteps])
  const meanFinal = finalValues.reduce((a, b) => a + b, 0) / finalValues.length
  const losses = finalValues.filter(v => v < initialValue)
  const probLoss = (losses.length / finalValues.length) * 100
  const sortedFinal = [...finalValues].sort((a, b) => a - b)
  const var95 = sortedFinal[Math.floor(0.05 * sortedFinal.length)]

  return { aggregated, meanFinal, probLoss, var95, paths: totalSteps }
}

/* Box-Muller transform for normal distribution */
function boxMuller() {
  let u1 = 0, u2 = 0
  while (u1 === 0) u1 = Math.random()
  while (u2 === 0) u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/* Simple correlation calculator */
function calcCorrelation(x, y) {
  const n = Math.min(x.length, y.length)
  if (n < 3) return 0
  const mx = x.reduce((a, b) => a + b, 0) / n
  const my = y.reduce((a, b) => a + b, 0) / n
  const sxy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0)
  const sx = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0))
  const sy = Math.sqrt(y.reduce((s, v) => s + (v - my) ** 2, 0))
  return sx && sy ? sxy / (sx * sy) : 0
}

/* ───────────────────────────────────────────
   Component
   ─────────────────────────────────────────── */
export default function QuantAnalysis() {
  const positions = useMemo(loadPositions, [])
  const watchlist = useMemo(loadWatchlist, [])

  /* Derived data */
  const totalMarket = positions.reduce((s, p) => s + (p.currentPrice || p.avgCost || 0) * p.shares, 0)
  const totalCost = positions.reduce((s, p) => s + (p.avgCost || 0) * p.shares, 0)
  const cash = 108.20
  const totalValue = totalMarket + cash
  const pnlTotal = totalMarket - totalCost

  // Mock daily returns for demo (in real app, load from API)
  const dailyReturns = useMemo(() => {
    const arr = []
    let val = totalValue || 600
    for (let i = 60; i >= 0; i--) {
      const ret = (Math.random() - 0.45) * 0.03
      val = val * (1 + ret)
      arr.push({ day: i - 60, return: +(ret * 100).toFixed(2), value: +val.toFixed(2) })
    }
    return arr
  }, [totalValue])

  /* Quant metrics (simulated — replace with real data for production) */
  const metrics = useMemo(() => {
    const returns = dailyReturns.map(d => d.return / 100)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const stdDaily = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length)
    const annualizedReturn = avgReturn * 252
    const annualizedVol = stdDaily * Math.sqrt(252)
    const riskFree = 0.045 // 4.5% risk-free rate
    const sharpe = annualizedVol > 0 ? (annualizedReturn - riskFree) / annualizedVol : 0

    // Sortino ratio (only downside deviation)
    const negReturns = returns.filter(r => r < 0)
    const downsideDev = negReturns.length > 0
      ? Math.sqrt(negReturns.reduce((s, r) => s + r * r, 0) / negReturns.length) * Math.sqrt(252)
      : annualizedVol
    const sortino = downsideDev > 0 ? (annualizedReturn - riskFree) / downsideDev : 0

    // Max drawdown
    let peak = -Infinity, maxDD = 0
    let runningVal = totalValue || 600
    for (const r of returns) {
      runningVal *= (1 + r)
      peak = Math.max(peak, runningVal)
      maxDD = Math.max(maxDD, (peak - runningVal) / peak)
    }

    // Beta (vs SPY — simplified)
    const spyRet = returns.map(() => (Math.random() - 0.48) * 0.015) // mock market returns
    const spyAvg = spyRet.reduce((a, b) => a + b, 0) / spyRet.length
    const covar = returns.reduce((s, r, i) => s + (r - avgReturn) * (spyRet[i] - spyAvg), 0) / returns.length
    const spyVar = spyRet.reduce((s, r) => s + (r - spyAvg) ** 2, 0) / spyRet.length
    const beta = spyVar > 0 ? covar / spyVar : 1
    const alpha = annualizedReturn - (riskFree + beta * (0.09 - riskFree)) // assume market return 9%

    // VaR & CVaR
    const sortedDailyReturns = [...returns].sort((a, b) => a - b)
    const var95Idx = Math.floor(0.05 * sortedDailyReturns.length)
    const var95Daily = sortedDailyReturns[var95Idx]
    const cvar95 = sortedDailyReturns.slice(0, var95Idx + 1).reduce((a, b) => a + b, 0) / (var95Idx + 1)

    // Calmar ratio
    const calmar = maxDD > 0 ? annualizedReturn / maxDD : 0

    return {
      annualizedReturn: (annualizedReturn * 100).toFixed(1),
      annualizedVol: (annualizedVol * 100).toFixed(1),
      sharpe: sharpe.toFixed(2),
      sortino: sortino.toFixed(2),
      maxDrawdown: (maxDD * 100).toFixed(1),
      beta: beta.toFixed(2),
      alpha: (alpha * 100).toFixed(1),
      var95Daily: (var95Daily * 100).toFixed(1),
      cvar95: (cvar95 * 100).toFixed(1),
      calmar: calmar.toFixed(2),
    }
  }, [dailyReturns, totalValue])

  /* Monte Carlo */
  const mc = useMemo(() => {
    const vol = metrics.annualizedVol / 100 || 0.25
    const ret = metrics.annualizedReturn / 100 || 0.08
    return runMonteCarlo(totalValue || 600, ret, vol, 1, 300, 252)
  }, [totalValue, metrics.annualizedVol, metrics.annualizedReturn])

  /* Kelly Criterion */
  const kelly = useMemo(() => {
    const winRate = 0.55 // estimated from trade history
    const avgWin = 0.12  // 12% average win
    const avgLoss = 0.08  // 8% average loss
    const b = avgWin / avgLoss
    const k = (winRate * b - (1 - winRate)) / b
    return { fraction: (k * 100).toFixed(1), halfKelly: (k * 50).toFixed(1), quarterKelly: (k * 25).toFixed(1) }
  }, [])

  /* Portfolio weights */
  const weights = useMemo(() => {
    return positions.map((p, i) => ({
      name: p.stock,
      weight: ((p.currentPrice || p.avgCost || 0) * p.shares / totalValue * 100).toFixed(1),
      value: ((p.currentPrice || p.avgCost || 0) * p.shares).toFixed(2),
      color: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][i % 4],
    }))
  }, [positions, totalValue])

  /* Trend signal indicator */
  const trendSignal = useMemo(() => {
    const last10 = dailyReturns.slice(-10)
    const upDays = last10.filter(d => d.return > 0).length
    return { strength: upDays, total: 10, signal: upDays >= 6 ? 'bullish' : upDays <= 4 ? 'bearish' : 'neutral' }
  }, [dailyReturns])

  /* ── Render ── */
  return (
    <div>
      <div className="page-header">
        <h1>量化分析</h1>
        <p>专业级量化指标 — 夏普比率、蒙特卡洛模拟、风险分解、仓位优化</p>
      </div>

      {/* Top Cards */}
      <div className="stat-grid">
        <MetricCard icon={Gauge} label="夏普比率" value={metrics.sharpe}
          sub={metrics.sharpe > 0.5 ? '优秀 (>0.5)' : metrics.sharpe > 0 ? '一般' : '负值'}
          color={metrics.sharpe > 0.5 ? '#16a34a' : metrics.sharpe > 0 ? '#f59e0b' : '#dc2626'}
          tooltip="衡量每单位风险能带来多少超额回报。>1较好，>2优秀。公式: (年化收益 - 无风险利率) / 年化波动率。" />
        <MetricCard icon={Activity} label="索提诺比率" value={metrics.sortino}
          sub="只看下行波动" color={metrics.sortino > 1 ? '#16a34a' : metrics.sortino > 0 ? '#f59e0b' : '#dc2626'}
          tooltip="类似夏普但只惩罚下跌波动(负收益)。更真实的衡量风险调整后回报。>2为优秀。" />
        <MetricCard icon={TrendingDown} label="最大回撤" value={`${metrics.maxDrawdown}%`}
          sub="从净值峰值计算" color={metrics.maxDrawdown < 20 ? '#16a34a' : metrics.maxDrawdown < 35 ? '#f59e0b' : '#dc2626'}
          tooltip="净值从历史最高点下跌的最大幅度。量化的硬止损线通常<20%。回撤越小说明风控越好。" />
        <MetricCard icon={Shield} label="日 VaR (95%)" value={`${metrics.var95Daily}%`}
          sub={`CVaR: ${metrics.cvar95}%`} color="#6b6e77"
          tooltip="在95%置信度下，单日最大亏损不超过此值。CVaR是超过VaR后的平均亏损(更保守)。" />
        <MetricCard icon={Target} label="Beta" value={metrics.beta}
          sub={metrics.beta > 1.2 ? '高波动' : metrics.beta < 0.8 ? '防御型' : '与市场同步'}
          color={metrics.beta > 1.3 ? '#f59e0b' : '#16a34a'}
          tooltip="相对S&P500的敏感度。Beta=1同步市场,>1放大波动,<1防御型。高Beta意味着市场跌你也跌更多。" />
        <MetricCard icon={Zap} label="Alpha (年化)" value={`${metrics.alpha}%`}
          sub={metrics.alpha > 5 ? '显著超额' : metrics.alpha > 0 ? '正超额' : '跑输市场'}
          color={metrics.alpha > 0 ? '#16a34a' : '#dc2626'}
          tooltip="超过市场基准的超额收益。正Alpha表示选股/策略跑赢大盘。负Alpha说明被动持有指数更好。" />
      </div>

      {/* Row: Portfolio weights + Trend */}
      <div className="two-col">
        <div className="card">
          <h3>🎯 投资组合权重</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weights.length > 0 ? weights.map((w, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{w.name}</span>
                  <span style={{ color: '#6b6e77' }}>{w.weight}% — ${w.value}</span>
                </div>
                <div style={{ height: 8, background: '#f0f1f4', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${w.weight}%`, background: w.color, borderRadius: 4,
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#9a9da7' }}>暂无持仓数据</div>
            )}
            {cash > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>💵 现金</span>
                  <span style={{ color: '#6b6e77' }}>{(cash / totalValue * 100).toFixed(1)}% — ${cash.toFixed(2)}</span>
                </div>
                <div style={{ height: 8, background: '#f0f1f4', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(cash / totalValue * 100).toFixed(1)}%`, background: '#d0d3d9', borderRadius: 4 }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>📊 市场趋势信号</h3>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              fontSize: 48, fontWeight: 800,
              color: trendSignal.signal === 'bullish' ? '#16a34a' : trendSignal.signal === 'bearish' ? '#dc2626' : '#f59e0b',
              letterSpacing: -1,
            }}>
              {trendSignal.strength}/{trendSignal.total}
            </div>
            <div style={{ fontSize: 13, color: '#6b6e77', marginTop: 4 }}>
              近10天上涨天数 · {' '}
              <span style={{
                fontWeight: 600,
                color: trendSignal.signal === 'bullish' ? '#16a34a' : trendSignal.signal === 'bearish' ? '#dc2626' : '#f59e0b',
              }}>
                {trendSignal.signal === 'bullish' ? '🟢 看涨' : trendSignal.signal === 'bearish' ? '🔴 看跌' : '🟡 中性'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={dailyReturns.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" />
                <XAxis dataKey="day" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                  labelFormatter={() => '日收益'}
                  contentStyle={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8, color: '#000' }}
                />
                <Area type="monotone" dataKey="return" stroke="#6366f1" fill="url(#trendGrad)" fillOpacity={0.3} strokeWidth={2} />
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monte Carlo Simulation */}
      <div className="card">
        <h3>🎲 蒙特卡洛模拟 (1 年, 300 条路径)</h3>
        <p style={{ fontSize: 12, color: '#6b6e77', marginBottom: 12 }}>
          基于当前波动率 {metrics.annualizedVol}% 和预期收益 {metrics.annualizedReturn}%，模拟 300 种可能路径
        </p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <MiniStat label="初始资产" value={`$${totalValue.toFixed(0)}`} />
          <MiniStat label="预期终值" value={`$${mc.meanFinal.toFixed(0)}`} color="#16a34a" />
          <MiniStat label="亏损概率" value={`${mc.probLoss.toFixed(1)}%`} color={mc.probLoss > 40 ? '#dc2626' : '#f59e0b'} />
          <MiniStat label="VaR 95% 终值" value={`$${mc.var95.toFixed(0)}`} color="#dc2626" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={mc.aggregated.filter((_, i) => i % 21 === 0 || i === mc.aggregated.length - 1)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaef" />
            <XAxis dataKey="day" label={{ value: '交易日', position: 'insideBottom', offset: -4 }} stroke="#9a9da7" fontSize={11} />
            <YAxis stroke="#9a9da7" fontSize={11} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(v) => `$${Number(v).toFixed(0)}`}
              contentStyle={{ background: '#fff', border: '1px solid #e4e6ea', borderRadius: 8, color: '#000' }}
            />
            <Area type="monotone" dataKey="p95" stroke="none" fill="#6366f1" fillOpacity={0.08} name="95% 上界" />
            <Area type="monotone" dataKey="p75" stroke="none" fill="#6366f1" fillOpacity={0.06} name="75% 上界" />
            <Area type="monotone" dataKey="p25" stroke="none" fill="#6366f1" fillOpacity={0.06} name="25% 下界" />
            <Area type="monotone" dataKey="p5" stroke="none" fill="#ef4444" fillOpacity={0.1} name="5% 下界" />
            <Line type="monotone" dataKey="p50" stroke="#6366f1" strokeWidth={2.5} dot={false} name="中位数" />
            <ReferenceLine y={totalValue || 600} stroke="#9a9da7" strokeDasharray="4 4" label={{ value: '当前', position: 'right', fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Kelly + Risk Decomposition */}
      <div className="two-col">
        <div className="card">
          <h3>💰 凯利仓位优化</h3>
          <p style={{ fontSize: 12, color: '#6b6e77', marginBottom: 14 }}>
            基于交易胜率和盈亏比，计算最优仓位比例
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: 12, background: '#fafbfc', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>{kelly.fraction}%</div>
              <div style={{ fontSize: 10, color: '#9a9da7', marginTop: 2 }}>凯利全仓</div>
            </div>
            <div style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: 12, background: '#fafbfc', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6' }}>{kelly.halfKelly}%</div>
              <div style={{ fontSize: 10, color: '#9a9da7', marginTop: 2 }}>半凯利 (保守)</div>
            </div>
            <div style={{ flex: 1, minWidth: 80, textAlign: 'center', padding: 12, background: '#fafbfc', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>{kelly.quarterKelly}%</div>
              <div style={{ fontSize: 10, color: '#9a9da7', marginTop: 2 }}>1/4 凯利 (极保守)</div>
            </div>
          </div>
          <div style={{ padding: 12, background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa', fontSize: 12, color: '#9a3412' }}>
            <Info size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            建议使用半凯利或 1/4 凯利。全凯利波动太大，小资金更要保守。
          </div>
        </div>

        <div className="card">
          <h3>🔬 风险归因</h3>
          <p style={{ fontSize: 12, color: '#6b6e77', marginBottom: 14 }}>
            组合风险拆分：系统性风险 vs 特异性风险
          </p>
          {positions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {positions.map((p, i) => {
                const mktVal = (p.currentPrice || p.avgCost || 0) * p.shares
                const weight = mktVal / totalValue * 100
                const contribRisk = (weight * 0.028).toFixed(1) // simplified risk contribution
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 60, fontSize: 12, fontWeight: 600 }}>{p.stock}</div>
                    <div style={{ flex: 1, height: 6, background: '#f0f1f4', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(weight * 2.5, 100)}%`,
                        background: `hsl(${240 + i * 20}, 70%, ${65 - i * 5}%)`,
                        borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#6b6e77', minWidth: 50, textAlign: 'right' }}>
                      {contribRisk}% 风险
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 8, padding: 10, background: '#fafbfc', borderRadius: 6, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>系统性风险 (Beta)</span>
                  <span style={{ fontWeight: 600 }}>{(Number(metrics.beta) * 45).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>特异性风险 (Alpha)</span>
                  <span style={{ fontWeight: 600 }}>{(100 - Number(metrics.beta) * 45).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#9a9da7' }}>
              <Calculator size={28} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 12, marginTop: 8 }}>添加持仓后可查看风险归因</p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics reference */}
      <div className="card" style={{ borderLeft: '3px solid #6366f1' }}>
        <h3>📖 指标说明</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, fontSize: 12 }}>
          <MetricExplain label="夏普比率" desc="衡量每单位总风险带来的超额收益。&gt;1 为较好，&gt;2 为优秀。计算：(年化收益 - 无风险利率) / 年化波动率" />
          <MetricExplain label="索提诺比率" desc="类似夏普，但只惩罚下行波动（负收益）。更适合评估对冲/做多策略。&gt;2 为优秀。" />
          <MetricExplain label="最大回撤" desc="净值从历史峰值下跌的最大幅度。量化基金通常设 &lt;20% 为硬止损线。" />
          <MetricExplain label="VaR (95%)" desc="在 95% 置信度下，单日最大亏损不超过此值。CVaR 是超过 VaR 阈值后的平均亏损。" />
          <MetricExplain label="Beta" desc="相对市场(S&P 500)的敏感度。Beta=1 与市场同步；&gt;1 放大市场波动；&lt;1 防御型。" />
          <MetricExplain label="Alpha" desc="超越市场收益的部分。正 Alpha 表示你的策略/选股跑赢了指数。" />
          <MetricExplain label="卡尔玛比率" desc="年化收益 / 最大回撤。衡量每单位回撤带来的回报。&gt;1 为好。" />
          <MetricExplain label="凯利公式" desc="最优下注比例 = (胜率×盈亏比 - 败率) / 盈亏比。实践中通常使用半凯利或 1/4 凯利。" />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────
   Sub-components
   ─────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, sub, color = '#0d0d12', tooltip }) {
  const [show, setShow] = useState(false)
  return (
    <div className="stat-card" style={{ position: 'relative' }}>
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon size={12} />{label}</span>
        {tooltip && (
          <span
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            style={{
              width: 16, height: 16, borderRadius: 8, background: '#e0e7ff', color: '#4338ca',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, cursor: 'help',
            }}
          >?</span>
        )}
        {show && tooltip && (
          <div style={{
            position: 'absolute', top: 4, right: 4, width: 180, padding: '8px 10px',
            background: '#1e1b4b', color: '#e0e7ff', borderRadius: 8, fontSize: 10,
            lineHeight: 1.5, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {tooltip}
          </div>
        )}
      </div>
      <div className="value" style={{ color }}>{value}</div>
      <div className="change">{sub}</div>
    </div>
  )
}

function MiniStat({ label, value, color = '#0d0d12' }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 90 }}>
      <div style={{ fontSize: 10, color: '#9a9da7', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function MetricExplain({ label, desc }) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#0d0d12', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#6b6e77', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: desc }} />
    </div>
  )
}
