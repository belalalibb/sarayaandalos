// Admin API routes (auth + role-based access control)
import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import {
  type Bindings, type AuthUser, SESSION_COOKIE, SESSION_TTL_HOURS,
  verifyPassword, hashPassword, randomHex, createSession, destroySession,
  getSessionUser, requireAuth, requireRole, logAudit
} from './auth'

type Env = { Bindings: Bindings; Variables: { user: AuthUser } }
const admin = new Hono<Env>()

// ---------- Auth endpoints ----------
admin.post('/login', async (c) => {
  let body: any
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!username || !password) return c.json({ error: 'missing_credentials', message: 'أدخل اسم المستخدم وكلمة المرور' }, 400)

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, salt, display_name, role, is_active FROM users WHERE username = ?'
  ).bind(username).first<any>()

  if (!user || !user.is_active || !(await verifyPassword(password, user.salt, user.password_hash))) {
    await logAudit(c.env.DB, null, 'login_failed', 'users', username)
    return c.json({ error: 'invalid_credentials', message: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, 401)
  }

  const token = await createSession(c.env.DB, user.id)
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_TTL_HOURS * 3600
  })
  const authUser: AuthUser = { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
  await logAudit(c.env.DB, authUser, 'login', 'users', user.id)
  return c.json({ user: authUser })
})

admin.post('/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE) || ''
  if (token) {
    const user = await getSessionUser(c.env.DB, token)
    await destroySession(c.env.DB, token)
    if (user) await logAudit(c.env.DB, user, 'logout')
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ success: true })
})

admin.get('/me', async (c) => {
  const token = getCookie(c, SESSION_COOKIE) || ''
  const user = await getSessionUser(c.env.DB, token)
  if (!user) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ user })
})

// ---------- Everything below requires auth ----------
admin.use('/*', requireAuth())

// Dashboard stats
admin.get('/stats', async (c) => {
  const db = c.env.DB
  const [products, categories, services, projects, leadsNew, leadsTotal, recentLeads] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM products').first<any>(),
    db.prepare('SELECT COUNT(*) AS n FROM categories').first<any>(),
    db.prepare('SELECT COUNT(*) AS n FROM services WHERE is_active = 1').first<any>(),
    db.prepare('SELECT COUNT(*) AS n FROM projects').first<any>(),
    db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'").first<any>(),
    db.prepare('SELECT COUNT(*) AS n FROM leads').first<any>(),
    db.prepare('SELECT id, lead_type, name, phone, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5').all()
  ])
  return c.json({
    products: products.n, categories: categories.n, services: services.n,
    projects: projects.n, leads_new: leadsNew.n, leads_total: leadsTotal.n,
    recent_leads: recentLeads.results
  })
})

// ---------- Leads (all roles can view/update status) ----------
admin.get('/leads', async (c) => {
  const status = c.req.query('status')
  const type = c.req.query('type')
  let sql = 'SELECT * FROM leads WHERE 1=1'
  const binds: any[] = []
  if (status) { sql += ' AND status = ?'; binds.push(status) }
  if (type) { sql += ' AND lead_type = ?'; binds.push(type) }
  sql += ' ORDER BY created_at DESC LIMIT 200'
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(results)
})

admin.put('/leads/:id', async (c) => {
  const id = Number(c.req.param('id'))
  let body: any
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const status = String(body.status || '')
  const notes = body.admin_notes != null ? String(body.admin_notes) : null
  if (!['new', 'contacted', 'quoted', 'won', 'lost'].includes(status)) return c.json({ error: 'invalid_status' }, 400)
  await c.env.DB.prepare(
    "UPDATE leads SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now') WHERE id = ?"
  ).bind(status, notes, id).run()
  await logAudit(c.env.DB, c.get('user'), 'update_lead', 'leads', id, `status=${status}`)
  return c.json({ success: true })
})

admin.delete('/leads/:id', requireRole('super_admin'), async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete_lead', 'leads', id)
  return c.json({ success: true })
})

