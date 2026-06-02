import { useState, useRef, useEffect } from 'react'
import { Send, Save, Trash2, Download, Loader2, Bot, Clock } from 'lucide-react'

function loadHistory() { try { return JSON.parse(localStorage.getItem('qt_gpt_history') || '[]') } catch { return [] } }
function saveHistory(data) { localStorage.setItem('qt_gpt_history', JSON.stringify(data)) }

const templates = [
  { id: 'portfolio', label: '持仓综合分析', prompt: '分析我的投资组合，评估风险收益比、行业集中度、仓位合理性。' },
  { id: 'buy', label: '买入建议', prompt: '基于我的持仓和现金，哪些买入操作合理？哪些应该等待？' },
  { id: 'sell', label: '卖出/止损建议', prompt: '检查持仓，哪些该止盈？哪些该止损？哪些触发卖出规则？' },
  { id: 'risk', label: '风险评估', prompt: '评估当前组合风险：回撤、集中、流动性。给出风控建议。' },
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

  const positions = (() => { try { return JSON.parse(localStorage.getItem('qt_positions') || '[]') } catch { return [] } })()

  const buildContext = () => {
    let ctx = '当前持仓：\n'
    if (!positions.length) ctx += '（无持仓数据）\n'
    else positions.forEach(p => {
      const mkt = (p.currentPrice || p.avgCost) * p.shares
      const pnl = ((p.currentPrice || p.avgCost) - p.avgCost) * p.shares
      ctx += `- ${p.stock}${p.ticker ? `(${p.ticker})` : ''}: ${p.shares}股, 成本$${p.avgCost.toFixed(2)}, 现价$${(p.currentPrice || p.avgCost).toFixed(2)}, 市值$${mkt.toFixed(2)}, 盈亏$${pnl.toFixed(2)}\n`
    })
    ctx += '\n现金: $108.20 | 总资产约: $612\n规则: 买入≥60分, 单票≤40%, 现金≥15%, 止损-10%, 止盈+15%, 移动止损-8%'
    return ctx
  }

  const handleSubmit = async () => {
    const prompt = customPrompt || templates.find(t => t.id === selectedTemplate)?.prompt || ''
    if (!prompt) return
    setLoading(true); setError(''); setResponse('')
    try {
      const apiKey = localStorage.getItem('ds_api_key') || ''
      const baseUrl = localStorage.getItem('ds_base_url') || 'https://api.deepseek.com'
      if (!apiKey) { await simulateAnalysis() } else {
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: [
            { role: 'system', content: '你是专业量化投资顾问，擅长美股分析。用中文回答，具体可操作。' },
            { role: 'user', content: `${buildContext()}\n\n${prompt}` },
          ], temperature: 0.7, max_tokens: 2000 }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message)
        setResponse(data.choices[0].message.content)
      }
    } catch (err) { setError(err.message); await simulateAnalysis() }
    setLoading(false)
  }

  const simulateAnalysis = async () => {
    const texts = {
      portfolio: `## 持仓综合分析\n\n**总资产**: 约 $612 | **持仓市值**: ~$504 | **现金**: $108.20 (17.7%)\n\n### 风险\n- NVDA + MU 同属 AI/半导体，集中度约 83% 远超 60%\n- NVDA 单票 48.6% 超过 40% 上限\n- 现金勉强合格\n\n### 建议\n1. 不要继续加仓 AI 板块\n2. 考虑 ETF 降低个股风险\n3. 严格止损`,
      buy: `## 买入建议\n\n**现金**: $108.20 | **可新开**: 1 只\n\n不建议现在买入：现金太少，买错代价大。等 SNDK 回调到 $1,650 附近。`,
      sell: `## 卖出建议\n\n**NVDA**: 浮盈 +$3.40，设移动止损 -8% → $136.62\n**MU**: 浮盈 +$7.10 (8.3%)，接近 15% 止盈线，设止盈 $98 卖 50%\n**SNDK**: 已错过，教训：规则触发就执行`,
      risk: `## 风险评估\n\n**VaR (95%)**: $18.40 | **最大回撤**: 15% ($92)\n**Beta**: ~1.4\n\n### 压力测试\nAI 回调 20% → 亏 ~$100 → 资产 $612→$512 → 回撤 16.3% 触发警报`,
    }
    const text = texts[selectedTemplate] || '无法生成分析。'
    for (let i = 0; i < text.length; i += 4) {
      setResponse(prev => prev + text.slice(i, i + 4))
      await new Promise(r => setTimeout(r, 12))
    }
  }

  const handleSave = () => {
    if (!response) return
    const r = { id: Date.now(), template: selectedTemplate, prompt: customPrompt || templates.find(t => t.id === selectedTemplate)?.prompt || '', response, date: new Date().toISOString() }
    const u = [r, ...history]; setHistory(u); saveHistory(u)
  }

  const handleDelete = (id) => { const u = history.filter(h => h.id !== id); setHistory(u); saveHistory(u) }
  const handleExport = (r) => {
    const t = `# GPT 分析\n\n${new Date(r.date).toLocaleString()}\n\n${r.response}`
    const b = new Blob([t], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `analysis-${r.id}.md`; a.click()
  }

  return (
    <div>
      <div className="page-header">
        <h1>GPT 持仓分析</h1>
        <p>获取 AI 对你的持仓进行分析。可保存记录供后续复盘。</p>
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <h3>选择分析类型</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {templates.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setCustomPrompt('') }}
                style={{ textAlign: 'left', padding: '10px 13px', border: `1px solid ${selectedTemplate === t.id ? '#a0a4b0' : '#e4e6ea'}`,
                  borderRadius: 8, background: selectedTemplate === t.id ? '#fafbfc' : '#fff', cursor: 'pointer', fontSize: 13,
                  color: selectedTemplate === t.id ? '#0d0d12' : '#6b6e77', fontWeight: selectedTemplate === t.id ? 500 : 400 }}>
                <div>{t.label}</div><div style={{ fontSize: 11, color: '#9a9da7' }}>{t.prompt}</div>
              </button>
            ))}
          </div>
          <div className="form-group"><label>自定义需求</label><textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="输入你想要分析的问题..." rows={3} /></div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: '100%' }}>
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 分析中...</> : <><Send size={14} /> 开始分析</>}
          </button>
          <div style={{ marginTop: 14, padding: 12, background: '#fafbfc', borderRadius: 8, fontSize: 11 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>当前持仓上下文</div>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#6b6e77', fontSize: 10, lineHeight: 1.5 }}>{buildContext()}</pre>
          </div>
        </div>

        <div className="card" style={{ minHeight: 420 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>{loading ? '分析中...' : response ? '分析结果' : '等待分析'}</h3>
            <div style={{ display: 'flex', gap: 4 }}>
              {response && <button className="btn btn-primary btn-sm" onClick={handleSave}><Save size={12} /> 保存</button>}
              <button className="btn btn-outline btn-sm" onClick={() => setShowHistory(!showHistory)}><Clock size={12} /> 历史{history.length > 0 && `(${history.length})`}</button>
            </div>
          </div>
          {error && <div style={{ padding: 10, background: '#fef2f2', borderRadius: 6, color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ maxHeight: 400, overflowY: 'auto', padding: 16, background: '#fafbfc', borderRadius: 8, border: '1px solid #eceef2', minHeight: 240, lineHeight: 1.8, fontSize: 13 }}>
            {response ? (
              <div dangerouslySetInnerHTML={{ __html: response.replace(/### /g, '<h4 style="color:#0d0d12;margin-top:14px">').replace(/## /g, '<h3 style="color:#0d0d12;margin-top:14px">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n- /g, '\n• ') }} />
            ) : (
              <div style={{ color: '#9a9da7', textAlign: 'center', paddingTop: 60 }}>
                <Bot size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
                <p>选择分析类型，点击「开始分析」</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>{localStorage.getItem('ds_api_key') ? '已配置 API，获取实时分析' : '未配置 API Key，使用内置模板'}</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="card">
          <h3>历史分析记录</h3>
          {history.length === 0 ? <div className="empty-state"><Clock size={28} /><p>暂无记录</p></div> : history.map(h => (
            <div key={h.id} style={{ marginBottom: 10, padding: 14, background: '#fafbfc', borderRadius: 8, border: '1px solid #eceef2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div><span className="tag">{templates.find(t => t.id === h.template)?.label || h.template}</span><span style={{ fontSize: 11, color: '#9a9da7', marginLeft: 8 }}>{new Date(h.date).toLocaleString()}</span></div>
                <div style={{ display: 'flex', gap: 2 }}><button className="btn btn-outline btn-sm" onClick={() => handleExport(h)}><Download size={11} /></button><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(h.id)}><Trash2 size={11} color="#9a9da7" /></button></div>
              </div>
              <div style={{ fontSize: 12, color: '#6b6e77', maxHeight: 140, overflow: 'hidden' }}>{h.response.substring(0, 350)}...</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
