import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Bindings, Variables } from '../types'
import { getSessionUser, SESSION_COOKIE } from './auth'
import { hasPermission, hashPassword } from '../lib/auth'
import { sanitize, slugify, auditLog, jsonError } from '../lib/utils'

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ── Auth middleware ──
admin.use('*', async (c, next) => {
  const user = await getSessionUser(c.env.DB, getCookie(c, SESSION_COOKIE))
  if (!user) return jsonError(c, 401, 'يجب تسجيل الدخول')
  c.set('user', user)
  await next()
})

function requirePerm(resource: string) {
  return async (c: any, next: any) => {
    if (!hasPermission(c.get('user').role, resource)) {
      return jsonError(c, 403, 'ليس لديك صلاحية لهذا الإجراء')
    }
    await next()
  }
}

const toInt = (v: unknown) => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0

// ── Dashboard stats ──
admin.get('/stats', async (c) => {
  const [products, leads, newLeads, projects, categories, recentLeads, topProducts] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as n FROM products').first<{ n: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM leads').first<{ n: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as n FROM leads WHERE status = 'new'").first<{ n: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM projects').first<{ n: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as n FROM categories').first<{ n: number }>(),
    c.env.DB.prepare('SELECT id, request_id, type, name, phone, status, created_at FROM leads ORDER BY created_at DESC LIMIT 8').all(),
    c.env.DB.prepare("SELECT name_ar, views, slug FROM products WHERE status='published' ORDER BY views DESC LIMIT 5").all()
  ])
  return c.json({
    products: products?.n || 0, leads: leads?.n || 0, new_leads: newLeads?.n || 0,
    projects: projects?.n || 0, categories: categories?.n || 0,
    recent_leads: recentLeads.results || [], top_products: topProducts.results || []
  })
})

// ══ CATEGORIES ══
admin.get('/categories', requirePerm('categories'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM categories ORDER BY sort_order, id').all()
  return c.json(rows.results || [])
})

admin.post('/categories', requirePerm('categories'), async (c) => {
  const b = await c.req.json().catch(() => null)
  const nameAr = sanitize(b?.name_ar, 200)
  if (!nameAr) return jsonError(c, 400, 'الاسم العربي مطلوب')
  const slug = sanitize(b?.slug, 200) || slugify(b?.name_en || nameAr)
  const r = await c.env.DB.prepare(`
    INSERT INTO categories (slug, name_ar, name_en, description_ar, description_en, image, icon, parent_id, sort_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(slug, nameAr, sanitize(b?.name_en, 200), sanitize(b?.description_ar), sanitize(b?.description_en),
    sanitize(b?.image, 500), sanitize(b?.icon, 100), b?.parent_id || null, parseInt(b?.sort_order) || 0, toInt(b?.active ?? 1)).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'create', 'category', r.meta.last_row_id)
  return c.json({ id: r.meta.last_row_id, slug })
})

admin.put('/categories/:id', requirePerm('categories'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  const nameAr = sanitize(b?.name_ar, 200)
  if (!nameAr) return jsonError(c, 400, 'الاسم العربي مطلوب')
  await c.env.DB.prepare(`
    UPDATE categories SET slug=?, name_ar=?, name_en=?, description_ar=?, description_en=?, image=?, icon=?, parent_id=?, sort_order=?, active=? WHERE id=?
  `).bind(sanitize(b?.slug, 200) || slugify(nameAr), nameAr, sanitize(b?.name_en, 200), sanitize(b?.description_ar), sanitize(b?.description_en),
    sanitize(b?.image, 500), sanitize(b?.icon, 100), b?.parent_id || null, parseInt(b?.sort_order) || 0, toInt(b?.active), id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'update', 'category', id)
  return c.json({ success: true })
})

admin.delete('/categories/:id', requirePerm('categories'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const used = await c.env.DB.prepare('SELECT COUNT(*) as n FROM products WHERE category_id = ?').bind(id).first<{ n: number }>()
  if (used && used.n > 0) return jsonError(c, 400, `لا يمكن الحذف: يوجد ${used.n} منتج مرتبط بهذا التصنيف`)
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'delete', 'category', id)
  return c.json({ success: true })
})

// ══ PRODUCTS ══
admin.get('/products', requirePerm('products'), async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT p.*, c.name_ar as category_name FROM products p
    LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.sort_order, p.id DESC
  `).all()
  return c.json(rows.results || [])
})

