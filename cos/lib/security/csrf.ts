import { randomBytes, createHmac } from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SESSION_SECRET || 'fallback-secret-change-me'
const TOKEN_EXPIRY_MS = 60 * 60 * 1000

interface CSRFToken {
  value: string
  expiresAt: number
}

export function generateCSRFToken(): CSRFToken {
  const random = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${random}:${expiresAt}`)
    .digest('hex')

  return {
    value: `${random}.${expiresAt}.${signature}`,
    expiresAt,
  }
}

export function validateCSRFToken(token: string): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [random, expiresAtStr, signature] = parts
  const expiresAt = parseInt(expiresAtStr, 10)

  if (Date.now() > expiresAt) return false

  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(`${random}:${expiresAt}`)
    .digest('hex')

  return signature === expectedSignature
}

export function setCSRFCookie(token: string): string {
  return `__csrf_token=${token}; Path=/; SameSite=Lax; HttpOnly=false; Secure=${process.env.NODE_ENV === 'production'}`
}
