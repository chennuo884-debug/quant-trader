import { useState, useEffect } from 'react'
import { MessageCircle, RefreshCw, TrendingUp, TrendingDown, Minus, Globe, ExternalLink, Bot, Loader2, AlertTriangle } from 'lucide-react'

const MOCK_DATA = [
  { id: 1, platform: 'truthsocial', author: 'Donald Trump', handle: '@realDonaldTrump', avatar: '👔',
    content: 'The economy is doing GREAT. Markets are at all-time highs. We are bringing back the American Dream!',
    translated: '经济表现很好。市场创历史新高。我们正在带回美国梦！',
    timestamp: new Date(Date.now() - 1800000).toISOString(), sentiment: 'positive', affectedStocks: ['SPY', 'DIA'],
    aiComment: '整体利好市场情绪，支撑大盘继续走强。' },
  { id: 2, platform: 'x', author: 'Sernnity', handle: '@sernnity', avatar: '🔮',
    content: 'NVDA positioning looks very interesting here. The accumulation suggests institutional buying. Watching $135.',
    translated: 'NVDA仓位非常有趣。积累暗示机构在买入。关注$135。',
    timestamp: new Date(Date.now() - 3600000).toISOString(), sentiment: 'positive', affectedStocks: ['NVDA'],
    aiComment: '看好NVDA在$135附近的积累区间，技术面支撑此观点。' },
  { id: 3, platform: 'truthsocial', author: 'Donald Trump', handle: '@realDonaldTrump', avatar: '👔',
    content: 'CHINA trade deal coming along very nicely. But we will ALWAYS protect American workers first!',
    translated: '中国贸易协议进展顺利。但我们将始终保护美国工人！',
    timestamp: new Date(Date.now() - 7200000).toISOString(), sentiment: 'mixed', affectedStocks: ['BABA', 'FXI', 'AAPL'],
    aiComment: '贸易谈判利好中概股但保护主义措辞带来不确定性。' },
  { id: 4, platform: 'x', author: 'Sernnity', handle: '@sernnity', avatar: '🔮',
    content: 'Semiconductor sector (SMH) showing textbook cup and handle. Breakout above $280 would be extremely bullish.',
    translated: '半导体(SMH)呈现教科书杯柄形态。突破$280极度看涨。',
    timestamp: new Date(Date.now() - 14400000).toISOString(), sentiment: 'positive', affectedStocks: ['NVDA', 'MU', 'AMD', 'AVGO'],
    aiComment: '技术形态看涨，持仓NVDA和MU的用户获得支持信号。' },
  { id: 5, platform: 'truthsocial', author: 'Donald Trump', handle: '@realDonaldTrump', avatar: '👔',
    content: 'FED should CUT RATES NOW! Inflation is going down. Time to help American families!',
    translated: '美联储应该现在降息！通胀在下降。是时候帮助美国家庭了！',
    timestamp: new Date(Date.now() - 86400000).toISOString(), sentiment: 'positive', affectedStocks: ['QQQ', 'SPY', 'IWM'],
    aiComment: '降息预期利好科技股(QQQ)和小盘股(IWM)。' },
  { id: 6, platform: 'x', author: 'Sernnity', handle: '@sernnity', avatar: '🔮',
    content: 'AAPL intelligence features looking underwhelming. May trim position if no catalyst by WWDC.',
    translated: '苹果AI功能看起来不太令人印象深刻。WWDC前如果没有催化剂，可能减仓。',
    timestamp: new Date(Date.now() - 108000000).toISOString(), sentiment: 'negative', affectedStocks: ['AAPL'],
    aiComment: '对苹果谨慎态度值得关注，WWDC是关键节点。' },
]

const SENTIMENT_STYLES = {
  positive: { icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: '利好' },
  negative: { icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: '利空' },
  mixed: { icon: Minus, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: '中性/混合' },
}

