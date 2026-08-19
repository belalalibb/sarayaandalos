import type { Context } from 'hono'

// Strip HTML tags & trim, with max length
export function sanitize(v: unknown, max = 2000): string | null {
  if (typeof v !== 'string') return null
  const clean = v.replace(/<[^>]*>/g, '').trim().slice(0, max)
  return clean || null
}

export function slugify(input: string | null | undefined): string {
  const base = (input || '').toString().trim().toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `item-${Date.now().toString(36)}`
}

export function jsonError(c: Context, status: 400 | 401 | 403 | 404 | 429 | 500, message: string) {
  return c.json({ error: message }, status)
}

// Generate human-friendly request id like SRY-2408-1234
export function generateRequestId(): string {
  const d = new Date()
  const ym = `${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `SRY-${ym}-${rand}`
}

export async function auditLog(
  db: D1Database, userId: number, username: string,
  action: string, entity: string, entityId?: number | unknown, details?: unknown
) {
  try {
    await db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, username, action, entity, typeof entityId === 'number' ? entityId : null,
      details ? JSON.stringify(details) : null).run()
  } catch { /* non-fatal */ }
}

// Simple in-DB rate limit: max N inserts per phone/ip per hour
export async function checkRateLimit(db: D1Database, ip: string, max = 5): Promise<boolean> {
  const row = await db.prepare(
    "SELECT COUNT(*) as n FROM leads WHERE ip = ? AND created_at > datetime('now', '-1 hour')"
  ).bind(ip).first<{ n: number }>()
  return (row?.n || 0) < max
}