admin.get('/products/:id', requirePerm('products'), async (c) => {
  const p = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(parseInt(c.req.param('id'))).first<any>()
  if (!p) return jsonError(c, 404, 'غير موجود')
  const images = await c.env.DB.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').bind(p.id).all()
  return c.json({ ...p, images: images.results || [] })
})

function productBinds(b: any) {
  const nameAr = sanitize(b?.name_ar, 300)
  return {
    nameAr,
    values: [
      nameAr, sanitize(b?.name_en, 300), sanitize(b?.short_desc_ar, 500), sanitize(b?.short_desc_en, 500),
      sanitize(b?.description_ar, 10000), sanitize(b?.description_en, 10000),
      b?.category_id ? parseInt(b.category_id) : null, sanitize(b?.main_image, 500),
      typeof b?.specs === 'string' ? sanitize(b.specs, 8000) : JSON.stringify(b?.specs || []),
      typeof b?.colors === 'string' ? sanitize(b.colors, 2000) : JSON.stringify(b?.colors || []),
      b?.price != null && b.price !== '' ? parseFloat(b.price) : null, toInt(b?.show_price),
      toInt(b?.featured), toInt(b?.is_new), toInt(b?.is_offer),
      ['published', 'draft', 'archived'].includes(b?.status) ? b.status : 'draft',
      parseInt(b?.sort_order) || 0
    ]
  }
}

admin.post('/products', requirePerm('products'), async (c) => {
  const b = await c.req.json().catch(() => null)
  const { nameAr, values } = productBinds(b)
  if (!nameAr) return jsonError(c, 400, 'اسم المنتج مطلوب')
  const slug = sanitize(b?.slug, 300) || slugify(b?.name_en || nameAr)
  const r = await c.env.DB.prepare(`
    INSERT INTO products (slug, name_ar, name_en, short_desc_ar, short_desc_en, description_ar, description_en,
      category_id, main_image, specs, colors, price, show_price, featured, is_new, is_offer, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(slug, ...values).run()
  const productId = r.meta.last_row_id
  if (Array.isArray(b?.images)) {
    for (let i = 0; i < Math.min(b.images.length, 12); i++) {
      const img = b.images[i]
      const url = sanitize(img?.url, 500)
      if (url) await c.env.DB.prepare('INSERT INTO product_images (product_id, url, alt_ar, sort_order) VALUES (?, ?, ?, ?)')
        .bind(productId, url, sanitize(img?.alt_ar, 300), i).run()
    }
  }
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'create', 'product', productId)
  return c.json({ id: productId, slug })
})

admin.put('/products/:id', requirePerm('products'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  const { nameAr, values } = productBinds(b)
  if (!nameAr) return jsonError(c, 400, 'اسم المنتج مطلوب')
  const slug = sanitize(b?.slug, 300) || slugify(b?.name_en || nameAr)
  await c.env.DB.prepare(`
    UPDATE products SET slug=?, name_ar=?, name_en=?, short_desc_ar=?, short_desc_en=?, description_ar=?, description_en=?,
      category_id=?, main_image=?, specs=?, colors=?, price=?, show_price=?, featured=?, is_new=?, is_offer=?, status=?, sort_order=?,
      updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).bind(slug, ...values, id).run()
  if (Array.isArray(b?.images)) {
    await c.env.DB.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run()
    for (let i = 0; i < Math.min(b.images.length, 12); i++) {
      const img = b.images[i]
      const url = sanitize(img?.url, 500)
      if (url) await c.env.DB.prepare('INSERT INTO product_images (product_id, url, alt_ar, sort_order) VALUES (?, ?, ?, ?)')
        .bind(id, url, sanitize(img?.alt_ar, 300), i).run()
    }
  }
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'update', 'product', id)
  return c.json({ success: true })
})

