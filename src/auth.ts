// Auth utilities: PBKDF2 password hashing, session management, RBAC middleware
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

export const SESSION_COOKIE = 'saraya_session'
export const SESSION_TTL_HOURS = 24 * 7 // 7 days

// ---------- Crypto helpers (Web Crypto API - Workers compatible) ----------

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomHex(byteLen: number): string {
  const bytes = new Uint8Array(byteLen)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return bytesToHex(bits)
}

export async function verifyPassword(password: string, saltHex: string, expectedHash: string): Promise<boolean> {
  const actual = await hashPassword(password, saltHex)
  // constant-time compare
  if (actual.length !== expectedHash.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  return diff === 0
}

// ---------- Session management ----------

export async function createSession(db: D1Database, userId: number): Promise<string> {
  const token = randomHex(32)
  await db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_TTL_HOURS} hours'))`
  ).bind(token, userId).run()
  // opportunistic cleanup of expired sessions
  await db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run()
  return token
}

export async function destroySession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
}

export async function getSessionUser(db: D1Database, token: string): Promise<AuthUser | null> {
  if (!token || token.length !== 64) return null
  const row = await db.prepare(
    `SELECT u.id, u.username, u.display_name, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1`
  ).bind(token).first<AuthUser>()
  return row || null
}

// ---------- Middleware ----------

type AuthEnv = { Bindings: Bindings; Variables: { user: AuthUser } }

export function requireAuth() {
  return async (c: Context<AuthEnv>, next: Next) => {
    const token = getCookie(c, SESSION_COOKIE) || ''
    const user = await getSessionUser(c.env.DB, token)
    if (!user) return c.json({ error: 'unauthorized', message: 'يجب تسجيل الدخول' }, 401)
    c.set('user', user)
    await next()
  }
}

export function requireRole(...roles: Role[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'forbidden', message: 'ليس لديك صلاحية لهذا الإجراء' }, 403)
    }
    await next()
  }
}

// ---------- Audit ----------

export async function logAudit(
  db: D1Database,
  user: AuthUser | null,
  action: string,
  entity?: string,
  entityId?: string | number,
  details?: string
): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO audit_log (user_id, username, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user?.id ?? null, user?.username ?? null, action, entity ?? null, entityId != null ? String(entityId) : null, details ?? null).run()
  } catch {
    // audit failures must not break requests
  }
}
