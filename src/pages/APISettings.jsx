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
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (!dsApiKey) return alert('请先输入 API Key')
    try {
      const res = await fetch(`${dsBaseUrl}/v1/models`, { headers: { 'Authorization': `Bearer ${dsApiKey}` } })
      if (res.ok) alert('API 连接成功')
      else alert('API 连接失败')
    } catch { alert('网络错误') }
  }

  return (
    <div>
      <div className="page-header">
        <h1>API 设置</h1>
        <p>配置 DeepSeek API，让 AI 辅助分析持仓。</p>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>DeepSeek API 配置</h3>
          <p style={{ fontSize: 12, color: '#6b6e77', marginBottom: 16 }}>在 platform.deepseek.com 获取 API Key。</p>
          <div className="form-group">
            <label>API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type={showKey ? 'text' : 'password'} value={dsApiKey} onChange={e => setDsApiKey(e.target.value)} placeholder="sk-xxxxxxxx" style={{ flex: 1 }} />
              <button className="btn btn-outline btn-sm" onClick={() => setShowKey(!showKey)} style={{ minWidth: 56 }}>{showKey ? '隐藏' : '显示'}</button>
            </div>
          </div>
          <div className="form-group"><label>Base URL</label><input type="text" value={dsBaseUrl} onChange={e => setDsBaseUrl(e.target.value)} /></div>
          <div className="form-group"><label>模型</label><select defaultValue="deepseek-chat"><option value="deepseek-chat">DeepSeek-V3</option><option value="deepseek-reasoner">DeepSeek-R1</option></select></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave}>{saved ? <><CheckCircle size={13} /> 已保存</> : <><Save size={13} /> 保存配置</>}</button>
            <button className="btn btn-outline" onClick={handleTest}>测试连接</button>
          </div>
          {dsApiKey && <div style={{ marginTop: 12, padding: 10, background: '#f0fdf4', borderRadius: 6, fontSize: 11, color: '#16a34a' }}>✓ API Key 已配置。</div>}
        </div>

        <div className="card">
          <h3>使用说明</h3>
          <div style={{ fontSize: 12, color: '#6b6e77', lineHeight: 2.2 }}>
            <div style={{ fontWeight: 600, color: '#0d0d12', marginBottom: 6, fontSize: 13 }}><Globe size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />获取 API Key</div>
            <ol style={{ paddingLeft: 18 }}>
              <li>访问 <strong style={{ color: '#0d0d12' }}>platform.deepseek.com</strong></li>
              <li>注册并登录</li>
              <li>进入「API Keys」创建新 Key</li>
              <li>复制 Key 粘贴到左侧</li>
            </ol>
            <div style={{ fontWeight: 600, color: '#0d0d12', marginTop: 14, marginBottom: 6, fontSize: 13 }}><DollarSign size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />充值</div>
            <ul style={{ paddingLeft: 18 }}><li>按量计费，用多少扣多少</li><li>支持人民币和美元充值</li><li>建议先充 $5 测试</li></ul>
            <div style={{ fontWeight: 600, color: '#0d0d12', marginTop: 14, marginBottom: 6, fontSize: 13 }}><Key size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />安全</div>
            <ul style={{ paddingLeft: 18 }}><li>Key 仅保存在浏览器 localStorage</li><li>不经过任何服务器</li><li>请求直接从浏览器发到 DeepSeek</li></ul>
          </div>
        </div>
      </div>
    </div>
  )
}
