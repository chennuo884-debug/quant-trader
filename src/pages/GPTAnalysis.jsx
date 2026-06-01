import { useState, useRef, useEffect } from 'react'
import { Send, Save, Trash2, Download, Loader2, Bot, Clock, ChevronDown } from 'lucide-react'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('qt_gpt_history') || '[]') }
  catch { return [] }
}
function saveHistory(data) {
  localStorage.setItem('qt_gpt_history', JSON.stringify(data))
}

const analysisTemplates = [
  { id: 'portfolio', label: '📊 持仓综合分析', prompt: '请分析我当前的投资组合，评估风险收益比、行业集中度、仓位是否合理，并给出具体建议。' },
  { id: 'buy', label: '🎯 买入建议', prompt: '基于我的持仓和现金情况，分析哪些买入操作是合理的。哪些股票应该等待？哪些接近买点？' },
  { id: 'sell', label: '🚨 卖出/止损建议', prompt: '检查我的持仓，哪些应该止盈？哪些应该止损？哪些已经触发卖出规则？' },
  { id: 'rules', label: '📐 规则遵守检查', prompt: '检查我最近的交易记录，评估规则执行率。哪些交易遵守了规则？哪些是情绪化交易？' },
  { id: 'risk', label: '🛡️ 风险评估', prompt: '评估我当前组合的风险：回撤风险、集中风险、流动性风险。给出风控建议。' },
]

