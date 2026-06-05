import { useState, useEffect } from 'react'
import { Key, Save, CheckCircle, Shield, Globe, Eye, EyeOff, Lock, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function APISettings() {
  const { user, saveApiKey, getApiKey } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifyPassword, setVerifyPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [retrievedKey, setRetrievedKey] = useState('')
  const [error, setError] = useState('')

  // Check if key already exists on server
  useEffect(() => {
    if (!user) return
    getApiKey('').then(k => {
      if (k) setApiKey('••••••••••••••••')
    }).catch(() => {})
  }, [user])

  const handleSave = async () => {
    if (!apiKey || apiKey.startsWith('••••')) {
      setError('Please enter a valid API key')
      return
    }
    if (!verifyPassword) {
      setError('请输入你的账户密码以加密存储 API Key')
      setShowPasswordField(true)
      return
    }
    setLoading(true)
    setError('')
    try {
      await saveApiKey(apiKey, verifyPassword)
      setSaved(true)
      setShowPasswordField(false)
      setVerifyPassword('')
      setApiKey('••••••••••••••••')
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleRetrieve = async () => {
    if (!verifyPassword) {
      setError('请输入密码查看 API Key')
      return
    }
    setLoading(true)
    setError('')
    try {
      const key = await getApiKey(verifyPassword)
      setRetrievedKey(key)
      setTimeout(() => setRetrievedKey(''), 15000) // Auto-hide after 15s
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1>API 设置</h1>
        <p>安全存储你的 DeepSeek API Key。Key 加密存储在服务器端，不会暴露在前端。</p>
      </div>

      <div className="two-col">
        <div className="card">
          <h3><Shield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />DeepSeek API 配置</h3>
          <p style={{ fontSize: 12, color: '#6b6e77', marginBottom: 16 }}>
            在 <strong>platform.deepseek.com</strong> 获取 API Key。Key 加密存储在服务器，需要密码才能查看。
          </p>

          <div className="form-group">
            <label>API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setError('') }}
                  placeholder="sk-xxxxxxxx"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9a9da7',
                    padding: '2px 6px',
                  }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Password verification for saving */}
          <div className="form-group">
            <label><Lock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />账户密码（加密存储用）</label>
            <input
              type="password"
              value={verifyPassword}
              onChange={e => { setVerifyPassword(e.target.value); setError('') }}
              placeholder="输入你的登录密码以加密 API Key"
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: 6, color: '#dc2626', fontSize: 11, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} />{error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}
              style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}>
              {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <CheckCircle size={13} /> : <Save size={13} />}
              {saved ? '已保存' : '加密保存'}
            </button>
            <button className="btn btn-outline" onClick={handleRetrieve} disabled={loading}>
              {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={13} />}
              查看已保存的 Key
            </button>
          </div>

          {retrievedKey && (
            <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>🔓 Key 已解密（15秒后自动隐藏）</div>
              <code style={{ fontSize: 11, background: '#fafbfc', padding: '4px 8px', borderRadius: 4, wordBreak: 'break-all' }}>{retrievedKey}</code>
            </div>
          )}
        </div>

        <div className="card">
          <h3>使用说明</h3>
          <div style={{ fontSize: 12, color: '#6b6e77', lineHeight: 2.2 }}>
            <div style={{ fontWeight: 600, color: '#0d0d12', marginBottom: 6, fontSize: 13 }}>
              <Globe size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />获取 API Key
            </div>
            <ol style={{ paddingLeft: 18 }}>
              <li>访问 <strong>platform.deepseek.com</strong></li>
              <li>注册并登录</li>
              <li>进入「API Keys」创建新 Key</li>
              <li>复制 Key 粘贴到左侧</li>
            </ol>

            <div style={{ fontWeight: 600, color: '#0d0d12', marginTop: 14, marginBottom: 6, fontSize: 13 }}>
              <Shield size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />安全说明
            </div>
            <ul style={{ paddingLeft: 18 }}>
              <li>API Key 使用 AES-256-GCM 加密存储在服务器端</li>
              <li>加密密钥由你的账户密码派生，服务器不存储明文</li>
              <li>查看 Key 需要再次输入密码验证</li>
              <li>AI 分析请求通过服务器代理，Key 不会暴露给浏览器</li>
            </ul>

            <div style={{ fontWeight: 600, color: '#0d0d12', marginTop: 14, marginBottom: 6, fontSize: 13 }}>
              <Key size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />之前 localhost 的 Key 怎么办？
            </div>
            <ul style={{ paddingLeft: 18 }}>
              <li>之前的 Key 存在浏览器 localStorage，不安全</li>
              <li>迁移到服务器存储后，旧的 Key 会被无视</li>
              <li>建议删除旧 Key 并在 DeepSeek 平台重新生成</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
