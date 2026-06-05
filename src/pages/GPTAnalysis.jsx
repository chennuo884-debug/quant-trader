import { useState, useRef, useEffect } from 'react'
import { Send, Save, Trash2, Download, Loader2, Bot, Clock, ChevronDown, TrendingUp, AlertTriangle, Shield, Target } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function loadHistory() { try { return JSON.parse(localStorage.getItem('qt_gpt_history') || '[]') } catch { return [] } }
function saveHistory(data) { localStorage.setItem('qt_gpt_history', JSON.stringify(data)) }

const templates = [
  { id: 'portfolio', label: '持仓综合分析', icon: TrendingUp, prompt: '分析我的投资组合，评估风险收益比、行业集中度、仓位合理性。' },
  { id: 'buy', label: '买入建议', icon: Target, prompt: '基于我的持仓和现金，哪些买入操作合理？哪些应该等待？' },
  { id: 'sell', label: '卖出/止损建议', icon: AlertTriangle, prompt: '检查持仓，哪些该止盈？哪些该止损？哪些触发卖出规则？' },
  { id: 'risk', label: '风险评估', icon: Shield, prompt: '评估当前组合风险：回撤、集中、流动性。给出风控建议。' },
]

export default function GPTAnalysis() {
  const [history, setHistory] = useState(loadHistory)
  const [selectedTemplate, setSelectedTemplate] = useState('portfolio')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [collapsedCards, setCollapsedCards] = useState({})
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [response])

  const positions = (() => { try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') } catch { return [] } })()

  const buildContext = () => {
    let ctx = '## 当前持仓\n\n'
    if (!positions.length) ctx += '（无持仓数据）\n'
    else {
      ctx += '| 股票 | 数量 | 成本 | 现价 | 市值 | 盈亏 | 占比 |\n'
      ctx += '|------|------|------|------|------|------|------|\n'
      positions.forEach(p => {
        const price = p.currentPrice || p.avgCost
        const mkt = price * p.shares
        const pnl = (price - p.avgCost) * p.shares
        const weight = (mkt / 612 * 100).toFixed(1)
        ctx += `| ${p.stock} | ${p.shares}股 | $${p.avgCost.toFixed(2)} | $${price.toFixed(2)} | $${mkt.toFixed(2)} | $${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} | ${weight}% |\n`
      })
    }
    ctx += '\n**现金**: $108.20 | **总资产**: ~$612\n\n**风控规则**: 买入≥60分, 单票≤40%, 现金≥15%, 止损-10%, 止盈+15%, 移动止损-8%'
    return ctx
  }

  const handleSubmit = async () => {
    const prompt = customPrompt || templates.find(t => t.id === selectedTemplate)?.prompt || ''
    if (!prompt) return
    setLoading(true); setError(''); setResponse('')

    try {
      const token = localStorage.getItem('qt_auth_token')
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, context: buildContext() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResponse(data.result)
    } catch (err) {
      setError(err.message)
      // Fallback to simulated analysis
      await simulateAnalysis()
    }
    setLoading(false)
  }

  const simulateAnalysis = async () => {
    const texts = {
      portfolio: `## 📊 持仓综合分析

### 💼 资产概览

| 指标 | 数值 | 状态 |
|------|------|------|
| 总资产 | ~$612 | — |
| 持仓市值 | ~$504 | 82.3% |
| 可用现金 | $108.20 | 17.7% |
| 持仓数量 | 2只 | ≤3 (合规模) |

### ⚠️ 风险提示

1. **NVDA 仓位 48.6%** 超过 40% 上限 — 🔴 高风险
2. **AI/半导体集中度 83%** 远超 60% — 🔴 高风险
3. 现金比例 17.7% 勉强合格 — 🟡 关注

### 📈 综合建议

- **置信度**: 中
- **操作**: 持有，不增不减
- **原因**: 现金太少，无法操作。当前仓位虽超标但 NVDA 处于上升趋势

### 🟢 看多理由

1. NVDA 受益 AI 算力需求持续增长
2. MU 存储需求上升，财报有望超预期

### 🔴 看空理由

1. 持仓过度集中，系统性风险大
2. 单票NVDA 48.6%超标，一旦回调影响巨大

### ⚡ 失效条件

- NVDA 跌破 $130 → 触发移动止损
- AI 板块整体回调 15% → 强制减仓`,
      buy: `## 🎯 买入建议

### 📋 当前约束

- 可用现金: $108.20
- 可新开仓位: 1只 (已达3只上限? 否，当前2只)
- 单票最大: $612 × 40% = $244.80

### 🔍 建议

- **置信度**: 低
- **不建议现在买入**

**原因**:
1. 现金 $108.20 太少，买错代价大
2. NVDA 已超标，不应继续加仓 AI 板块
3. 等待 SNDK 回调到 $1,650 附近再做判断

### ⚡ 条件满足后可考虑

- 减仓 NVDA 释放资金后
- 寻找非 AI/半导体板块机会分散风险`,
      sell: `## 📤 卖出/止损建议

### 📊 逐持仓分析

| 股票 | 浮盈 | 止损位 | 止盈位 | 操作 |
|------|------|--------|--------|------|
| NVDA | +$3.40 | $136.62 (-8%) | $170.78 (+15%) | 🟡 设移动止损 |
| MU | +$7.10 (8.3%) | $78.38 (-8%) | $97.98 (+15%) | 🟢 接近止盈线 |

### 🎯 具体操作

1. **NVDA**: 设移动止损 $136.62（当前价 -8%），每日更新
2. **MU**: 浮盈 8.3% 接近 15% 止盈线，设限价卖单 $98 卖 50%
3. **SNDK 教训**: 已错过 45% 涨幅，规则触发时报 65 分但主观否决

### ⚠️ 失效条件

- NVDA 突发利空带来的跳空下跌可能越过止损价`,
      risk: `## 🛡️ 风险评估报告

### 📈 风险指标

| 指标 | 数值 | 阈值 | 状态 |
|------|------|------|------|
| VaR (95%单日) | $18.40 | <$30 | 🟢 |
| 最大回撤(模拟) | 2.1% | <15% | 🟢 |
| Beta | ~1.4 | <1.5 | 🟡 |
| 行业集中度 | 83% | <60% | 🔴 |
| 单票集中度 | 48.6% | <40% | 🔴 |

### 🧪 压力测试

| 情景 | 跌幅 | 损失 | 剩余资产 | 回撤 |
|------|------|------|----------|------|
| AI回调 20% | -20% | -$100 | $512 | 16.3% |
| 市场崩盘 | -30% | -$150 | $462 | 24.5% |
| NVDA暴跌 | -25% | -$74 | $538 | 12.1% |

### 🎯 风控建议

1. **立即**: 设 NVDA 移动止损
2. **本周**: 考虑减仓 NVDA 到 40% 以下
3. **持续**: 不再加仓 AI/半导体板块`,
    }
    const text = texts[selectedTemplate] || texts.portfolio
    for (let i = 0; i < text.length; i += 8) {
      setResponse(prev => prev + text.slice(i, i + 8))
      await new Promise(r => setTimeout(r, 8))
    }
  }

  const handleSave = () => {
    if (!response) return
    const r = { id: Date.now(), template: selectedTemplate, prompt: customPrompt || templates.find(t => t.id === selectedTemplate)?.prompt || '', response, date: new Date().toISOString() }
    const u = [r, ...history]; setHistory(u); saveHistory(u)
  }

  const handleDelete = (id) => { const u = history.filter(h => h.id !== id); setHistory(u); saveHistory(u) }
  const handleExport = (r) => {
    const t = `# GPT 分析报告\n\n${new Date(r.date).toLocaleString()}\n\n${r.response}`
    const b = new Blob([t], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `analysis-${r.id}.md`; a.click()
  }

  const toggleCard = (id) => setCollapsedCards(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div>
      <div className="page-header">
        <h1>AI 持仓分析</h1>
        <p>DeepSeek / Claude 智能分析持仓，结构化输出含置信度、风险提示和失效条件。</p>
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Left: Input */}
        <div className="card">
          <h3>📋 选择分析类型</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {templates.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setCustomPrompt('') }}
                style={{
                  textAlign: 'left', padding: '12px 14px',
                  border: `2px solid ${selectedTemplate === t.id ? '#6366f1' : '#e4e6ea'}`,
                  borderRadius: 10, background: selectedTemplate === t.id ? '#f5f3ff' : '#fff',
                  cursor: 'pointer', fontSize: 13,
                  color: selectedTemplate === t.id ? '#1e1b4b' : '#6b6e77',
                  fontWeight: selectedTemplate === t.id ? 600 : 400,
                  transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <t.icon size={15} color={selectedTemplate === t.id ? '#6366f1' : '#9a9da7'} />
                  <span>{t.label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9a9da7', marginTop: 3, paddingLeft: 23 }}>{t.prompt}</div>
              </button>
            ))}
          </div>
          <div className="form-group">
            <label>💬 自定义分析需求</label>
            <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
              placeholder="例如：分析 NVDA 当前是否该减仓，考虑其占我总资产的 48%..." rows={3} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</>
              : <><Send size={14} /> 开始分析</>}
          </button>
          <div style={{ marginTop: 14, padding: 12, background: '#f5f3ff', borderRadius: 8, fontSize: 11, border: '1px solid #e0e7ff' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#4338ca' }}>📊 分析上下文</div>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#6b6e77', fontSize: 10, lineHeight: 1.5, maxHeight: 200, overflowY: 'auto' }}>
              {buildContext()}
            </pre>
          </div>
        </div>

        {/* Right: Output */}
        <div className="card" style={{ minHeight: 500 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0 }}>
              {loading ? '⏳ 分析中...' : response ? '✅ 分析结果' : '⏳ 等待分析'}
            </h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {response && <button className="btn btn-primary btn-sm" onClick={handleSave}
                style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
                <Save size={12} /> 保存</button>}
              <button className="btn btn-outline btn-sm" onClick={() => setShowHistory(!showHistory)}>
                <Clock size={12} /> 历史{history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 12, marginBottom: 12, border: '1px solid #fecaca' }}>
              <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{error}
            </div>
          )}

          <div className="markdown-output" style={{
            maxHeight: 500, overflowY: 'auto', padding: 20,
            background: '#fafbfc', borderRadius: 10, border: '1px solid #eceef2',
            minHeight: 320, lineHeight: 1.8, fontSize: 13,
          }}>
            {response ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ node, ...props }) => <h2 style={{ color: '#1e1b4b', fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8, borderBottom: '1px solid #e4e6ea', paddingBottom: 4 }} {...props} />,
                  h3: ({ node, ...props }) => <h3 style={{ color: '#3730a3', fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 6 }} {...props} />,
                  h4: ({ node, ...props }) => <h4 style={{ color: '#0d0d12', fontSize: 13, fontWeight: 600, marginTop: 12, marginBottom: 4 }} {...props} />,
                  table: ({ node, ...props }) => (
                    <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }} {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => <th style={{ background: '#f5f3ff', padding: '8px 12px', textAlign: 'left', fontWeight: 600, border: '1px solid #e0e7ff', color: '#3730a3', fontSize: 11 }} {...props} />,
                  td: ({ node, ...props }) => <td style={{ padding: '8px 12px', border: '1px solid #eceef2' }} {...props} />,
                  strong: ({ node, ...props }) => <strong style={{ color: '#0d0d12', fontWeight: 600 }} {...props} />,
                  li: ({ node, ...props }) => <li style={{ marginBottom: 4 }} {...props} />,
                  ul: ({ node, ...props }) => <ul style={{ paddingLeft: 18, marginBottom: 8 }} {...props} />,
                  ol: ({ node, ...props }) => <ol style={{ paddingLeft: 18, marginBottom: 8 }} {...props} />,
                  p: ({ node, ...props }) => <p style={{ marginBottom: 8 }} {...props} />,
                  code: ({ node, inline, ...props }) =>
                    inline
                      ? <code style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: 3, fontSize: 11 }} {...props} />
                      : <pre style={{ background: '#1e1b4b', color: '#e0e7ff', padding: 12, borderRadius: 8, overflow: 'auto', fontSize: 11 }}><code {...props} /></pre>,
                }}
              >
                {response}
              </ReactMarkdown>
            ) : (
              <div style={{ color: '#9a9da7', textAlign: 'center', paddingTop: 80 }}>
                <Bot size={36} style={{ opacity: 0.15, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>选择分析类型，点击「开始分析」</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>
                  {localStorage.getItem('ds_api_key') ? '🟢 已配置 DeepSeek API' : '⚪ 未配置 API Key，使用内置模板'}
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* History */}
      {showHistory && (
        <div className="card">
          <h3>📚 历史分析记录</h3>
          {history.length === 0 ? <div className="empty-state"><Clock size={28} /><p>暂无记录</p></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(h => (
                <div key={h.id} style={{ border: '1px solid #eceef2', borderRadius: 10, overflow: 'hidden' }}>
                  <div onClick={() => toggleCard(h.id)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: '#fafbfc', cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="tag" style={{ background: '#f5f3ff', color: '#4338ca', border: '1px solid #e0e7ff' }}>
                        {templates.find(t => t.id === h.template)?.label || h.template}
                      </span>
                      <span style={{ fontSize: 11, color: '#9a9da7' }}>{new Date(h.date).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleExport(h) }}><Download size={11} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(h.id) }}><Trash2 size={11} color="#9a9da7" /></button>
                      <ChevronDown size={14} color="#9a9da7" style={{ transform: collapsedCards[h.id] ? 'rotate(-90deg)' : 'none', transition: '0.2s' }} />
                    </div>
                  </div>
                  {!collapsedCards[h.id] && (
                    <div style={{ padding: '12px 16px', fontSize: 12, color: '#6b6e77', maxHeight: 200, overflow: 'hidden' }}>
                      {h.response.substring(0, 400)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
