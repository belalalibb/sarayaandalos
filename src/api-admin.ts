// Admin API routes (auth required)
import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import {
  type Bindings, type AdminUser,
  verifyPassword, hashPassword, generateToken,
  getSessionUser, requireAuth, requireRole, logAudit
} from './auth'

type Env = { Bindings: Bindings; Variables: { user: AdminUser } }
const admin = new Hono<Env>()

// ---------- Auth ----------
admin.post('/login', async (c) => {
  let body: any
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const username = (body.username || '').toString().trim().toLowerCase()
  const password = (body.password || '').toString()
  if (!username || !password) return c.json({ error: 'أدخل اسم المستخدم وكلمة المرور' }, 400)

  // Rate limit: max 5 failed attempts in 15 minutes
  const attempts = await c.env.DB.prepare(
    `SELECT COUNT(*) AS cnt FROM login_attempts
     WHERE username = ? AND success = 0 AND created_at > datetime('now', '-15 minutes')`
  ).bind(username).first<{ cnt: number }>()
  if ((attempts?.cnt || 0) >= 5) {
    return c.json({ error: 'تم تجاوز عدد المحاولات، حاول بعد 15 دقيقة' }, 429)
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM admin_users WHERE username = ? AND active = 1'
  ).bind(username).first<any>()

  const ok = user && (await verifyPassword(password, user.password_hash))
  await c.env.DB.prepare('INSERT INTO login_attempts (username, success) VALUES (?, ?)')
    .bind(username, ok ? 1 : 0).run()

  if (!ok) return c.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401)

  const token = generateToken()
  await c.env.DB.prepare(
    "INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+8 hours'))"
  ).bind(token, user.id).run()

  setCookie(c, 'admin_session', token, {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 8 * 3600
  })

  await logAudit(c.env.DB, { id: user.id, username: user.username, name: user.name, role: user.role }, 'login', 'session')
  return c.json({ success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } })
})

admin.post('/logout', async (c) => {
  const token = getCookie(c, 'admin_session')
  if (token) await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run()
  deleteCookie(c, 'admin_session', { path: '/' })
  return c.json({ success: true })
})

admin.get('/me', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  return c.json(user)
})

// ---------- All routes below require auth ----------
admin.use('/*', requireAuth)

// Dashboard stats
admin.get('/stats', async (c) => {
  const [products, leads, newLeads, projects, recentLeads, topProducts] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS cnt FROM products WHERE status = 'published'").first<any>(),
    c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM leads').first<any>(),
    c.env.DB.prepare("SELECT COUNT(*) AS cnt FROM leads WHERE status = 'new'").first<any>(),
    c.env.DB.prepare("SELECT COUNT(*) AS cnt FROM projects WHERE status = 'published'").first<any>(),
    c.env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 6').all(),
    c.env.DB.prepare("SELECT name_ar, views FROM products WHERE status='published' ORDER BY views DESC LIMIT 5").all()
  ])
  return c.json({
    products: products?.cnt || 0,
    leads: leads?.cnt || 0,
    newLeads: newLeads?.cnt || 0,
    projects: projects?.cnt || 0,
    recentLeads: recentLeads.results,
    topProducts: topProducts.results
  })
})

// ---------- Leads (sales + super_admin) ----------
admin.get('/leads', requireRole('sales', 'content_manager'), async (c) => {
  const status = c.req.query('status')
  const type = c.req.query('type')
  let sql = 'SELECT * FROM leads WHERE 1=1'
  const binds: any[] = []
  if (status) { sql += ' AND status = ?'; binds.push(status) }
  if (type) { sql += ' AND type = ?'; binds.push(type) }
  sql += ' ORDER BY created_at DESC LIMIT 200'
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(results)
})

