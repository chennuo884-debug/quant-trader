import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { TrendingUp, Mail, Lock, AlertCircle, LogIn, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #08090d 0%, #1a1c24 50%, #0f1117 100%)',
    }}>
      <div style={{
        width: 400, background: '#fff', borderRadius: 16, padding: 40,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12, boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0d0d12' }}>
            Quant<span style={{ fontWeight: 300, color: '#6b6e77' }}>Trader</span>
          </h1>
          <p style={{ fontSize: 12, color: '#9a9da7', marginTop: 4 }}>
            {isRegister ? '创建账户开始量化交易' : '登录你的量化交易平台'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            color: '#dc2626', fontSize: 12, marginBottom: 16,
          }}>
            <AlertCircle size={14} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>邮箱</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9da7' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>密码</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9da7' }} />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isRegister ? '至少6位' : '输入密码'} required minLength={6}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{
              width: '100%', marginTop: 8,
              background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none', padding: '12px', fontSize: 14,
            }}>
            {loading ? '处理中...' : isRegister ? <><UserPlus size={14} /> 注册</> : <><LogIn size={14} /> 登录</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{
              background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer',
              fontSize: 12, fontWeight: 500,
            }}>
            {isRegister ? '已有账户？登录' : '没有账户？注册'}
          </button>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: '#fafbfc', borderRadius: 8, fontSize: 10, color: '#9a9da7', textAlign: 'center', lineHeight: 1.6 }}>
          <Lock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          你的密码和 API Key 加密存储在服务器端，不会明文保存
        </div>
      </div>
    </div>
  )
}
