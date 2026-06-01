import { useState } from 'react'
import { Key, Save, CheckCircle, DollarSign, Globe } from 'lucide-react'

export default function APISettings() {
  const [dsApiKey, setDsApiKey] = useState(localStorage.getItem('ds_api_key') || '')
  const [dsBaseUrl, setDsBaseUrl] = useState(localStorage.getItem('ds_base_url') || 'https://api.deepseek.com')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem('ds_api_key', dsApiKey)
    localStorage.setItem('ds_base_url', dsBaseUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (!dsApiKey) return alert('请先输入 API Key')
    try {
      const res = await fetch(`${dsBaseUrl}/v1/models`, {
        headers: { 'Authorization': `Bearer ${dsApiKey}` }
      })
      if (res.ok) alert('✅ API 连接成功!')
      else alert('❌ API 连接失败，请检查 Key 和 URL')
    } catch {
      alert('❌ 网络错误，请检查 Base URL 是否正确')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>🔌 API 设置</h1>
        <p>配置 DeepSeek API，让 AI 辅助分析持仓。在 platform.deepseek.com 获取 API Key。</p>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>🤖 DeepSeek API 配置</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            用于 GPT 持仓分析功能。按照你和 GPT 的讨论，在 DeepSeek 控制台获取。
          </p>

          <div className="form-group">
            <label>API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={dsApiKey}
                onChange={e => setDsApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
                style={{ flex: 1 }}
              />
              <button className="btn btn-outline btn-sm" onClick={() => setShowKey(!showKey)} style={{ minWidth: 60 }}>
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Base URL</label>
            <input type="text" value={dsBaseUrl} onChange={e => setDsBaseUrl(e.target.value)} />
          </div>

          <div className="form-group">
            <label>模型</label>
            <select defaultValue="deepseek-chat">
              <option value="deepseek-chat">DeepSeek-V3 (推荐)</option>
              <option value="deepseek-reasoner">DeepSeek-R1 (推理增强)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              {saved ? <><CheckCircle size={14} /> 已保存</> : <><Save size={14} /> 保存配置</>}
            </button>
            <button className="btn btn-outline" onClick={handleTest}>🔍 测试连接</button>
          </div>

          {dsApiKey && (
            <div style={{ marginTop: 14, padding: 10, background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#16a34a' }}>
              ✅ API Key 已配置。GPT 分析页面将调用 DeepSeek API 获取实时分析。
            </div>
          )}
        </div>

        <div className="card">
          <h3>💡 使用说明</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2.2 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: 14 }}>
              <Globe size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              获取 API Key
            </h4>
            <ol style={{ paddingLeft: 18 }}>
              <li>访问 <strong>platform.deepseek.com</strong></li>
              <li>注册并登录</li>
              <li>进入「API Keys」创建新 Key</li>
              <li>复制 Key 粘贴到左侧输入框</li>
            </ol>

            <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8, fontSize: 14 }}>
              <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              充值说明
            </h4>
            <ul style={{ paddingLeft: 18 }}>
              <li>按量计费，用多少扣多少</li>
              <li>支持人民币和美元充值</li>
              <li>你之前讨论过人民币可能更划算（无税）</li>
              <li>建议先充 $5 测试</li>
            </ul>

            <h4 style={{ color: 'var(--text-primary)', marginTop: 16, marginBottom: 8, fontSize: 14 }}>
              <Key size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              安全提醒
            </h4>
            <ul style={{ paddingLeft: 18 }}>
              <li>Key 仅保存在浏览器 localStorage</li>
              <li>不会上传到任何服务器</li>
              <li>每次请求直接从浏览器发送到 DeepSeek</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
