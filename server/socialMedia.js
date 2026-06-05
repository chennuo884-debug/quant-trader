/**
 * Social media monitoring for Trump (Truth Social) + Sernnity (X).
 *
 * NOTE: Real scraping of Truth Social and X requires:
 * 1. Truth Social: unofficial API, may break
 * 2. X/Twitter: requires paid API access (Basic tier ~$100/mo)
 *
 * This module provides a simulated feed for demo purposes.
 * Replace fetchSocialPosts() with real API calls in production.
 */

const DEMO_POSTS = [
  {
    id: 1,
    platform: 'truthsocial',
    author: 'Donald Trump',
    handle: '@realDonaldTrump',
    avatar: '👔',
    content: 'The economy is doing GREAT. Markets are at all-time highs. We are bringing back the American Dream! Made America Wealthy Again!',
    translated: '经济表现很好，市场创历史新高。我们正在带回美国梦。让美国再次富裕！',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    sentiment: 'positive',
    affectedStocks: ['SPY', 'DIA'],
    aiComment: '整体利好市场情绪，支撑大盘继续走强。',
  },
  {
    id: 2,
    platform: 'x',
    author: 'Sernnity',
    handle: '@sernnity',
    avatar: '🔮',
    content: 'NVDA positioning looks very interesting here. The accumulation at these levels suggests institutional buying. Watching $135 closely.',
    translated: 'NVDA仓位看起来非常有趣，这个位置的积累暗示机构在买入。密切关注$135。',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    sentiment: 'positive',
    affectedStocks: ['NVDA'],
    aiComment: 'Sernnity 看好 NVDA 在 $135 附近的积累区间，技术面支撑此观点。',
  },
  {
    id: 3,
    platform: 'truthsocial',
    author: 'Donald Trump',
    handle: '@realDonaldTrump',
    avatar: '👔',
    content: 'CHINA trade deal coming along very nicely. Big progress being made. But we will ALWAYS protect American workers first!',
    translated: '中国贸易协议进展非常顺利。取得了重大进展。但我们将始终首先保护美国工人！',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    sentiment: 'mixed',
    affectedStocks: ['BABA', 'FXI', 'AAPL'],
    aiComment: '贸易谈判利好中概股但保护主义措辞带来不确定性，对苹果等供应链在华公司存在两面性。',
  },
  {
    id: 4,
    platform: 'x',
    author: 'Sernnity',
    handle: '@sernnity',
    avatar: '🔮',
    content: 'Semiconductor sector (SMH) showing a textbook cup and handle pattern. Breakout above $280 would be extremely bullish. Adding to watchlist.',
    translated: '半导体板块(SMH)呈现教科书式的杯柄形态。突破$280将极度看涨。加入观察列表。',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    sentiment: 'positive',
    affectedStocks: ['NVDA', 'MU', 'AMD', 'AVGO'],
    aiComment: '半导体板块技术形态看涨，如果你持仓 NVDA 和 MU，这是一个支持信号。',
  },
  {
    id: 5,
    platform: 'truthsocial',
    author: 'Donald Trump',
    handle: '@realDonaldTrump',
    avatar: '👔',
    content: 'FED should CUT RATES NOW! Inflation is going down. Time to help American families with lower mortgage rates!',
    translated: '美联储应该现在降息！通胀在下降。是时候用更低的抵押贷款利率帮助美国家庭了！',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    sentiment: 'positive',
    affectedStocks: ['QQQ', 'SPY', 'IWM'],
    aiComment: '降息预期利好整体股市尤其是科技股(QQQ)和小盘股(IWM)，但对银行股利好有限。',
  },
  {
    id: 6,
    platform: 'x',
    author: 'Sernnity',
    handle: '@sernnity',
    avatar: '🔮',
    content: 'AAPL intelligence features looking underwhelming. Competition from open-source models is real. May trim position if no catalyst by WWDC.',
    translated: '苹果AI功能看起来不太令人印象深刻。来自开源模型的竞争是真实的。如果 WWDC 前没有催化剂，可能减仓。',
    timestamp: new Date(Date.now() - 108000000).toISOString(),
    sentiment: 'negative',
    affectedStocks: ['AAPL'],
    aiComment: '对苹果的谨慎态度值得关注，WWDC 是关键事件节点。',
  },
]

/**
 * Fetch latest social media posts
 * In production, replace with real API calls to Truth Social RSS and X API v2
 */
export async function fetchSocialPosts() {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 300))

  // Randomize order slightly for realism
  const shuffled = [...DEMO_POSTS].sort(() => Math.random() - 0.3)

  return shuffled.map(p => ({
    ...p,
    // Update relative timestamps on each fetch
    timestamp: p.timestamp,
  }))
}

/**
 * Real implementation template for future use:
 *
 * export async function fetchTruthSocialPosts() {
 *   // Option A: RSS feed (unofficial)
 *   const res = await fetch('https://truthsocial.com/@realDonaldTrump/feed.rss')
 *   // Parse RSS XML...
 *
 *   // Option B: Nitter/alternative frontend
 *   // const res = await fetch('https://nitter.net/realDonaldTrump/rss')
 * }
 *
 * export async function fetchXPosts() {
 *   // Requires X API v2 Bearer Token
 *   // https://developer.twitter.com/en/docs/twitter-api
 *   const res = await fetch(
 *     `https://api.twitter.com/2/users/${userId}/tweets?max_results=5`,
 *     { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }
 *   )
 * }
 */
