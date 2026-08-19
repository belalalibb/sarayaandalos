// Authentication & authorization utilities (Web Crypto API — Cloudflare Workers compatible)
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

export type Bindings = {
  DB: D1Database
}

export type Role = 'super_admin' | 'content_manager' | 'sales'

export interface AuthUser {
  id: number
  username: string
  display_name: string
  role: Role
}

const PBKDF2_ITERATIONS = 100000

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  // salt is used as raw text bytes of the hex string (matches Node seed generation with hex-string salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(saltHex), iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  )
  return toHex(bits)
}

export async function verifyPassword(password: string, saltHex: string, expectedHash: string): Promise<boolean> {
  const hash = await hashPassword(password, saltHex)
  if (hash.length !== expectedHash.length) return false
  // constant-time-ish comparison
  let diff = 0
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  return diff === 0
}

export const SESSION_COOKIE = 'saraya_session'
export const SESSION_TTL_HOURS = 24 * 7 // 7 days

export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = randomHex(32)
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString()
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, userId, expiresAt).run()
  return token
}

export async function getSessionUser(db: D1Database, token: string): Promise<AuthUser | null> {
  if (!token) return null
  const row = await db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
    )
    .bind(token)
    .first<AuthUser>()
  return row || null
}

export async function destroySession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
}

// Middleware: require any authenticated admin user
export function requireAuth() {
  return async (c: Context<{ Bindings: Bindings; Variables: { user: AuthUser } }>, next: Next) => {
    const token = getCookie(c, SESSION_COOKIE) || ''
    const user = await getSessionUser(c.env.DB, token)
    if (!user) return c.json({ error: 'unauthorized' }, 401)
    c.set('user', user)
    await next()
  }
}

// Middleware: require one of the given roles
export function requireRole(...roles: Role[]) {
  return async (c: Context<{ Bindings: Bindings; Variables: { user: AuthUser } }>, next: Next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) return c.json({ error: 'forbidden' }, 403)
    await next()
  }
}

export async function logAudit(
  db: D1Database,
  user: AuthUser | null,
  action: string,
  entity?: string,
  entityId?: string | number,
  details?: string
): Promise<void> {
  try {
    await db
      .prepare('INSERT INTO audit_log (user_id, username, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(user?.id ?? null, user?.username ?? 'anonymous', action, entity ?? null, entityId != null ? String(entityId) : null, details ?? null)
      .run()
  } catch {
    // audit failures must not break requests
  }
}
