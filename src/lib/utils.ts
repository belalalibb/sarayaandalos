import type { Context } from 'hono'

export function slugify(text: string): string {
  return text.toString().trim().toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item-' + Date.now().toString(36)
}

export function sanitize(str: unknown, maxLen = 2000): string | null {
  if (str === null || str === undefined) return null
  const s = String(str).trim().slice(0, maxLen)
  return s.length ? s : null
}

export function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function auditLog(db: D1Database, userId: number | null, username: string | null, action: string, entity?: string, entityId?: string | number, metadata?: unknown) {
  try {
    await db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, entity, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, username, action, entity || null, entityId != null ? String(entityId) : null, metadata ? JSON.stringify(metadata) : null).run()
  } catch { /* logging must not break requests */ }
}

// Simple D1-based rate limiter
export async function rateLimit(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % windowSec)
  const rlKey = `${key}:${windowStart}`
  try {
    const row = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(rlKey).first<{ count: number }>()
    if (row && row.count >= limit) return false
    await db.prepare(
      'INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1'
    ).bind(rlKey, windowStart).run()
    // occasional cleanup
    if (Math.random() < 0.05) {
      await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - windowSec * 3).run()
    }
    return true
  } catch {
    return true
  }
}

export function getClientIp(c: Context): string {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export function jsonError(c: Context, status: 400 | 401 | 403 | 404 | 429 | 500, message: string) {
  return c.json({ error: message }, status)
}