admin.delete('/products/:id', requirePerm('products'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM product_images WHERE product_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'delete', 'product', id)
  return c.json({ success: true })
})

// ══ SERVICES ══
admin.get('/services', requirePerm('services'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM services ORDER BY sort_order, id').all()
  return c.json(rows.results || [])
})

admin.post('/services', requirePerm('services'), async (c) => {
  const b = await c.req.json().catch(() => null)
  const titleAr = sanitize(b?.title_ar, 300)
  if (!titleAr) return jsonError(c, 400, 'العنوان مطلوب')
  const slug = sanitize(b?.slug, 300) || slugify(b?.title_en || titleAr)
  const r = await c.env.DB.prepare(`
    INSERT INTO services (slug, title_ar, title_en, short_desc_ar, short_desc_en, description_ar, description_en, image, icon, features_ar, sort_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(slug, titleAr, sanitize(b?.title_en, 300), sanitize(b?.short_desc_ar, 500), sanitize(b?.short_desc_en, 500),
    sanitize(b?.description_ar, 10000), sanitize(b?.description_en, 10000), sanitize(b?.image, 500), sanitize(b?.icon, 100),
    typeof b?.features_ar === 'string' ? sanitize(b.features_ar, 4000) : JSON.stringify(b?.features_ar || []),
    parseInt(b?.sort_order) || 0, toInt(b?.active ?? 1)).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'create', 'service', r.meta.last_row_id)
  return c.json({ id: r.meta.last_row_id })
})

admin.put('/services/:id', requirePerm('services'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  const titleAr = sanitize(b?.title_ar, 300)
  if (!titleAr) return jsonError(c, 400, 'العنوان مطلوب')
  await c.env.DB.prepare(`
    UPDATE services SET slug=?, title_ar=?, title_en=?, short_desc_ar=?, short_desc_en=?, description_ar=?, description_en=?, image=?, icon=?, features_ar=?, sort_order=?, active=? WHERE id=?
  `).bind(sanitize(b?.slug, 300) || slugify(titleAr), titleAr, sanitize(b?.title_en, 300), sanitize(b?.short_desc_ar, 500), sanitize(b?.short_desc_en, 500),
    sanitize(b?.description_ar, 10000), sanitize(b?.description_en, 10000), sanitize(b?.image, 500), sanitize(b?.icon, 100),
    typeof b?.features_ar === 'string' ? sanitize(b.features_ar, 4000) : JSON.stringify(b?.features_ar || []),
    parseInt(b?.sort_order) || 0, toInt(b?.active), id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'update', 'service', id)
  return c.json({ success: true })
})

admin.delete('/services/:id', requirePerm('services'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'delete', 'service', id)
  return c.json({ success: true })
})

// ══ PROJECTS ══
admin.get('/projects', requirePerm('projects'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM projects ORDER BY sort_order, id DESC').all()
  return c.json(rows.results || [])
})

admin.get('/projects/:id', requirePerm('projects'), async (c) => {
  const p = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(parseInt(c.req.param('id'))).first<any>()
  if (!p) return jsonError(c, 404, 'غير موجود')
  const images = await c.env.DB.prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order').bind(p.id).all()
  return c.json({ ...p, images: images.results || [] })
})

admin.post('/projects', requirePerm('projects'), async (c) => {
  const b = await c.req.json().catch(() => null)
  const titleAr = sanitize(b?.title_ar, 300)
  if (!titleAr) return jsonError(c, 400, 'العنوان مطلوب')
  const slug = sanitize(b?.slug, 300) || slugify(b?.title_en || titleAr)
  const r = await c.env.DB.prepare(`
    INSERT INTO projects (slug, title_ar, title_en, description_ar, description_en, cover_image, client, location, project_type, project_date, featured, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(slug, titleAr, sanitize(b?.title_en, 300), sanitize(b?.description_ar, 10000), sanitize(b?.description_en, 10000),
    sanitize(b?.cover_image, 500), sanitize(b?.client, 300), sanitize(b?.location, 300), sanitize(b?.project_type, 50),
    sanitize(b?.project_date, 50), toInt(b?.featured), ['published', 'draft'].includes(b?.status) ? b.status : 'published',
    parseInt(b?.sort_order) || 0).run()
  const projectId = r.meta.last_row_id
  if (Array.isArray(b?.images)) {
    for (let i = 0; i < Math.min(b.images.length, 20); i++) {
      const img = b.images[i]
      const url = sanitize(img?.url, 500)
      if (url) await c.env.DB.prepare('INSERT INTO project_images (project_id, url, caption_ar, sort_order) VALUES (?, ?, ?, ?)')
        .bind(projectId, url, sanitize(img?.caption_ar, 300), i).run()
    }
  }
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'create', 'project', projectId)
  return c.json({ id: projectId })
})

admin.put('/projects/:id', requirePerm('projects'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  const titleAr = sanitize(b?.title_ar, 300)
  if (!titleAr) return jsonError(c, 400, 'العنوان مطلوب')
  await c.env.DB.prepare(`
    UPDATE projects SET slug=?, title_ar=?, title_en=?, description_ar=?, description_en=?, cover_image=?, client=?, location=?, project_type=?, project_date=?, featured=?, status=?, sort_order=? WHERE id=?
  `).bind(sanitize(b?.slug, 300) || slugify(titleAr), titleAr, sanitize(b?.title_en, 300), sanitize(b?.description_ar, 10000), sanitize(b?.description_en, 10000),
    sanitize(b?.cover_image, 500), sanitize(b?.client, 300), sanitize(b?.location, 300), sanitize(b?.project_type, 50),
    sanitize(b?.project_date, 50), toInt(b?.featured), ['published', 'draft'].includes(b?.status) ? b.status : 'published',
    parseInt(b?.sort_order) || 0, id).run()
  if (Array.isArray(b?.images)) {
    await c.env.DB.prepare('DELETE FROM project_images WHERE project_id = ?').bind(id).run()
    for (let i = 0; i < Math.min(b.images.length, 20); i++) {
      const img = b.images[i]
      const url = sanitize(img?.url, 500)
      if (url) await c.env.DB.prepare('INSERT INTO project_images (project_id, url, caption_ar, sort_order) VALUES (?, ?, ?, ?)')
        .bind(id, url, sanitize(img?.caption_ar, 300), i).run()
    }
  }
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'update', 'project', id)
  return c.json({ success: true })
})

