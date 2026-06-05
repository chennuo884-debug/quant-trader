import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('qt_auth_token')
    const email = localStorage.getItem('qt_auth_email')
    if (token && email) {
      // Verify token is still valid
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.email) setUser({ email: d.email, token }) })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem('qt_auth_token', data.token)
    localStorage.setItem('qt_auth_email', data.email)
    setUser({ email: data.email, token: data.token })
    return data
  }, [])

  const register = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    localStorage.setItem('qt_auth_token', data.token)
    localStorage.setItem('qt_auth_email', data.email)
    setUser({ email: data.email, token: data.token })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('qt_auth_token')
    localStorage.removeItem('qt_auth_email')
    setUser(null)
  }, [])

  // API: save API key to backend
  const saveApiKey = useCallback(async (key, password) => {
    const token = user?.token || localStorage.getItem('qt_auth_token')
    const res = await fetch('/api/auth/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }, [user])

  // API: retrieve API key (requires password re-verification)
  const getApiKey = useCallback(async (password) => {
    const token = user?.token || localStorage.getItem('qt_auth_token')
    const res = await fetch('/api/auth/apikey/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data.key
  }, [user])

  // Get auth headers for API calls
  const authHeaders = useCallback(() => {
    const token = user?.token || localStorage.getItem('qt_auth_token')
    return { Authorization: `Bearer ${token}` }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, saveApiKey, getApiKey, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