admin.put('/leads/:id', requireRole('sales', 'content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const status = ['new', 'contacted', 'quoted', 'won', 'lost'].includes(body.status) ? body.status : 'new'
  await c.env.DB.prepare(
    "UPDATE leads SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, (body.notes || '').toString().slice(0, 2000), id).run()
  await logAudit(c.env.DB, c.get('user'), 'update', 'lead', id, `status=${status}`)
  return c.json({ success: true })
})

admin.delete('/leads/:id', requireRole('sales'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete', 'lead', id)
  return c.json({ success: true })
})

// ---------- Categories (content_manager + super_admin) ----------
admin.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  return c.json(results)
})

admin.post('/categories', requireRole('content_manager'), async (c) => {
  const b = await c.req.json()
  if (!b.slug || !b.name_ar) return c.json({ error: 'slug و name_ar مطلوبة' }, 400)
  const r = await c.env.DB.prepare(
    'INSERT INTO categories (slug, name_ar, name_en, description_ar, image, icon, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(b.slug, b.name_ar, b.name_en || null, b.description_ar || null, b.image || null, b.icon || null, b.sort_order || 0, b.active ? 1 : 1).run()
  await logAudit(c.env.DB, c.get('user'), 'create', 'category', r.meta.last_row_id as number)
  return c.json({ id: r.meta.last_row_id, success: true })
})

admin.put('/categories/:id', requireRole('content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE categories SET slug=?, name_ar=?, name_en=?, description_ar=?, image=?, icon=?, sort_order=?, active=? WHERE id=?'
  ).bind(b.slug, b.name_ar, b.name_en || null, b.description_ar || null, b.image || null, b.icon || null, b.sort_order || 0, b.active ? 1 : 0, id).run()
  await logAudit(c.env.DB, c.get('user'), 'update', 'category', id)
  return c.json({ success: true })
})

admin.delete('/categories/:id', requireRole('content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const used = await c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?').bind(id).first<any>()
  if ((used?.cnt || 0) > 0) return c.json({ error: 'لا يمكن حذف تصنيف يحتوي على منتجات' }, 400)
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete', 'category', id)
  return c.json({ success: true })
})

// ---------- Products ----------
admin.get('/products', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name_ar AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.sort_order, p.id`
  ).all()
  return c.json(results)
})

admin.post('/products', requireRole('content_manager', 'editor'), async (c) => {
  const b = await c.req.json()
  if (!b.slug || !b.name_ar) return c.json({ error: 'slug و name_ar مطلوبة' }, 400)
  const r = await c.env.DB.prepare(
    `INSERT INTO products (slug, name_ar, name_en, short_desc_ar, description_ar, category_id, main_image, specs, colors, price, show_price, featured, is_new, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.slug, b.name_ar, b.name_en || null, b.short_desc_ar || null, b.description_ar || null,
    b.category_id || null, b.main_image || null,
    typeof b.specs === 'string' ? b.specs : JSON.stringify(b.specs || []),
    typeof b.colors === 'string' ? b.colors : JSON.stringify(b.colors || []),
    b.price || null, b.show_price ? 1 : 0, b.featured ? 1 : 0, b.is_new ? 1 : 0,
    ['published', 'draft', 'archived'].includes(b.status) ? b.status : 'draft',
    b.sort_order || 0
  ).run()
  await logAudit(c.env.DB, c.get('user'), 'create', 'product', r.meta.last_row_id as number, b.name_ar)
  return c.json({ id: r.meta.last_row_id, success: true })
})