export default function GPTAnalysis() {
  const [history, setHistory] = useState(loadHistory)
  const [selectedTemplate, setSelectedTemplate] = useState('portfolio')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [response, loading])

  const positions = (() => {
    try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') }
    catch { return [] }
  })()

  // 构建完整的持仓上下文
  const buildContext = () => {
    let ctx = '我的当前持仓：\n'
    if (positions.length === 0) {
      ctx += '（无持仓数据，请在持仓管理页面添加）\n'
    } else {
      positions.forEach(p => {
        const mktVal = (p.currentPrice || p.avgCost) * p.shares
        const pnl = ((p.currentPrice || p.avgCost) - p.avgCost) * p.shares
        ctx += `- ${p.stock}${p.ticker ? ` (${p.ticker})` : ''}: ${p.shares}股, 成本$${p.avgCost.toFixed(2)}, 现价$${(p.currentPrice || p.avgCost).toFixed(2)}, 市值$${mktVal.toFixed(2)}, 浮动盈亏$${pnl.toFixed(2)}\n`
      })
    }
    ctx += `\n可用现金: $108.20\n总投资资产约: $612\n`
    ctx += '投资风格: 小资金个人投资者，偏好美股半导体/AI板块\n'
    ctx += '量化规则: 买入评分需≥60分, 单票≤40%, 现金≥15%, 止损-10%, 止盈+15%, 移动止损-8%'
    return ctx
  }

  const handleSubmit = async () => {
    const prompt = customPrompt || analysisTemplates.find(t => t.id === selectedTemplate)?.prompt || ''
    if (!prompt) return

    setLoading(true)
    setError('')
    setResponse('')

    const context = buildContext()
    const fullPrompt = `${context}\n\n用户问题：${prompt}\n\n请像GPT一样给出专业的持仓分析，用中文回答。分析要具体、可操作、有数据支撑。`

    try {
      const apiKey = localStorage.getItem('ds_api_key') || ''
      const baseUrl = localStorage.getItem('ds_base_url') || 'https://api.deepseek.com'

      if (!apiKey) {
        // 没有API Key时使用模拟分析
        await simulateAnalysis()
      } else {
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是一个专业的量化投资顾问，擅长美股分析、仓位管理和风控。用户是小资金个人投资者，偏好半导体/AI板块。用中文回答，分析要具体、可操作。' },
              { role: 'user', content: fullPrompt },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'API错误')
        setResponse(data.choices[0].message.content)
      }
    } catch (err) {
      setError(err.message || '请求失败')
      await simulateAnalysis()
    }

    setLoading(false)
    // 滚动到底部交给 useEffect
  }

  // 模拟GPT分析（当没有API Key或API失败时）
  const simulateAnalysis = async () => {
    const templates = {
      portfolio: `## 📊 持仓综合分析

### 当前状况
- **总资产**: 约 $612，其中持仓市值约 $504
- **现金**: $108.20 (17.7%)
- **持仓**: ${positions.length}只 (NVDA, MU)
- **总盈亏**: 浮动盈利 ~$13.90

### 风险评估
1. **集中度过高** ⚠️ — NVDA + MU都属于AI/半导体板块，板块集中度约83%，远超60%上限
2. **NVDA仓位超标** 🔴 — 单票占比48.6%，超过40%规则上限
3. **现金勉强合格** ✅ — 17.7%略高于15%最低线

### 具体建议
1. **不要再加仓AI板块** — 你已经充分暴露在这个方向上
2. **下次入金后考虑ETF** — 用SOXX或SMH ETF降低个股风险
3. **严格止损** — MU设8%移动止损，NVDA设10%硬止损
4. **观察SNDK但不要追** — 等回调到$1,650附近才是你的买点`,

      buy: `## 🎯 买入建议

### 当前状态
- 可用现金: $108.20
- 持仓: ${positions.length}只 (上限3只)
- 还能新开: 1只

### 不建议现在买入的理由
1. **现金太少** — $108只能做一笔交易，用错代价很大
2. **已有AI暴露** — 再买AI/半导体只会加剧集中风险
3. **没有触发买点** — SNDK高企($1,729)，距目标买$1,650还有差距

### 如果一定要买
- 将买入评分 ≥ 60 分作为硬性门槛
- 只做1股试水，设置5%硬止损
- 优先考虑非AI板块的票分散风险`,

      sell: `## 🚨 卖出/止损建议

### NVDA (英伟达)
- 当前浮盈 +$3.40 (+1.2%)
- 建议: **持有，设移动止损 -8%**
- 止损价: $148.50 × 0.92 = **$136.62**

### MU (美光)
- 当前浮盈 +$7.10 (+8.3%)
- 已接近15%止盈线！
- 建议: **设止盈$98 (15%)，卖50%仓位**
- 止损价: $92.30 × 0.92 = **$84.92**

### SNDK (已错过)
- 虽然没持仓，但这是个教训
- 规则触发买入(65分)时被情绪否决，错过45%涨幅
- 建议: 以后规则触发就执行，不再用情绪否决`,

      rules: `## 📐 规则遵守检查

### 近期交易违规分析

| 交易 | 评分 | 是否守规 | 问题 |
|------|------|----------|------|
| NVDA 6/1 | 40分 | ❌ | 评分不足60分 |
| MU 5/25 | 50分 | ❌ | 评分不足，追涨 |
| SNDK 5/20 | 65分 | ❌ | 规则触发了却不敢买！|
| NVDA 5/15 | 15分 | ❌ | 严重不足，纯凭感觉 |

### 结论
**规则执行率: 0%** 🚨

这是最大的问题。你有规则但不执行，等于没有规则。SNDK的教训最惨痛——规则给了65分让你买，你却因为「觉得太高」不敢买，结果错过45%涨幅。`,

      risk: `## 🛡️ 风险评估报告

### 风险指标
- **VaR (95%)**: $18.40 — 任一天有5%概率亏超过这个数
- **最大回撤上限**: 15% ($92) — 当前回撤 2.1%
- **Beta (估计)**: 1.4 — 组合波动性比大盘高40%

### 红色警报
1. 🔴 **NVDA仓位 48.6% > 40%上限** — 必须减仓或等资金增加
2. 🔴 **AI板块集中度 83% > 60%上限** — 系统性风险极高
3. 🟡 **只剩$108现金** — 再错一次就没有补仓空间了

### 压力测试
如果AI板块回调20%（完全可能发生）:
- 持仓可能亏损 ~$100
- 总资产从 $612 → $512
- 回撤达 16.3%，触发最大回撤警报`,
    }

    const key = selectedTemplate
    const text = templates[key] || '无法生成分析。请配置 DeepSeek API Key 后获取实时 GPT 分析。'

    // 模拟打字效果
    for (let i = 0; i < text.length; i += 5) {
      const chunk = text.slice(i, i + 5)
      setResponse(prev => prev + chunk)
      await new Promise(r => setTimeout(r, 15))
    }
  }

  const handleSave = () => {
    if (!response) return
    const record = {
      id: Date.now(),
      template: selectedTemplate,
      prompt: customPrompt || analysisTemplates.find(t => t.id === selectedTemplate)?.prompt || '',
      response,
      date: new Date().toISOString(),
    }
    const updated = [record, ...history]
    setHistory(updated)
    saveHistory(updated)
  }

  const handleDelete = (id) => {
    const updated = history.filter(h => h.id !== id)
    setHistory(updated)
    saveHistory(updated)
  }

  const handleExport = (record) => {
    const text = `# GPT 持仓分析\n\n日期: ${new Date(record.date).toLocaleString()}\n类型: ${record.template}\n\n## 分析内容\n\n${record.response}`
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `gpt-analysis-${record.id}.md`; a.click()
  }

  return (
    <div>
      <div className="page-header">
        <h1>🤖 GPT 持仓分析</h1>
        <p>实时获取 AI 对你的持仓进行专业分析。可保存记录供后续复盘参考。</p>
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Input panel */}
        <div className="card">
          <h3>📝 选择分析类型</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {analysisTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTemplate(t.id); setCustomPrompt('') }}
                style={{
                  textAlign: 'left', padding: '12px 14px', border: `2px solid ${selectedTemplate === t.id ? '#2563eb' : 'var(--border-color)'}`,
                  borderRadius: 10, background: selectedTemplate === t.id ? 'var(--accent-blue-light)' : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'all 0.15s', fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.prompt}</div>
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>自定义分析需求</label>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="或在这里输入你想要分析的任何问题..."
              rows={3}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</> : <><Send size={16} /> 开始分析</>}
          </button>

          {/* 持仓摘要 */}
          <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>当前持仓上下文（将发送给GPT）</div>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.6 }}>
              {buildContext()}
            </pre>
          </div>
        </div>

        {/* Response panel */}
        <div className="card" style={{ minHeight: 500 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>
              {loading ? <>🤔 分析中...</> : response ? <>✅ 分析结果</> : <>💬 等待分析</>}
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {response && (
                <button className="btn btn-primary btn-sm" onClick={handleSave}><Save size={14} /> 保存</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setShowHistory(!showHistory)}>
                <Clock size={14} /> 历史 {history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, color: 'var(--accent-red)', fontSize: 13, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{
            maxHeight: 500, overflowY: 'auto', padding: 16,
            background: '#fafbfd', borderRadius: 8, border: '1px solid var(--border-color)',
            minHeight: 300, lineHeight: 1.8, fontSize: 14,
          }}>
            {response ? (
              <div dangerouslySetInnerHTML={{
                __html: response
                  .replace(/### /g, '<h4>').replace(/## /g, '<h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/^(\d+)\. /gm, '<br/>$1. ')
                  .replace(/\n- /g, '\n• ')
                  .replace(/\|(.+)\|/g, (m) => `<span style="color:var(--text-secondary)">${m}</span>`)
                  .replace(/🔴/g, '<span style="color:#dc2626">🔴</span>')
                  .replace(/🟡/g, '<span style="color:#f59e0b">🟡</span>')
                  .replace(/✅/g, '<span style="color:#16a34a">✅</span>')
              }} />
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 80 }}>
                <Bot size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>选择分析类型，点击「开始分析」</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>
                  {localStorage.getItem('ds_api_key') ? '已配置 DeepSeek API，将获取实时分析' : '未配置 API Key，将使用内置分析模板'}
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* 历史记录 */}
      {showHistory && (
        <div className="card">
          <h3>📚 历史分析记录</h3>
          {history.length === 0 ? (
            <div className="empty-state">
              <Clock size={30} />
              <p>暂无保存的记录</p>
            </div>
          ) : (
            history.map(h => (
              <div key={h.id} style={{
                marginBottom: 12, padding: 16, background: '#f8fafc', borderRadius: 8,
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span className="tag tag-blue">
                      {analysisTemplates.find(t => t.id === h.template)?.label || h.template}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {new Date(h.date).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExport(h)}><Download size={12} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(h.id)}><Trash2 size={12} color="var(--accent-red)" /></button>
                  </div>
                </div>
                <div style={{ fontSize: 13, maxHeight: 200, overflow: 'hidden', position: 'relative', lineHeight: 1.7 }}>
                  <div dangerouslySetInnerHTML={{ __html: h.response.replace(/\n/g, '<br/>').substring(0, 500) + '...' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, #f8fafc)' }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
