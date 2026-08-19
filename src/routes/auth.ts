import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Bindings, Variables, AdminUser } from '../types'
import { verifyPassword, hashPassword, generateToken, getRolePermissions } from '../lib/auth'
import { sanitize, jsonError, auditLog } from '../lib/utils'

export const SESSION_COOKIE = 'saraya_session'
const SESSION_HOURS = 24

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

export async function getSessionUser(db: D1Database, token: string | undefined): Promise<AdminUser | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const row = await db.prepare(`
    SELECT u.id, u.username, u.name, u.role FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.active = 1
  `).bind(token).first<AdminUser>()
  return row || null
}

// POST /api/auth/login
auth.post('/login', async (c) => {
  const b = await c.req.json().catch(() => null)
  const username = sanitize(b?.username, 100)
  const password = typeof b?.password === 'string' ? b.password : ''
  if (!username || !password) return jsonError(c, 400, 'اسم المستخدم وكلمة المرور مطلوبان')

  // throttle: max 10 failed attempts per username per 15 min
  const fails = await c.env.DB.prepare(
    "SELECT COUNT(*) as n FROM login_attempts WHERE username = ? AND success = 0 AND created_at > datetime('now', '-15 minutes')"
  ).bind(username).first<{ n: number }>()
  if ((fails?.n || 0) >= 10) return jsonError(c, 429, 'محاولات كثيرة، حاول بعد 15 دقيقة')

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, name, role, active FROM admin_users WHERE username = ?'
  ).bind(username).first<any>()

  const ok = user && user.active === 1 && await verifyPassword(password, user.password_hash)
  await c.env.DB.prepare('INSERT INTO login_attempts (username, success) VALUES (?, ?)').bind(username, ok ? 1 : 0).run()
  if (!ok) return jsonError(c, 401, 'بيانات الدخول غير صحيحة')

  const token = generateToken()
  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_HOURS} hours'))`
  ).bind(token, user.id).run()
  // cleanup expired sessions occasionally
  await c.env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run()

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_HOURS * 3600
  })
  await auditLog(c.env.DB, user.id, user.username, 'login', 'session')
  return c.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
    permissions: getRolePermissions(user.role)
  })
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run()
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ success: true })
})

// GET /api/auth/me
auth.get('/me', async (c) => {
  const user = await getSessionUser(c.env.DB, getCookie(c, SESSION_COOKIE))
  if (!user) return jsonError(c, 401, 'غير مسجل')
  return c.json({ user, permissions: getRolePermissions(user.role) })
})

// POST /api/auth/change-password
auth.post('/change-password', async (c) => {
  const user = await getSessionUser(c.env.DB, getCookie(c, SESSION_COOKIE))
  if (!user) return jsonError(c, 401, 'غير مسجل')
  const b = await c.req.json().catch(() => null)
  const current = typeof b?.current === 'string' ? b.current : ''
  const next = typeof b?.next === 'string' ? b.next : ''
  if (next.length < 8) return jsonError(c, 400, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
  const row = await c.env.DB.prepare('SELECT password_hash FROM admin_users WHERE id = ?').bind(user.id).first<any>()
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return jsonError(c, 401, 'كلمة المرور الحالية غير صحيحة')
  }
  const hash = await hashPassword(next)
  await c.env.DB.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').bind(hash, user.id).run()
  await auditLog(c.env.DB, user.id, user.username, 'change_password', 'user', user.id)
  return c.json({ success: true })
})

export default auth