admin.put('/products/:id', requireRole('content_manager', 'editor'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json()
  await c.env.DB.prepare(
    `UPDATE products SET slug=?, name_ar=?, name_en=?, short_desc_ar=?, description_ar=?, category_id=?, main_image=?,
     specs=?, colors=?, price=?, show_price=?, featured=?, is_new=?, status=?, sort_order=?, updated_at=datetime('now') WHERE id=?`
  ).bind(
    b.slug, b.name_ar, b.name_en || null, b.short_desc_ar || null, b.description_ar || null,
    b.category_id || null, b.main_image || null,
    typeof b.specs === 'string' ? b.specs : JSON.stringify(b.specs || []),
    typeof b.colors === 'string' ? b.colors : JSON.stringify(b.colors || []),
    b.price || null, b.show_price ? 1 : 0, b.featured ? 1 : 0, b.is_new ? 1 : 0,
    ['published', 'draft', 'archived'].includes(b.status) ? b.status : 'draft',
    b.sort_order || 0, id
  ).run()
  await logAudit(c.env.DB, c.get('user'), 'update', 'product', id, b.name_ar)
  return c.json({ success: true })
})

admin.delete('/products/:id', requireRole('content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete', 'product', id)
  return c.json({ success: true })
})

// ---------- Services ----------
admin.get('/services', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services ORDER BY sort_order').all()
  return c.json(results)
})

admin.post('/services', requireRole('content_manager'), async (c) => {
  const b = await c.req.json()
  if (!b.slug || !b.title_ar) return c.json({ error: 'slug و title_ar مطلوبة' }, 400)
  const r = await c.env.DB.prepare(
    'INSERT INTO services (slug, title_ar, short_desc_ar, description_ar, image, icon, features_ar, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    b.slug, b.title_ar, b.short_desc_ar || null, b.description_ar || null, b.image || null, b.icon || null,
    typeof b.features_ar === 'string' ? b.features_ar : JSON.stringify(b.features_ar || []),
    b.sort_order || 0, b.active === false ? 0 : 1
  ).run()
  await logAudit(c.env.DB, c.get('user'), 'create', 'service', r.meta.last_row_id as number)
  return c.json({ id: r.meta.last_row_id, success: true })
})

admin.put('/services/:id', requireRole('content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE services SET slug=?, title_ar=?, short_desc_ar=?, description_ar=?, image=?, icon=?, features_ar=?, sort_order=?, active=? WHERE id=?'
  ).bind(
    b.slug, b.title_ar, b.short_desc_ar || null, b.description_ar || null, b.image || null, b.icon || null,
    typeof b.features_ar === 'string' ? b.features_ar : JSON.stringify(b.features_ar || []),
    b.sort_order || 0, b.active ? 1 : 0, id
  ).run()
  await logAudit(c.env.DB, c.get('user'), 'update', 'service', id)
  return c.json({ success: true })
})

admin.delete('/services/:id', requireRole('content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete', 'service', id)
  return c.json({ success: true })
})

// ---------- Projects ----------
admin.get('/projects', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order, id').all()
  return c.json(results)
})

