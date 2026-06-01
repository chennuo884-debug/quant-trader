import { useState } from 'react'
import { Plus, Trash2, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react'

const defaultBuyRules = [
  { id: 1, name: 'MA均线金叉', desc: '5日均线上穿20日均线', enabled: true, weight: 30, category: '技术指标' },
  { id: 2, name: 'RSI超卖反弹', desc: 'RSI(14) < 30 后回升', enabled: true, weight: 20, category: '技术指标' },
  { id: 3, name: '放量突破', desc: '日成交量 > 1.5倍20日均量 + 价格涨超2%', enabled: true, weight: 15, category: '量价关系' },
  { id: 4, name: '财报超预期', desc: 'EPS/营收超预期 + 指引上调', enabled: false, weight: 20, category: '基本面' },
  { id: 5, name: '分析师上调', desc: '2家以上投行上调目标价', enabled: false, weight: 10, category: '市场情绪' },
  { id: 6, name: '均线支撑买入', desc: '价格回调至20日均线 + 成交量萎缩', enabled: true, weight: 15, category: '技术指标' },
]

const defaultSellRules = [
  { id: 101, name: '固定止盈', desc: '盈利 ≥ 15% 时卖出50%仓位', enabled: true, weight: 25, category: '止盈' },
  { id: 102, name: '移动止损', desc: '从最高点回落 8% 卖出', enabled: true, weight: 30, category: '止损' },
  { id: 103, name: '固定止损', desc: '亏损 ≥ 10% 全部卖出', enabled: true, weight: 25, category: '止损' },
  { id: 104, name: 'MA死叉', desc: '5日均线下穿20日均线', enabled: true, weight: 15, category: '技术指标' },
  { id: 105, name: 'RSI超买', desc: 'RSI(14) > 75 + 成交量萎缩', enabled: false, weight: 10, category: '技术指标' },
  { id: 106, name: '时间止损', desc: '持仓超过30天仍未盈利，减仓50%', enabled: true, weight: 15, category: '时间管理' },
]

const defaultPositionRules = [
  { id: 201, name: '单票最大仓位', desc: '单只股票 ≤ 总资产 40%', value: '40%', enabled: true },
  { id: 202, name: '首次建仓比例', desc: '首次买入 = 计划仓位的 50%', value: '50%', enabled: true },
  { id: 203, name: '现金保留', desc: '始终保留 ≥ 15% 现金', value: '15%', enabled: true },
  { id: 204, name: '加仓条件', desc: '盈利 > 5% 后，回踩支撑可加仓 25%', value: '25%', enabled: true },
  { id: 205, name: '最大持仓数', desc: '同时持有 ≤ 3 只股票', value: '3只', enabled: true },
]

export default function RuleEngine() {
  const [buyRules, setBuyRules] = useState(defaultBuyRules)
  const [sellRules, setSellRules] = useState(defaultSellRules)
  const [positionRules, setPositionRules] = useState(defaultPositionRules)
  const [expandedSection, setExpandedSection] = useState('')

  const toggleRule = (rules, setRules, id) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }
  const deleteRule = (rules, setRules, id) => {
    setRules(rules.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className="page-header">
        <h1>⚙️ 量化规则引擎</h1>
        <p>GPT方案核心：买入、卖出、仓位、风控全部机械化，消除情绪干扰</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">买入规则</div>
          <div className="value blue">{buyRules.filter(r => r.enabled).length}/{buyRules.length}</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>已启用</div>
        </div>
        <div className="stat-card">
          <div className="label">卖出规则</div>
          <div className="value red">{sellRules.filter(r => r.enabled).length}/{sellRules.length}</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>已启用</div>
        </div>
        <div className="stat-card">
          <div className="label">仓位规则</div>
          <div className="value" style={{ color: '#7c3aed' }}>{positionRules.filter(r => r.enabled).length}/{positionRules.length}</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>已启用</div>
        </div>
        <div className="stat-card">
          <div className="label">综合评分阈值</div>
          <div className="value yellow">60</div>
          <div className="change" style={{ color: 'var(--text-secondary)' }}>买入需 ≥ 60分</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <SectionHeader title="🟢 买入规则" count={buyRules.length}
            expanded={expandedSection === 'buy'} onToggle={() => setExpandedSection(expandedSection === 'buy' ? '' : 'buy')} />
          {expandedSection === 'buy' && (
            <>
              {buyRules.map(rule => (
                <RuleItem key={rule.id} rule={rule} showWeight
                  onToggle={() => toggleRule(buyRules, setBuyRules, rule.id)}
                  onDelete={() => deleteRule(buyRules, setBuyRules, rule.id)} />
              ))}
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }}><Plus size={14} /> 新增买入规则</button>
            </>
          )}
        </div>

        <div className="card">
          <SectionHeader title="🔴 卖出规则" count={sellRules.length}
            expanded={expandedSection === 'sell'} onToggle={() => setExpandedSection(expandedSection === 'sell' ? '' : 'sell')} />
          {expandedSection === 'sell' && (
            <>
              {sellRules.map(rule => (
                <RuleItem key={rule.id} rule={rule} showWeight
                  onToggle={() => toggleRule(sellRules, setSellRules, rule.id)}
                  onDelete={() => deleteRule(sellRules, setSellRules, rule.id)} />
              ))}
              <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }}><Plus size={14} /> 新增卖出规则</button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <SectionHeader title="📐 仓位管理规则" count={positionRules.length}
          expanded={expandedSection === 'position'} onToggle={() => setExpandedSection(expandedSection === 'position' ? '' : 'position')} />
        {expandedSection === 'position' && (
          <table className="data-table">
            <thead><tr><th>规则名称</th><th>描述</th><th>参数</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>
              {positionRules.map(rule => (
                <tr key={rule.id}>
                  <td><strong>{rule.name}</strong></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{rule.desc}</td>
                  <td><span className="tag tag-purple">{rule.value}</span></td>
                  <td>
                    <button className={`btn btn-sm ${rule.enabled ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleRule(positionRules, setPositionRules, rule.id)}>
                      {rule.enabled ? <><Play size={12} /> 启用</> : <><Pause size={12} /> 禁用</>}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteRule(positionRules, setPositionRules, rule.id)}>
                      <Trash2 size={12} color="var(--accent-red)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ borderLeft: '3px solid var(--accent-blue)', background: 'var(--accent-blue-light)' }}>
        <h3>💡 GPT 量化框架建议</h3>
        <ol style={{ paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2.2 }}>
          <li><strong>仓位管理 &gt; 买卖时机</strong> — 小资金最重要的是活下来</li>
          <li><strong>止损 &gt; 止盈</strong> — 亏损 10% 必须走，盈利可以分批卖</li>
          <li><strong>规则引擎打分制</strong> — 买入需满足 ≥ 2 个条件，综合评分 ≥ 60 分</li>
          <li><strong>每笔交易前填写检查清单</strong> — 触发规则是什么、仓位多少、止损设在哪</li>
          <li><strong>每周复盘</strong> — 检查每笔交易是否符合规则，统计规则执行率</li>
        </ol>
      </div>
    </div>
  )
}

function SectionHeader({ title, count, expanded, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={onToggle}>
      <h3 style={{ margin: 0 }}>{title} <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>({count}条)</span></h3>
      {expanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
    </div>
  )
}

function RuleItem({ rule, onToggle, onDelete, showWeight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-color)', opacity: rule.enabled ? 1 : 0.5 }}>
      <button className={`btn btn-sm ${rule.enabled ? 'btn-primary' : 'btn-outline'}`}
        onClick={onToggle} style={{ minWidth: 54 }}>
        {rule.enabled ? 'ON' : 'OFF'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{rule.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rule.desc}</div>
      </div>
      {showWeight && (
        <span className="tag tag-blue" style={{ minWidth: 60, textAlign: 'center' }}>权重: {rule.weight}分</span>
      )}
      <span className="tag" style={{ background: '#f1f5f9', color: 'var(--text-secondary)' }}>{rule.category}</span>
      <button className="btn btn-ghost btn-sm" onClick={onDelete}><Trash2 size={12} color="var(--accent-red)" /></button>
    </div>
  )
}