admin.delete('/projects/:id', requirePerm('projects'), async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM project_images WHERE project_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'delete', 'project', id)
  return c.json({ success: true })
})

// ══ HOME SECTIONS ══
admin.get('/home-sections', requirePerm('home'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM home_sections ORDER BY sort_order, id').all()
  return c.json(rows.results || [])
})

admin.post('/home-sections', requirePerm('home'), async (c) => {
  const b = await c.req.json().catch(() => null)
  const r = await c.env.DB.prepare(`
    INSERT INTO home_sections (section_type, title_ar, title_en, subtitle_ar, subtitle_en, image, cta_text_ar, cta_link, sort_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(sanitize(b?.section_type, 50) || 'hero', sanitize(b?.title_ar, 300), sanitize(b?.title_en, 300),
    sanitize(b?.subtitle_ar, 500), sanitize(b?.subtitle_en, 500), sanitize(b?.image, 500),
    sanitize(b?.cta_text_ar, 100), sanitize(b?.cta_link, 300), parseInt(b?.sort_order) || 0, toInt(b?.active ?? 1)).run()
  return c.json({ id: r.meta.last_row_id })
})

admin.put('/home-sections/:id', requirePerm('home'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  await c.env.DB.prepare(`
    UPDATE home_sections SET section_type=?, title_ar=?, title_en=?, subtitle_ar=?, subtitle_en=?, image=?, cta_text_ar=?, cta_link=?, sort_order=?, active=? WHERE id=?
  `).bind(sanitize(b?.section_type, 50) || 'hero', sanitize(b?.title_ar, 300), sanitize(b?.title_en, 300),
    sanitize(b?.subtitle_ar, 500), sanitize(b?.subtitle_en, 500), sanitize(b?.image, 500),
    sanitize(b?.cta_text_ar, 100), sanitize(b?.cta_link, 300), parseInt(b?.sort_order) || 0, toInt(b?.active), id).run()
  return c.json({ success: true })
})

admin.delete('/home-sections/:id', requirePerm('home'), async (c) => {
  await c.env.DB.prepare('DELETE FROM home_sections WHERE id = ?').bind(parseInt(c.req.param('id'))).run()
  return c.json({ success: true })
})

// ══ WHY US ══
admin.get('/why-us', requirePerm('home'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM why_us_items ORDER BY sort_order, id').all()
  return c.json(rows.results || [])
})

admin.post('/why-us', requirePerm('home'), async (c) => {
  const b = await c.req.json().catch(() => null)
  const titleAr = sanitize(b?.title_ar, 300)
  if (!titleAr) return jsonError(c, 400, 'العنوان مطلوب')
  const r = await c.env.DB.prepare(
    'INSERT INTO why_us_items (icon, title_ar, title_en, description_ar, description_en, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(sanitize(b?.icon, 100), titleAr, sanitize(b?.title_en, 300), sanitize(b?.description_ar, 1000), sanitize(b?.description_en, 1000),
    parseInt(b?.sort_order) || 0, toInt(b?.active ?? 1)).run()
  return c.json({ id: r.meta.last_row_id })
})

admin.put('/why-us/:id', requirePerm('home'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  await c.env.DB.prepare(
    'UPDATE why_us_items SET icon=?, title_ar=?, title_en=?, description_ar=?, description_en=?, sort_order=?, active=? WHERE id=?'
  ).bind(sanitize(b?.icon, 100), sanitize(b?.title_ar, 300), sanitize(b?.title_en, 300), sanitize(b?.description_ar, 1000),
    sanitize(b?.description_en, 1000), parseInt(b?.sort_order) || 0, toInt(b?.active), id).run()
  return c.json({ success: true })
})

admin.delete('/why-us/:id', requirePerm('home'), async (c) => {
  await c.env.DB.prepare('DELETE FROM why_us_items WHERE id = ?').bind(parseInt(c.req.param('id'))).run()
  return c.json({ success: true })
})

// ══ LEADS ══
admin.get('/leads', requirePerm('leads'), async (c) => {
  const status = sanitize(c.req.query('status'), 20)
  const type = sanitize(c.req.query('type'), 20)
  const search = sanitize(c.req.query('search'), 100)
  let where = '1=1'
  const binds: unknown[] = []
  if (status) { where += ' AND status = ?'; binds.push(status) }
  if (type) { where += ' AND type = ?'; binds.push(type) }
  if (search) { where += ' AND (name LIKE ? OR phone LIKE ? OR request_id LIKE ?)'; binds.push(`%${search}%`, `%${search}%`, `%${search}%`) }
  const rows = await c.env.DB.prepare(`SELECT * FROM leads WHERE ${where} ORDER BY created_at DESC LIMIT 200`).bind(...binds).all()
  return c.json(rows.results || [])
})

admin.put('/leads/:id', requirePerm('leads'), async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  const status = ['new', 'contacted', 'quoted', 'won', 'lost'].includes(b?.status) ? b.status : null
  if (!status) return jsonError(c, 400, 'حالة غير صالحة')
  await c.env.DB.prepare('UPDATE leads SET status=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(status, sanitize(b?.notes, 3000), id).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'update_lead', 'lead', id, { status })
  return c.json({ success: true })
})

admin.delete('/leads/:id', requirePerm('leads'), async (c) => {
  const user = c.get('user')
  if (user.role !== 'super_admin') return jsonError(c, 403, 'حذف الطلبات متاح لمدير النظام فقط')
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run()
  await auditLog(c.env.DB, user.id, user.username, 'delete', 'lead', id)
  return c.json({ success: true })
})

// ══ SETTINGS (super_admin + content_manager) ══
admin.get('/settings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
  const settings: Record<string, string> = {}
  for (const r of rows.results || []) settings[r.key] = r.value
  return c.json(settings)
})

admin.put('/settings', async (c) => {
  const user = c.get('user')
  if (!['super_admin', 'content_manager'].includes(user.role)) return jsonError(c, 403, 'ليس لديك صلاحية')
  const b = await c.req.json().catch(() => null)
  if (!b || typeof b !== 'object') return jsonError(c, 400, 'بيانات غير صالحة')
  const allowed = ['site_name_ar', 'site_name_en', 'tagline_ar', 'phone', 'whatsapp', 'email', 'address_ar', 'working_hours_ar', 'about_ar', 'map_link', 'instagram', 'twitter', 'snapchat', 'tiktok']
  for (const key of allowed) {
    if (key in b) {
      await c.env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, sanitize(b[key], 3000) || '').run()
    }
  }
  await auditLog(c.env.DB, user.id, user.username, 'update', 'settings')
  return c.json({ success: true })
})

// ══ USERS (super_admin only) ══
admin.use('/users/*', async (c, next) => {
  if (c.get('user').role !== 'super_admin') return jsonError(c, 403, 'إدارة المستخدمين متاحة لمدير النظام فقط')
  await next()
})
admin.use('/users', async (c, next) => {
  if (c.get('user').role !== 'super_admin') return jsonError(c, 403, 'إدارة المستخدمين متاحة لمدير النظام فقط')
  await next()
})

admin.get('/users', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, username, name, role, active, created_at FROM admin_users ORDER BY id').all()
  return c.json(rows.results || [])
})

admin.post('/users', async (c) => {
  const b = await c.req.json().catch(() => null)
  const username = sanitize(b?.username, 100)
  const name = sanitize(b?.name, 200)
  const password = typeof b?.password === 'string' ? b.password : ''
  const role = ['super_admin', 'content_manager', 'sales', 'editor'].includes(b?.role) ? b.role : 'editor'
  if (!username || !name) return jsonError(c, 400, 'اسم المستخدم والاسم مطلوبان')
  if (password.length < 8) return jsonError(c, 400, 'كلمة المرور 8 أحرف على الأقل')
  const exists = await c.env.DB.prepare('SELECT id FROM admin_users WHERE username = ?').bind(username).first()
  if (exists) return jsonError(c, 400, 'اسم المستخدم موجود مسبقاً')
  const hash = await hashPassword(password)
  const r = await c.env.DB.prepare('INSERT INTO admin_users (username, password_hash, name, role) VALUES (?, ?, ?, ?)')
    .bind(username, hash, name, role).run()
  const user = c.get('user')
  await auditLog(c.env.DB, user.id, user.username, 'create', 'user', r.meta.last_row_id)
  return c.json({ id: r.meta.last_row_id })
})

admin.put('/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const b = await c.req.json().catch(() => null)
  const name = sanitize(b?.name, 200)
  const role = ['super_admin', 'content_manager', 'sales', 'editor'].includes(b?.role) ? b.role : null
  const me = c.get('user')
  if (id === me.id && (toInt(b?.active) === 0 || (role && role !== 'super_admin'))) {
    return jsonError(c, 400, 'لا يمكنك تعطيل حسابك أو تخفيض صلاحياتك')
  }
  if (name) await c.env.DB.prepare('UPDATE admin_users SET name = ? WHERE id = ?').bind(name, id).run()
  if (role) await c.env.DB.prepare('UPDATE admin_users SET role = ? WHERE id = ?').bind(role, id).run()
  if (b?.active !== undefined) await c.env.DB.prepare('UPDATE admin_users SET active = ? WHERE id = ?').bind(toInt(b.active), id).run()
  if (typeof b?.password === 'string' && b.password.length >= 8) {
    const hash = await hashPassword(b.password)
    await c.env.DB.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').bind(hash, id).run()
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(id).run()
  }
  await auditLog(c.env.DB, me.id, me.username, 'update', 'user', id)
  return c.json({ success: true })
})

// ══ AUDIT LOGS (super_admin only) ══
admin.get('/audit-logs', async (c) => {
  if (c.get('user').role !== 'super_admin') return jsonError(c, 403, 'ليس لديك صلاحية')
  const rows = await c.env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all()
  return c.json(rows.results || [])
})

export default admin