// ---------- Content management (super_admin + content_manager) ----------
const contentRoles = requireRole('super_admin', 'content_manager')

// Categories
admin.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT cat.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = cat.id) AS product_count
     FROM categories cat ORDER BY cat.sort_order, cat.id`
  ).all()
  return c.json(results)
})

admin.post('/categories', contentRoles, async (c) => {
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const name = String(b.name_ar || '').trim()
  const slug = String(b.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (!name || !slug) return c.json({ error: 'missing_fields', message: 'الاسم والمعرّف مطلوبان' }, 400)
  try {
    const r = await c.env.DB.prepare(
      'INSERT INTO categories (slug, name_ar, icon, image_url, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).bind(slug, name, b.icon || 'fas fa-box', b.image_url || null, Number(b.sort_order) || 0).run()
    await logAudit(c.env.DB, c.get('user'), 'create_category', 'categories', r.meta.last_row_id, name)
    return c.json({ id: r.meta.last_row_id }, 201)
  } catch (e: any) {
    return c.json({ error: 'duplicate_slug', message: 'المعرّف مستخدم مسبقاً' }, 409)
  }
})

admin.put('/categories/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  await c.env.DB.prepare(
    'UPDATE categories SET name_ar = ?, icon = ?, image_url = ?, sort_order = ? WHERE id = ?'
  ).bind(String(b.name_ar || '').trim(), b.icon || 'fas fa-box', b.image_url || null, Number(b.sort_order) || 0, id).run()
  await logAudit(c.env.DB, c.get('user'), 'update_category', 'categories', id)
  return c.json({ success: true })
})

admin.delete('/categories/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete_category', 'categories', id)
  return c.json({ success: true })
})

// Products
admin.get('/products', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.name_ar AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.sort_order, p.id`
  ).all()
  return c.json(results)
})

function slugify(input: string): string {
  const s = String(input || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return s || 'product-' + randomHex(4)
}

admin.post('/products', contentRoles, async (c) => {
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const name = String(b.name_ar || '').trim()
  if (!name) return c.json({ error: 'missing_name', message: 'اسم المنتج مطلوب' }, 400)
  const slug = slugify(b.slug)
  const features = Array.isArray(b.features_ar) ? JSON.stringify(b.features_ar) : JSON.stringify(String(b.features_ar || '').split('\n').map((s: string) => s.trim()).filter(Boolean))
  const status = ['published', 'draft', 'archived'].includes(b.status) ? b.status : 'draft'
  try {
    const r = await c.env.DB.prepare(
      `INSERT INTO products (slug, category_id, name_ar, short_desc_ar, description_ar, features_ar, image_url, is_featured, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(slug, b.category_id ? Number(b.category_id) : null, name, b.short_desc_ar || null, b.description_ar || null,
      features, b.image_url || null, b.is_featured ? 1 : 0, status, Number(b.sort_order) || 0).run()
    await logAudit(c.env.DB, c.get('user'), 'create_product', 'products', r.meta.last_row_id, name)
    return c.json({ id: r.meta.last_row_id }, 201)
  } catch {
    return c.json({ error: 'duplicate_slug', message: 'المعرّف مستخدم مسبقاً' }, 409)
  }
})

admin.put('/products/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const features = Array.isArray(b.features_ar) ? JSON.stringify(b.features_ar) : JSON.stringify(String(b.features_ar || '').split('\n').map((s: string) => s.trim()).filter(Boolean))
  const status = ['published', 'draft', 'archived'].includes(b.status) ? b.status : 'draft'
  await c.env.DB.prepare(
    `UPDATE products SET category_id = ?, name_ar = ?, short_desc_ar = ?, description_ar = ?, features_ar = ?,
     image_url = ?, is_featured = ?, status = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(b.category_id ? Number(b.category_id) : null, String(b.name_ar || '').trim(), b.short_desc_ar || null,
    b.description_ar || null, features, b.image_url || null, b.is_featured ? 1 : 0, status, Number(b.sort_order) || 0, id).run()
  await logAudit(c.env.DB, c.get('user'), 'update_product', 'products', id)
  return c.json({ success: true })
})

admin.delete('/products/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete_product', 'products', id)
  return c.json({ success: true })
})

// Services
admin.get('/services', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services ORDER BY sort_order, id').all()
  return c.json(results)
})

