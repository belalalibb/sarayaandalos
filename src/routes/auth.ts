import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { Bindings, Variables, AdminUser } from '../types'
import { hashPassword, verifyPassword, generateSessionId } from '../lib/auth'
import { auditLog, rateLimit, getClientIp, jsonError, sanitize } from '../lib/utils'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const SESSION_COOKIE = 'saraya_session'
const SESSION_HOURS = 12

// Bootstrap: create default super admin if no users exist
async function ensureDefaultAdmin(db: D1Database) {
  const row = await db.prepare('SELECT COUNT(*) as n FROM admin_users').first<{ n: number }>()
  if (!row || row.n === 0) {
    const hash = await hashPassword('Saraya@2026')
    await db.prepare(
      "INSERT INTO admin_users (username, password_hash, name, role) VALUES ('admin', ?, 'مدير النظام', 'super_admin')"
    ).bind(hash).run()
  }
}

auth.post('/login', async (c) => {
  const ip = getClientIp(c)
  const ok = await rateLimit(c.env.DB, `login:${ip}`, 10, 300)
  if (!ok) return jsonError(c, 429, 'محاولات كثيرة، حاول لاحقاً')

  await ensureDefaultAdmin(c.env.DB)

  const body = await c.req.json().catch(() => null)
  const username = sanitize(body?.username, 100)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || !password) return jsonError(c, 400, 'اسم المستخدم وكلمة المرور مطلوبان')

  const user = await c.env.DB.prepare(
    'SELECT * FROM admin_users WHERE username = ? AND active = 1'
  ).bind(username).first<any>()

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    await auditLog(c.env.DB, null, username, 'login_failed')
    return jsonError(c, 401, 'بيانات الدخول غير صحيحة')
  }

  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString()
  await c.env.DB.prepare(
    'INSERT INTO admin_sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, user.id, expiresAt).run()

  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_HOURS * 3600
  })

  await auditLog(c.env.DB, user.id, user.username, 'login')
  return c.json({ id: user.id, username: user.username, name: user.name, role: user.role })
})

auth.post('/logout', async (c) => {
  const sid = getCookie(c, SESSION_COOKIE)
  if (sid) {
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE id = ?').bind(sid).run()
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
  }
  return c.json({ success: true })
})

auth.get('/me', async (c) => {
  const user = await getSessionUser(c.env.DB, getCookie(c, SESSION_COOKIE))
  if (!user) return jsonError(c, 401, 'غير مسجل الدخول')
  return c.json(user)
})

auth.post('/change-password', async (c) => {
  const user = await getSessionUser(c.env.DB, getCookie(c, SESSION_COOKIE))
  if (!user) return jsonError(c, 401, 'غير مسجل الدخول')
  const body = await c.req.json().catch(() => null)
  const current = typeof body?.current === 'string' ? body.current : ''
  const next = typeof body?.next === 'string' ? body.next : ''
  if (next.length < 8) return jsonError(c, 400, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')

  const row = await c.env.DB.prepare('SELECT password_hash FROM admin_users WHERE id = ?').bind(user.id).first<any>()
  if (!row || !(await verifyPassword(current, row.password_hash))) {
    return jsonError(c, 401, 'كلمة المرور الحالية غير صحيحة')
  }
  const hash = await hashPassword(next)
  await c.env.DB.prepare('UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(hash, user.id).run()
  await auditLog(c.env.DB, user.id, user.username, 'change_password')
  return c.json({ success: true })
})

export async function getSessionUser(db: D1Database, sessionId?: string): Promise<AdminUser | null> {
  if (!sessionId) return null
  const row = await db.prepare(`
    SELECT u.id, u.username, u.name, u.role, u.active
    FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now') AND u.active = 1
  `).bind(sessionId).first<AdminUser>()
  return row || null
}

export { SESSION_COOKIE }
export default auth
