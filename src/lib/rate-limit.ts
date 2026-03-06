// In-memory rate limiter — ausreichend für MVP auf einzelner Serverinstanz
// Key: eindeutiger Bezeichner (z.B. userId oder orgId)
// Limit: max. Anzahl Requests im Zeitfenster
// windowMs: Zeitfenster in Millisekunden

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}