admin.post('/services', contentRoles, async (c) => {
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const title = String(b.title_ar || '').trim()
  if (!title) return c.json({ error: 'missing_title', message: 'عنوان الخدمة مطلوب' }, 400)
  const r = await c.env.DB.prepare(
    'INSERT INTO services (title_ar, description_ar, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?)'
  ).bind(title, b.description_ar || null, b.icon || 'fas fa-screwdriver-wrench', Number(b.sort_order) || 0, b.is_active === false ? 0 : 1).run()
  await logAudit(c.env.DB, c.get('user'), 'create_service', 'services', r.meta.last_row_id, title)
  return c.json({ id: r.meta.last_row_id }, 201)
})

admin.put('/services/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  await c.env.DB.prepare(
    'UPDATE services SET title_ar = ?, description_ar = ?, icon = ?, sort_order = ?, is_active = ? WHERE id = ?'
  ).bind(String(b.title_ar || '').trim(), b.description_ar || null, b.icon || 'fas fa-screwdriver-wrench',
    Number(b.sort_order) || 0, b.is_active === false ? 0 : 1, id).run()
  await logAudit(c.env.DB, c.get('user'), 'update_service', 'services', id)
  return c.json({ success: true })
})

admin.delete('/services/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete_service', 'services', id)
  return c.json({ success: true })
})

// Projects
admin.get('/projects', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order, id').all()
  return c.json(results)
})