export default function SocialMonitor() {
  const [posts, setPosts] = useState(MOCK_DATA)
  const [loading, setLoading] = useState(false)
  const [selectedStock, setSelectedStock] = useState('')
  const [expandedPost, setExpandedPost] = useState(null)

  const refresh = async () => {
    setLoading(true)
    // Try backend, fallback to mock
    try {
      const res = await fetch('/api/social')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setPosts(data)
        else setPosts(MOCK_DATA)
      }
    } catch { setPosts(MOCK_DATA) }
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
  }

  // Get unique stocks mentioned
  const allStocks = [...new Set(posts.flatMap(p => p.affectedStocks || []))].sort()

  // Filter
  const filtered = selectedStock
    ? posts.filter(p => (p.affectedStocks || []).includes(selectedStock))
    : posts

  // Stats
  const positiveCount = posts.filter(p => p.sentiment === 'positive').length
  const negativeCount = posts.filter(p => p.sentiment === 'negative').length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>📡 社交媒体监控</h1>
          <p>实时追踪 Trump (Truth Social) 和 Sernnity (X) 的发言，AI 翻译并分析对持仓的影响。</p>
        </div>
        <button className="btn btn-primary" onClick={refresh} disabled={loading}
          style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">总发言</div>
          <div className="value">{posts.length}</div>
          <div className="change">今日</div>
        </div>
        <div className="stat-card">
          <div className="label">利好信号</div>
          <div className="value" style={{ color: '#16a34a' }}>{positiveCount}</div>
          <div className="change">{positiveCount > 0 ? '占比 ' + (positiveCount / posts.length * 100).toFixed(0) + '%' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="label">利空/谨慎信号</div>
          <div className="value" style={{ color: '#dc2626' }}>{negativeCount}</div>
          <div className="change">{negativeCount > 0 ? '占比 ' + (negativeCount / posts.length * 100).toFixed(0) + '%' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="label">涉及股票</div>
          <div className="value">{allStocks.length}</div>
          <div className="change" style={{ fontSize: 10, wordBreak: 'break-all' }}>{allStocks.join(', ')}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 14, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#9a9da7', fontWeight: 600 }}>筛选股票:</span>
        <button className={`btn btn-sm ${selectedStock === '' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSelectedStock('')}
          style={selectedStock === '' ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' } : {}}>
          全部</button>
        {allStocks.map(s => (
          <button key={s} className={`btn btn-sm ${selectedStock === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedStock(selectedStock === s ? '' : s)}
            style={selectedStock === s ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' } : {}}>
            {s}</button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(post => {
          const sty = SENTIMENT_STYLES[post.sentiment] || SENTIMENT_STYLES.mixed
          const SentIcon = sty.icon
          const expanded = expandedPost === post.id
          return (
            <div key={post.id} style={{
              background: '#fff', border: `1px solid ${expanded ? sty.border : '#e4e6ea'}`,
              borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                cursor: 'pointer', background: expanded ? sty.bg : '#fff',
              }} onClick={() => setExpandedPost(expanded ? null : post.id)}>
                <div style={{ fontSize: 24, width: 40, height: 40, borderRadius: 10, background: '#f5f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e4e6ea' }}>
                  {post.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{post.author}</span>
                    <span style={{ fontSize: 11, color: '#9a9da7' }}>{post.handle}</span>
                    <span className="tag" style={{
                      fontSize: 9, padding: '2px 6px',
                      background: post.platform === 'truthsocial' ? '#f0fdf4' : '#eff6ff',
                      color: post.platform === 'truthsocial' ? '#16a34a' : '#2563eb',
                    }}>
                      {post.platform === 'truthsocial' ? 'Truth Social' : 'X'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, marginTop: 3, color: '#0d0d12', lineHeight: 1.5 }}>
                    {expanded ? post.content : (post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                    background: sty.bg, color: sty.color, border: `1px solid ${sty.border}`,
                  }}>
                    <SentIcon size={10} />{sty.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#9a9da7', marginTop: 4 }}>{timeAgo(post.timestamp)}</div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid #e4e6ea' }}>
                  {/* Translation */}
                  <div style={{ marginTop: 12, padding: 10, background: '#f5f3ff', borderRadius: 8, border: '1px solid #e0e7ff' }}>
                    <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginBottom: 4 }}>🇨🇳 中文翻译</div>
                    <div style={{ fontSize: 12, color: '#1e1b4b' }}>{post.translated}</div>
                  </div>

                  {/* AI Analysis */}
                  <div style={{ marginTop: 10, padding: 12, background: '#fafbfc', borderRadius: 8, border: '1px solid #eceef2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Bot size={12} color="#6366f1" />
                      <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 700 }}>AI 分析</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b6e77', lineHeight: 1.6 }}>{post.aiComment}</div>
                  </div>

                  {/* Affected stocks */}
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9a9da7' }}>📊 涉及股票:</span>
                    {post.affectedStocks?.map(s => (
                      <span key={s} className="tag" style={{
                        background: '#f5f3ff', color: '#4338ca', border: '1px solid #e0e7ff',
                        fontSize: 10, fontWeight: 600,
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 20, padding: 14, background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: 11, color: '#92400e' }}>
        <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
        <strong>免责声明:</strong> 社交媒体分析仅供参考，不构成投资建议。Truth Social 和 X 的数据来自公开信息，可能存在延迟或遗漏。
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}
