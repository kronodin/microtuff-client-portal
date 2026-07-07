// In-memory login rate limiter (per IP). Swap for Redis in production.
const attempts = new Map()

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 5

export function checkRateLimit(ip) {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec) return { allowed: true, remaining: MAX_ATTEMPTS }
  const recent = rec.timestamps.filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_ATTEMPTS) {
    const oldest = recent[0]
    const retryAfter = Math.ceil((WINDOW_MS - (now - oldest)) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - recent.length }
}

export function registerAttempt(ip) {
  const now = Date.now()
  const rec = attempts.get(ip) || { timestamps: [] }
  rec.timestamps = rec.timestamps.filter((t) => now - t < WINDOW_MS)
  rec.timestamps.push(now)
  attempts.set(ip, rec)
}