admin.post('/projects', requireRole('content_manager', 'editor'), async (c) => {
  const b = await c.req.json()
  if (!b.slug || !b.title_ar) return c.json({ error: 'slug و title_ar مطلوبة' }, 400)
  const r = await c.env.DB.prepare(
    `INSERT INTO projects (slug, title_ar, description_ar, cover_image, client, location, project_type, project_date, featured, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.slug, b.title_ar, b.description_ar || null, b.cover_image || null, b.client || null,
    b.location || null, b.project_type || null, b.project_date || null,
    b.featured ? 1 : 0, ['published', 'draft'].includes(b.status) ? b.status : 'draft', b.sort_order || 0
  ).run()
  await logAudit(c.env.DB, c.get('user'), 'create', 'project', r.meta.last_row_id as number)
  return c.json({ id: r.meta.last_row_id, success: true })
})

admin.put('/projects/:id', requireRole('content_manager', 'editor'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json()
  await c.env.DB.prepare(
    `UPDATE projects SET slug=?, title_ar=?, description_ar=?, cover_image=?, client=?, location=?, project_type=?, project_date=?, featured=?, status=?, sort_order=? WHERE id=?`
  ).bind(
    b.slug, b.title_ar, b.description_ar || null, b.cover_image || null, b.client || null,
    b.location || null, b.project_type || null, b.project_date || null,
    b.featured ? 1 : 0, ['published', 'draft'].includes(b.status) ? b.status : 'draft', b.sort_order || 0, id
  ).run()
  await logAudit(c.env.DB, c.get('user'), 'update', 'project', id)
  return c.json({ success: true })
})

admin.delete('/projects/:id', requireRole('content_manager'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM project_images WHERE project_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete', 'project', id)
  return c.json({ success: true })
})

// ---------- Settings (super_admin, content_manager) ----------
admin.put('/settings', requireRole('content_manager'), async (c) => {
  const b = await c.req.json()
  const stmts = Object.entries(b).slice(0, 50).map(([key, value]) =>
    c.env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key.slice(0, 60), String(value ?? '').slice(0, 5000))
  )
  if (stmts.length) await c.env.DB.batch(stmts)
  await logAudit(c.env.DB, c.get('user'), 'update', 'settings')
  return c.json({ success: true })
})

// ---------- Users (super_admin only) ----------
admin.get('/users', requireRole(), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, username, name, role, active, created_at FROM admin_users ORDER BY id'
  ).all()
  return c.json(results)
})

admin.post('/users', requireRole(), async (c) => {
  const b = await c.req.json()
  const username = (b.username || '').toString().trim().toLowerCase()
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return c.json({ error: 'اسم المستخدم: 3-30 حرف إنجليزي/أرقام' }, 400)
  if (!b.password || b.password.length < 8) return c.json({ error: 'كلمة المرور 8 أحرف على الأقل' }, 400)
  if (!['super_admin', 'content_manager', 'sales', 'editor'].includes(b.role)) return c.json({ error: 'دور غير صحيح' }, 400)
  const hash = await hashPassword(b.password)
  try {
    const r = await c.env.DB.prepare(
      'INSERT INTO admin_users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
    ).bind(username, hash, b.name || username, b.role).run()
    await logAudit(c.env.DB, c.get('user'), 'create', 'user', r.meta.last_row_id as number, username)
    return c.json({ id: r.meta.last_row_id, success: true })
  } catch {
    return c.json({ error: 'اسم المستخدم موجود مسبقاً' }, 400)
  }
})

admin.put('/users/:id', requireRole(), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json()
  const me = c.get('user')
  if (id === me.id && b.active === false) return c.json({ error: 'لا يمكنك تعطيل حسابك' }, 400)

  if (b.password) {
    if (b.password.length < 8) return c.json({ error: 'كلمة المرور 8 أحرف على الأقل' }, 400)
    const hash = await hashPassword(b.password)
    await c.env.DB.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').bind(hash, id).run()
    // Invalidate sessions on password change
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id).run()
  }
  if (b.name || b.role || typeof b.active === 'boolean') {
    const existing = await c.env.DB.prepare('SELECT * FROM admin_users WHERE id = ?').bind(id).first<any>()
    if (!existing) return c.json({ error: 'not_found' }, 404)
    await c.env.DB.prepare('UPDATE admin_users SET name = ?, role = ?, active = ? WHERE id = ?').bind(
      b.name || existing.name,
      ['super_admin', 'content_manager', 'sales', 'editor'].includes(b.role) ? b.role : existing.role,
      typeof b.active === 'boolean' ? (b.active ? 1 : 0) : existing.active,
      id
    ).run()
  }
  await logAudit(c.env.DB, c.get('user'), 'update', 'user', id)
  return c.json({ success: true })
})

admin.delete('/users/:id', requireRole(), async (c) => {
  const id = parseInt(c.req.param('id'))
  const me = c.get('user')
  if (id === me.id) return c.json({ error: 'لا يمكنك حذف حسابك' }, 400)
  await c.env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM admin_users WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete', 'user', id)
  return c.json({ success: true })
})

// ---------- Audit log (super_admin) ----------
admin.get('/audit', requireRole(), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all()
  return c.json(results)
})

export default admin
