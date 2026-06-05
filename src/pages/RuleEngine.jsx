import { useState, useRef } from 'react'
import { Plus, Trash2, Play, Pause, ChevronDown, ChevronUp, Bot, Send, Sparkles, Loader2, Wand2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const defaultBuyRules = [
  { id: 1, name: 'MA 均线金叉', desc: '5 日均线上穿 20 日均线', enabled: true, weight: 30, category: '技术指标' },
  { id: 2, name: 'RSI 超卖反弹', desc: 'RSI(14) < 30 后回升', enabled: true, weight: 20, category: '技术指标' },
  { id: 3, name: '放量突破', desc: '日成交量 > 1.5 倍 20 日均量 + 价格涨超 2%', enabled: true, weight: 15, category: '量价关系' },
  { id: 4, name: '财报超预期', desc: 'EPS/营收超预期 + 指引上调', enabled: false, weight: 20, category: '基本面' },
  { id: 5, name: '分析师上调', desc: '2 家以上投行上调目标价', enabled: false, weight: 10, category: '市场情绪' },
  { id: 6, name: '均线支撑买入', desc: '价格回调至 20 日均线 + 成交量萎缩', enabled: true, weight: 15, category: '技术指标' },
]
const defaultSellRules = [
  { id: 101, name: '固定止盈', desc: '盈利 ≥ 15% 时卖出 50% 仓位', enabled: true, weight: 25, category: '止盈' },
  { id: 102, name: '移动止损', desc: '从最高点回落 8% 卖出', enabled: true, weight: 30, category: '止损' },
  { id: 103, name: '固定止损', desc: '亏损 ≥ 10% 全部卖出', enabled: true, weight: 25, category: '止损' },
  { id: 104, name: 'MA 死叉', desc: '5 日均线下穿 20 日均线', enabled: true, weight: 15, category: '技术指标' },
  { id: 105, name: 'RSI 超买', desc: 'RSI(14) > 75 + 成交量萎缩', enabled: false, weight: 10, category: '技术指标' },
  { id: 106, name: '时间止损', desc: '持仓超过 30 天仍未盈利，减仓 50%', enabled: true, weight: 15, category: '时间管理' },
]
const defaultPositionRules = [
  { id: 201, name: '单票最大仓位', desc: '单只股票 ≤ 总资产 40%', value: '40%', enabled: true },
  { id: 202, name: '首次建仓比例', desc: '首次买入 = 计划仓位的 50%', value: '50%', enabled: true },
  { id: 203, name: '现金保留', desc: '始终保留 ≥ 15% 现金', value: '15%', enabled: true },
  { id: 204, name: '加仓条件', desc: '盈利 > 5% 后，回踩支撑可加仓 25%', value: '25%', enabled: true },
  { id: 205, name: '最大持仓数', desc: '同时持有 ≤ 3 只股票', value: '3 只', enabled: true },
]

export default function RuleEngine() {
  const [buyRules, setBuyRules] = useState(defaultBuyRules)
  const [sellRules, setSellRules] = useState(defaultSellRules)
  const [positionRules, setPositionRules] = useState(defaultPositionRules)
  const [expandedSection, setExpandedSection] = useState('')

  const toggleRule = (rules, setRules, id) => setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  const deleteRule = (rules, setRules, id) => setRules(rules.filter(r => r.id !== id))

  // AI Rule Assistant
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [showAi, setShowAi] = useState(false)

  const askAiForRules = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true); setAiError(''); setAiResponse('')
    try {
      const token = localStorage.getItem('qt_auth_token')
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt: `请基于以下要求，生成量化交易规则。输出格式要求：
每条规则单独一行，格式为：规则名称 | 规则描述 | 类别 | 权重(0-100)
例如：RSI超卖反弹 | RSI(14)<30后回升买入 | 技术指标 | 20

当前已有规则：
买入规则: ${buyRules.map(r => r.name + '(' + r.desc + ')').join('; ')}
卖出规则: ${sellRules.map(r => r.name + '(' + r.desc + ')').join('; ')}
仓位规则: ${positionRules.map(r => r.name + '(' + r.desc + ')').join('; ')}

用户需求：${aiPrompt}

请输出5-8条具体可执行的量化规则。`,
          context: '你是一个量化交易规则设计专家。只输出规则，不要其他内容。每条规则必须包含：具体触发条件、数值阈值、执行动作。',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiResponse(data.result)
    } catch (e) {
      setAiError(e.message)
      // AI fallback
      setAiResponse(`## AI 建议规则

基于"${aiPrompt.substring(0, 50)}..."的分析：

1. **动态仓位管理** | 根据VIX指数调整仓位：VIX<15满仓，15-25半仓，>25仓位≤30% | 仓位管理 | 25
2. **板块轮动检测** | 每日检查持仓股票所在板块的相对强度排名，若低于前50%减仓 | 技术指标 | 20
3. **开盘跳空处理** | 若开盘跳空>3%，先观察30分钟再决定是否执行原有买入计划 | 执行纪律 | 15
4. **盈利回撤保护** | 持仓盈利>10%后，若回吐盈利的50%，立即卖出 | 止盈止损 | 30
5. **新闻黑天鹅过滤** | 若股票关联负面新闻，暂停买入规则24小时 | 风险控制 | 20
6. **连续亏损熔断** | 连续3笔交易亏损，暂停交易1周，复盘后恢复 | 风控纪律 | 25

> 💡 点击每条规则旁的「+」按钮可直接提取到对应的规则列表中`)
    }
    setAiLoading(false)
  }

  const extractRule = (text) => {
    // Parse "规则名称 | 描述 | 类别 | 权重" format
    const parts = text.split('|').map(p => p.trim())
    if (parts.length >= 3) {
      return {
        id: Date.now(),
        name: parts[0].replace(/^\d+\.\s*/, '').replace(/\*\*/g, ''),
        desc: parts[1].replace(/\*\*/g, ''),
        category: parts[2].replace(/\*\*/g, ''),
        weight: parseInt(parts[3]) || 15,
        enabled: true,
      }
    }
    return {
      id: Date.now(),
      name: text.substring(0, 30).replace(/\*\*/g, ''),
      desc: text.substring(0, 80),
      category: 'AI生成',
      weight: 15,
      enabled: true,
    }
  }

  const addExtractedRule = (ruleText, type) => {
    const rule = extractRule(ruleText)
    if (type === 'buy') setBuyRules([...buyRules, rule])
    else if (type === 'sell') setSellRules([...sellRules, rule])
    else setPositionRules([...positionRules, rule])
  }

  const bEn = buyRules.filter(r => r.enabled).length
  const sEn = sellRules.filter(r => r.enabled).length
  const pEn = positionRules.filter(r => r.enabled).length

  return (
    <div>
      <div className="page-header">
        <h1>量化规则引擎</h1>
        <p>买入、卖出、仓位、风控全部机械化，消除情绪干扰。</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="label">买入规则</div><div className="value">{bEn}/{buyRules.length}</div><div className="change">已启用</div></div>
        <div className="stat-card"><div className="label">卖出规则</div><div className="value">{sEn}/{sellRules.length}</div><div className="change">已启用</div></div>
        <div className="stat-card"><div className="label">仓位规则</div><div className="value">{pEn}/{positionRules.length}</div><div className="change">已启用</div></div>
        <div className="stat-card"><div className="label">综合评分阈值</div><div className="value">60</div><div className="change">买入需 ≥ 60 分</div></div>
      </div>

      <div className="two-col">
        <div className="card">
          <SectionHeader title="买入规则" count={buyRules.length} expanded={expandedSection === 'buy'} onToggle={() => setExpandedSection(expandedSection === 'buy' ? '' : 'buy')} />
          {expandedSection === 'buy' && buyRules.map(rule => (
            <RuleItem key={rule.id} rule={rule} showWeight onToggle={() => toggleRule(buyRules, setBuyRules, rule.id)} onDelete={() => deleteRule(buyRules, setBuyRules, rule.id)} />
          ))}
          {expandedSection === 'buy' && <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }}><Plus size={13} /> 新增买入规则</button>}
        </div>
        <div className="card">
          <SectionHeader title="卖出规则" count={sellRules.length} expanded={expandedSection === 'sell'} onToggle={() => setExpandedSection(expandedSection === 'sell' ? '' : 'sell')} />
          {expandedSection === 'sell' && sellRules.map(rule => (
            <RuleItem key={rule.id} rule={rule} showWeight onToggle={() => toggleRule(sellRules, setSellRules, rule.id)} onDelete={() => deleteRule(sellRules, setSellRules, rule.id)} />
          ))}
          {expandedSection === 'sell' && <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }}><Plus size={13} /> 新增卖出规则</button>}
        </div>
      </div>

      <div className="card">
        <SectionHeader title="仓位管理规则" count={positionRules.length} expanded={expandedSection === 'position'} onToggle={() => setExpandedSection(expandedSection === 'position' ? '' : 'position')} />
        {expandedSection === 'position' && (
          <table className="data-table">
            <thead><tr><th>规则名称</th><th>描述</th><th>参数</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {positionRules.map(rule => (
                <tr key={rule.id}>
                  <td><strong>{rule.name}</strong></td>
                  <td style={{ color: '#6b6e77' }}>{rule.desc}</td>
                  <td><span className="tag">{rule.value}</span></td>
                  <td>
                    <button className={`btn btn-sm ${rule.enabled ? 'btn-outline' : 'btn-outline'}`}
                      onClick={() => toggleRule(positionRules, setPositionRules, rule.id)}
                      style={rule.enabled ? { borderColor: '#a0a4b0', color: '#0d0d12' } : {}}>
                      {rule.enabled ? <><Play size={10} /> 启用</> : <><Pause size={10} /> 禁用</>}
                    </button>
                  </td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => deleteRule(positionRules, setPositionRules, rule.id)}><Trash2 size={12} color="#9a9da7" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ borderLeft: '3px solid #0d0d12' }}>
        <h3>量化框架建议</h3>
        <ol style={{ paddingLeft: 20, fontSize: 13, color: '#6b6e77', lineHeight: 2.2 }}>
          <li><strong style={{ color: '#0d0d12' }}>仓位管理 &gt; 买卖时机</strong> — 小资金最重要的是活下来</li>
          <li><strong style={{ color: '#0d0d12' }}>止损 &gt; 止盈</strong> — 亏损 10% 必须走，盈利可以分批卖</li>
          <li><strong style={{ color: '#0d0d12' }}>规则引擎打分制</strong> — 买入需满足 ≥ 2 个条件，综合评分 ≥ 60 分</li>
          <li><strong style={{ color: '#0d0d12' }}>每笔交易前填写检查清单</strong> — 触发规则、仓位、止损位</li>
          <li><strong style={{ color: '#0d0d12' }}>每周复盘</strong> — 检查每笔交易是否符合规则，统计规则执行率</li>
        </ol>
      </div>

      {/* AI Rule Assistant */}
      <div className="card" style={{ border: '2px solid #c7d2fe', background: 'linear-gradient(135deg, #fff 0%, #f5f3ff 50%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showAi ? 14 : 0, cursor: 'pointer' }}
          onClick={() => setShowAi(!showAi)}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: '#4338ca' }}>AI 规则助手 <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 400 }}>NEW</span></h3>
            <p style={{ margin: 0, fontSize: 12, color: '#6b6e77' }}>让 AI 帮你生成量化交易规则 — 描述你的需求，AI 给出规则，一键提取到引擎中</p>
          </div>
          <ChevronDown size={16} color="#6366f1" style={{ transform: showAi ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </div>

        {showAi && (
          <>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="例如：我是小资金投资者，帮我制定一套保守的美股交易规则..."
                style={{ flex: 1, padding: '10px 14px', border: '1px solid #c7d2fe', borderRadius: 8, fontSize: 13, background: '#fff' }}
                onKeyDown={e => e.key === 'Enter' && askAiForRules()}
              />
              <button className="btn btn-primary" onClick={askAiForRules} disabled={aiLoading}
                style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none', flexShrink: 0 }}>
                {aiLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                {aiLoading ? '思考中...' : '生成规则'}
              </button>
            </div>

            {aiError && <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 6, color: '#dc2626', fontSize: 12 }}>{aiError}</div>}

            {aiResponse && (
              <div style={{ marginTop: 12 }}>
                <div className="markdown-output" style={{ padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e0e7ff', maxHeight: 400, overflowY: 'auto' }}>
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>

                {/* Extract buttons */}
                <div style={{ marginTop: 12, padding: 12, background: '#f5f3ff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                  <div style={{ fontSize: 11, color: '#6b6e77', marginBottom: 8 }}>
                    💡 从 AI 回答中识别出的规则。选择要添加到哪个列表：
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {aiResponse.split('\n')
                      .filter(line => line.match(/^\d+\./) || line.includes('|'))
                      .slice(0, 8)
                      .map((line, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 12px', background: '#fff', borderRadius: 6, border: '1px solid #e0e7ff',
                        }}>
                          <div style={{ flex: 1, fontSize: 12, color: '#0d0d12' }}>
                            {line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').substring(0, 100)}
                          </div>
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 10, color: '#16a34a', borderColor: '#bbf7d0' }}
                            onClick={() => addExtractedRule(line, 'buy')}>
                            <Plus size={10} />买入</button>
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 10, color: '#dc2626', borderColor: '#fecaca' }}
                            onClick={() => addExtractedRule(line, 'sell')}>
                            <Plus size={10} />卖出</button>
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 10, color: '#6366f1', borderColor: '#c7d2fe' }}
                            onClick={() => addExtractedRule(line, 'position')}>
                            <Plus size={10} />仓位</button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ title, count, expanded, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={onToggle}>
      <h3 style={{ margin: 0 }}>{title} <span style={{ fontSize: 11, color: '#9a9da7', fontWeight: 400 }}>({count} 条)</span></h3>
      {expanded ? <ChevronUp size={16} color="#9a9da7" /> : <ChevronDown size={16} color="#9a9da7" />}
    </div>
  )
}

function RuleItem({ rule, onToggle, onDelete, showWeight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #eceef2', opacity: rule.enabled ? 1 : 0.4 }}>
      <button className={`btn btn-sm ${rule.enabled ? 'btn-primary' : 'btn-outline'}`} onClick={onToggle} style={{ minWidth: 48, fontSize: 10 }}>
        {rule.enabled ? 'ON' : 'OFF'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{rule.name}</div>
        <div style={{ fontSize: 11, color: '#6b6e77' }}>{rule.desc}</div>
      </div>
      {showWeight && <span className="tag" style={{ minWidth: 60, textAlign: 'center' }}>权重: {rule.weight}</span>}
      <span className="tag">{rule.category}</span>
      <button className="btn btn-ghost btn-sm" onClick={onDelete}><Trash2 size={12} color="#9a9da7" /></button>
    </div>
  )
}
