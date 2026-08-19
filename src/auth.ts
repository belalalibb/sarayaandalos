// Authentication helpers using Web Crypto (Cloudflare Workers compatible)
import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'

export type Bindings = { DB: D1Database }

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  )
  return `pbkdf2$100000$${bytesToHex(salt.buffer)}$${bytesToHex(bits)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltHex, hashHex] = stored.split('$')
    if (scheme !== 'pbkdf2') return false
    const salt = hexToBytes(saltHex)
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: parseInt(iterStr), hash: 'SHA-256' },
      key,
      256
    )
    return bytesToHex(bits) === hashHex
  } catch {
    return false
  }
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface AdminUser {
  id: number
  username: string
  name: string
  role: string
}

export async function getSessionUser(c: Context<{ Bindings: Bindings }>): Promise<AdminUser | null> {
  const token = getCookie(c, 'admin_session')
  if (!token) return null
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.username, u.name, u.role FROM admin_sessions s
     JOIN admin_users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now') AND u.active = 1`
  ).bind(token).first<AdminUser>()
  return row || null
}

// Middleware: require authenticated admin
export async function requireAuth(c: Context<{ Bindings: Bindings; Variables: { user: AdminUser } }>, next: Next) {
  const user = await getSessionUser(c as any)
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  c.set('user', user)
  await next()
}

// Middleware factory: require one of roles (super_admin always allowed)
export function requireRole(...roles: string[]) {
  return async (c: Context<{ Bindings: Bindings; Variables: { user: AdminUser } }>, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'unauthorized' }, 401)
    if (user.role !== 'super_admin' && !roles.includes(user.role)) {
      return c.json({ error: 'forbidden' }, 403)
    }
    await next()
  }
}

export async function logAudit(
  db: D1Database,
  user: AdminUser | null,
  action: string,
  entity: string,
  entityId?: number,
  details?: string
) {
  try {
    await db.prepare(
      'INSERT INTO audit_logs (user_id, username, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user?.id ?? null, user?.username ?? 'system', action, entity, entityId ?? null, details ?? null).run()
  } catch {
    // non-fatal
  }
}
