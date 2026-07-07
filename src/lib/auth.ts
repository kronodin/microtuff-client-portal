import * as jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'change-me-to-a-long-random-secret-string'
export const COOKIE_NAME = 'mt_session'

export interface SessionPayload {
  userId: string
  phone: string
  isAdmin: boolean
}

export function signToken(payload: SessionPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET)
    if (typeof decoded === 'string') return null
    return decoded as SessionPayload
  } catch {
    return null
  }
}

export function formatPhone(raw: string | number): string {
  // Strip everything except digits and leading +
  let p = String(raw).trim()
  const hasPlus = p.startsWith('+')
  p = p.replace(/[^\d]/g, '')
  return (hasPlus ? '+' : '') + p
}
