import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json')
const APIKEYS_FILE = path.join(__dirname, '..', 'data', 'apikeys.json')

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// Simple file-based user store
function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) }
  catch { return {} }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

function loadApiKeys() {
  try { return JSON.parse(fs.readFileSync(APIKEYS_FILE, 'utf-8')) }
  catch { return {} }
}

function saveApiKeys(keys) {
  fs.writeFileSync(APIKEYS_FILE, JSON.stringify(keys, null, 2))
}

// bcryptjs-like hash using built-in crypto (avoids native module issues)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash === verify
}

// Simple JWT-like token (HMAC-based, no external dependency needed)
const JWT_SECRET = crypto.randomBytes(32).toString('hex') // Regenerated on restart — in production, use a fixed env var
function createToken(email) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  })).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

function verifyToken(token) {
  try {
    const [header, payload, signature] = token.split('.')
    const expected = crypto.createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')
    if (signature !== expected) return null

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return data
  } catch {
    return null
  }
}

// ─── Route handlers ────────────────────────────────────

export function setupAuth(app) {
  // Register
  app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const users = loadUsers()
    if (users[email]) return res.status(409).json({ error: 'Email already registered' })

    users[email] = { email, password: hashPassword(password), createdAt: new Date().toISOString() }
    saveUsers(users)

    const token = createToken(email)
    res.json({ token, email })
  })

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const users = loadUsers()
    const user = users[email]
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = createToken(email)
    res.json({ token, email })
  })

  // Get current user
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })

    const data = verifyToken(authHeader.slice(7))
    if (!data) return res.status(401).json({ error: 'Invalid or expired token' })

    res.json({ email: data.email })
  })

  // Save API Key (encrypted server-side)
  app.post('/api/auth/apikey', (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })

    const data = verifyToken(authHeader.slice(7))
    if (!data) return res.status(401).json({ error: 'Invalid token' })

    const { key, password } = req.body
    if (!key || !password) return res.status(400).json({ error: 'Key and password required' })

    const users = loadUsers()
    const user = users[data.email]
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(403).json({ error: 'Password incorrect' })
    }

    // Encrypt the API key with the user's password hash
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(user.password).digest(),
      Buffer.alloc(16, 0)
    )
    let encrypted = cipher.update(key, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag().toString('hex')

    const keys = loadApiKeys()
    keys[data.email] = { encrypted, authTag }
    saveApiKeys(keys)

    res.json({ success: true })
  })

  // Get API Key (requires password)
  app.post('/api/auth/apikey/retrieve', (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })

    const data = verifyToken(authHeader.slice(7))
    if (!data) return res.status(401).json({ error: 'Invalid token' })

    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    const users = loadUsers()
    const user = users[data.email]
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(403).json({ error: 'Password incorrect' })
    }

    const keys = loadApiKeys()
    const stored = keys[data.email]
    if (!stored) return res.json({ key: '' })

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        crypto.createHash('sha256').update(user.password).digest(),
        Buffer.alloc(16, 0)
      )
      decipher.setAuthTag(Buffer.from(stored.authTag, 'hex'))
      let decrypted = decipher.update(stored.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      res.json({ key: decrypted })
    } catch {
      res.status(500).json({ error: 'Decryption failed' })
    }
  })

  // AI Analysis proxy (uses server-stored API key)
  app.post('/api/ai/analyze', async (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const userData = verifyToken(authHeader.slice(7))
    if (!userData) return res.status(401).json({ error: 'Invalid token' })

    const { prompt, context } = req.body
    if (!prompt) return res.status(400).json({ error: 'Prompt required' })

    const keys = loadApiKeys()
    const stored = keys[userData.email]
    const users = loadUsers()
    const user = users[userData.email]
    if (!user || !stored) return res.status(400).json({ error: 'No API key configured. Please save your DeepSeek API key first.' })

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        crypto.createHash('sha256').update(user.password).digest(),
        Buffer.alloc(16, 0)
      )
      decipher.setAuthTag(Buffer.from(stored.authTag, 'hex'))
      let apiKey = decipher.update(stored.encrypted, 'hex', 'utf8')
      apiKey += decipher.final('utf8')

      const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat', temperature: 0.3, max_tokens: 3000,
          messages: [
            { role: 'system', content: '你是美股量化分析师。输出使用 Markdown 格式，包含标题、表格、粗体。每个判断标注置信度。' },
            { role: 'user', content: `${context || ''}\n\n${prompt}` },
          ],
        }),
      })
      const dsData = await dsRes.json()
      if (dsData.error) throw new Error(dsData.error.message)
      res.json({ result: dsData.choices[0].message.content })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  console.log('🔐 Auth routes registered')
  return { createToken, verifyToken }
}