admin.post('/projects', contentRoles, async (c) => {
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const title = String(b.title_ar || '').trim()
  if (!title) return c.json({ error: 'missing_title', message: 'عنوان المشروع مطلوب' }, 400)
  const ptype = ['residential', 'commercial', 'governmental'].includes(b.project_type) ? b.project_type : 'residential'
  const r = await c.env.DB.prepare(
    `INSERT INTO projects (title_ar, description_ar, city_ar, project_type, image_url, year, is_featured, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(title, b.description_ar || null, b.city_ar || null, ptype, b.image_url || null,
    b.year ? Number(b.year) : null, b.is_featured ? 1 : 0, Number(b.sort_order) || 0).run()
  await logAudit(c.env.DB, c.get('user'), 'create_project', 'projects', r.meta.last_row_id, title)
  return c.json({ id: r.meta.last_row_id }, 201)
})

admin.put('/projects/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const ptype = ['residential', 'commercial', 'governmental'].includes(b.project_type) ? b.project_type : 'residential'
  await c.env.DB.prepare(
    `UPDATE projects SET title_ar = ?, description_ar = ?, city_ar = ?, project_type = ?, image_url = ?,
     year = ?, is_featured = ?, sort_order = ? WHERE id = ?`
  ).bind(String(b.title_ar || '').trim(), b.description_ar || null, b.city_ar || null, ptype, b.image_url || null,
    b.year ? Number(b.year) : null, b.is_featured ? 1 : 0, Number(b.sort_order) || 0, id).run()
  await logAudit(c.env.DB, c.get('user'), 'update_project', 'projects', id)
  return c.json({ success: true })
})

admin.delete('/projects/:id', contentRoles, async (c) => {
  const id = Number(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, c.get('user'), 'delete_project', 'projects', id)
  return c.json({ success: true })
})

// Settings
admin.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT key, value FROM settings').all()
  const settings: Record<string, string> = {}
  for (const row of results as any[]) settings[row.key] = row.value
  return c.json(settings)
})

admin.put('/settings', contentRoles, async (c) => {
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const allowed = ['site_name_ar', 'site_tagline_ar', 'phone', 'whatsapp', 'email', 'address_ar', 'working_hours_ar', 'about_ar', 'instagram', 'twitter', 'snapchat', 'tiktok']
  const stmts = []
  for (const key of allowed) {
    if (b[key] !== undefined) {
      stmts.push(c.env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, String(b[key])))
    }
  }
  if (stmts.length) await c.env.DB.batch(stmts)
  await logAudit(c.env.DB, c.get('user'), 'update_settings', 'settings')
  return c.json({ success: true })
})

// ---------- User management (super_admin only) ----------
admin.get('/users', requireRole('super_admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, username, display_name, role, is_active, created_at FROM users ORDER BY id'
  ).all()
  return c.json(results)
})

admin.post('/users', requireRole('super_admin'), async (c) => {
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const username = String(b.username || '').trim().toLowerCase()
  const password = String(b.password || '')
  const displayName = String(b.display_name || '').trim()
  const role = ['super_admin', 'content_manager', 'sales'].includes(b.role) ? b.role : 'sales'
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return c.json({ error: 'invalid_username', message: 'اسم المستخدم: 3-30 حرف إنجليزي/أرقام/شرطة سفلية' }, 400)
  if (password.length < 8) return c.json({ error: 'weak_password', message: 'كلمة المرور 8 أحرف على الأقل' }, 400)
  if (!displayName) return c.json({ error: 'missing_display_name', message: 'الاسم الظاهر مطلوب' }, 400)
  const salt = randomHex(16)
  const hash = await hashPassword(password, salt)
  try {
    const r = await c.env.DB.prepare(
      'INSERT INTO users (username, password_hash, salt, display_name, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(username, hash, salt, displayName, role).run()
    await logAudit(c.env.DB, c.get('user'), 'create_user', 'users', r.meta.last_row_id, `${username} (${role})`)
    return c.json({ id: r.meta.last_row_id }, 201)
  } catch {
    return c.json({ error: 'duplicate_username', message: 'اسم المستخدم مستخدم مسبقاً' }, 409)
  }
})

admin.put('/users/:id', requireRole('super_admin'), async (c) => {
  const id = Number(c.req.param('id'))
  const me = c.get('user')
  let b: any; try { b = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }
  const role = ['super_admin', 'content_manager', 'sales'].includes(b.role) ? b.role : null
  const isActive = b.is_active === false ? 0 : 1

  if (id === me.id && (isActive === 0 || (role && role !== 'super_admin'))) {
    return c.json({ error: 'self_lockout', message: 'لا يمكنك تعطيل حسابك أو تخفيض صلاحياتك' }, 400)
  }

  if (b.display_name !== undefined || role) {
    await c.env.DB.prepare(
      'UPDATE users SET display_name = COALESCE(?, display_name), role = COALESCE(?, role), is_active = ? WHERE id = ?'
    ).bind(b.display_name ? String(b.display_name).trim() : null, role, isActive, id).run()
  } else {
    await c.env.DB.prepare('UPDATE users SET is_active = ? WHERE id = ?').bind(isActive, id).run()
  }

  if (b.password) {
    const password = String(b.password)
    if (password.length < 8) return c.json({ error: 'weak_password', message: 'كلمة المرور 8 أحرف على الأقل' }, 400)
    const salt = randomHex(16)
    const hash = await hashPassword(password, salt)
    await c.env.DB.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').bind(hash, salt, id).run()
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run()
  }

  await logAudit(c.env.DB, me, 'update_user', 'users', id)
  return c.json({ success: true })
})

admin.delete('/users/:id', requireRole('super_admin'), async (c) => {
  const id = Number(c.req.param('id'))
  const me = c.get('user')
  if (id === me.id) return c.json({ error: 'self_delete', message: 'لا يمكنك حذف حسابك' }, 400)
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  await logAudit(c.env.DB, me, 'delete_user', 'users', id)
  return c.json({ success: true })
})

// Audit log (super_admin only)
admin.get('/audit', requireRole('super_admin'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM audit_log ORDER BY created_at DESC, id DESC LIMIT 200'
  ).all()
  return c.json(results)
})

export default admin
