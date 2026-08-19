import { Hono } from 'hono'
import type { Bindings } from '../types'
import { sanitize, rateLimit, getClientIp, jsonError } from '../lib/utils'
import { generateRequestId } from '../lib/auth'

const api = new Hono<{ Bindings: Bindings }>()

// GET /api/settings (public subset)
api.get('/settings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
  const settings: Record<string, string> = {}
  for (const r of rows.results || []) settings[r.key] = r.value
  return c.json(settings)
})

// GET /api/categories
api.get('/categories', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, slug, name_ar, name_en, description_ar, description_en, image, icon, parent_id, sort_order FROM categories WHERE active = 1 ORDER BY sort_order, id'
  ).all()
  return c.json(rows.results || [])
})

// GET /api/products?category=slug&search=&featured=1&page=1&limit=12&sort=
api.get('/products', async (c) => {
  const category = sanitize(c.req.query('category'), 100)
  const search = sanitize(c.req.query('search'), 100)
  const featured = c.req.query('featured') === '1'
  const isNew = c.req.query('new') === '1'
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1)
  const limit = Math.min(48, Math.max(1, parseInt(c.req.query('limit') || '12') || 12))
  const sort = c.req.query('sort') || 'default'

  let where = "p.status = 'published'"
  const binds: unknown[] = []
  if (category) { where += ' AND c.slug = ?'; binds.push(category) }
  if (search) { where += ' AND (p.name_ar LIKE ? OR p.name_en LIKE ? OR p.short_desc_ar LIKE ?)'; binds.push(`%${search}%`, `%${search}%`, `%${search}%`) }
  if (featured) where += ' AND p.featured = 1'
  if (isNew) where += ' AND p.is_new = 1'

  let orderBy = 'p.sort_order, p.id DESC'
  if (sort === 'newest') orderBy = 'p.created_at DESC'
  if (sort === 'name') orderBy = 'p.name_ar'

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where}`
  ).bind(...binds).first<{ n: number }>()
  const total = countRow?.n || 0

  const rows = await c.env.DB.prepare(`
    SELECT p.id, p.slug, p.name_ar, p.name_en, p.short_desc_ar, p.short_desc_en, p.main_image,
           p.featured, p.is_new, p.is_offer, p.price, p.show_price, c.slug as category_slug, c.name_ar as category_name
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?
  `).bind(...binds, limit, (page - 1) * limit).all()

  return c.json({ items: rows.results || [], total, page, pages: Math.ceil(total / limit) })
})

// GET /api/products/:slug
api.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`
    SELECT p.*, c.slug as category_slug, c.name_ar as category_name, c.name_en as category_name_en
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'published'
  `).bind(slug).first<any>()
  if (!product) return jsonError(c, 404, 'المنتج غير موجود')

  const images = await c.env.DB.prepare(
    'SELECT url, alt_ar, alt_en FROM product_images WHERE product_id = ? ORDER BY sort_order'
  ).bind(product.id).all()

  const related = await c.env.DB.prepare(`
    SELECT slug, name_ar, name_en, main_image, short_desc_ar FROM products
    WHERE category_id = ? AND id != ? AND status = 'published' ORDER BY RANDOM() LIMIT 4
  `).bind(product.category_id, product.id).all()

  c.executionCtx.waitUntil(
    c.env.DB.prepare('UPDATE products SET views = views + 1 WHERE id = ?').bind(product.id).run()
  )

  delete product.views
  return c.json({ ...product, images: images.results || [], related: related.results || [] })
})

// GET /api/services
api.get('/services', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT slug, title_ar, title_en, short_desc_ar, short_desc_en, description_ar, description_en, image, icon, features_ar FROM services WHERE active = 1 ORDER BY sort_order, id'
  ).all()
  return c.json(rows.results || [])
})

// GET /api/projects
api.get('/projects', async (c) => {
  const type = sanitize(c.req.query('type'), 50)
  let where = "status = 'published'"
  const binds: unknown[] = []
  if (type) { where += ' AND project_type = ?'; binds.push(type) }
  const rows = await c.env.DB.prepare(
    `SELECT slug, title_ar, title_en, description_ar, cover_image, client, location, project_type, project_date, featured FROM projects WHERE ${where} ORDER BY sort_order, id DESC`
  ).bind(...binds).all()
  return c.json(rows.results || [])
})

// GET /api/projects/:slug
api.get('/projects/:slug', async (c) => {
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE slug = ? AND status = 'published'"
  ).bind(c.req.param('slug')).first<any>()
  if (!project) return jsonError(c, 404, 'المشروع غير موجود')
  const images = await c.env.DB.prepare(
    'SELECT url, caption_ar, caption_en FROM project_images WHERE project_id = ? ORDER BY sort_order'
  ).bind(project.id).all()
  return c.json({ ...project, images: images.results || [] })
})

// GET /api/home (all homepage data in one call)
api.get('/home', async (c) => {
  const [sections, categories, featured, services, projects, whyUs, settingsRows] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM home_sections WHERE active = 1 ORDER BY sort_order').all(),
    c.env.DB.prepare('SELECT slug, name_ar, name_en, description_ar, image, icon FROM categories WHERE active = 1 AND parent_id IS NULL ORDER BY sort_order LIMIT 8').all(),
    c.env.DB.prepare("SELECT slug, name_ar, name_en, short_desc_ar, main_image, is_new, is_offer FROM products WHERE status = 'published' AND featured = 1 ORDER BY sort_order LIMIT 8").all(),
    c.env.DB.prepare('SELECT slug, title_ar, title_en, short_desc_ar, icon, image FROM services WHERE active = 1 ORDER BY sort_order LIMIT 6').all(),
    c.env.DB.prepare("SELECT slug, title_ar, cover_image, project_type, location FROM projects WHERE status = 'published' ORDER BY featured DESC, sort_order LIMIT 6").all(),
    c.env.DB.prepare('SELECT icon, title_ar, title_en, description_ar, description_en FROM why_us_items WHERE active = 1 ORDER BY sort_order').all(),
    c.env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
  ])
  const settings: Record<string, string> = {}
  for (const r of settingsRows.results || []) settings[r.key] = r.value
  return c.json({
    sections: sections.results || [],
    categories: categories.results || [],
    featured: featured.results || [],
    services: services.results || [],
    projects: projects.results || [],
    why_us: whyUs.results || [],
    settings
  })
})

// GET /api/search?q=
api.get('/search', async (c) => {
  const q = sanitize(c.req.query('q'), 100)
  if (!q || q.length < 2) return c.json({ products: [], services: [], projects: [], categories: [] })
  const like = `%${q}%`
  const [products, services, projects, categories] = await Promise.all([
    c.env.DB.prepare("SELECT slug, name_ar, main_image FROM products WHERE status='published' AND (name_ar LIKE ? OR name_en LIKE ? OR short_desc_ar LIKE ?) LIMIT 8").bind(like, like, like).all(),
    c.env.DB.prepare('SELECT slug, title_ar, icon FROM services WHERE active=1 AND (title_ar LIKE ? OR title_en LIKE ?) LIMIT 5').bind(like, like).all(),
    c.env.DB.prepare("SELECT slug, title_ar, cover_image FROM projects WHERE status='published' AND title_ar LIKE ? LIMIT 5").bind(like).all(),
    c.env.DB.prepare('SELECT slug, name_ar FROM categories WHERE active=1 AND (name_ar LIKE ? OR name_en LIKE ?) LIMIT 5').bind(like, like).all()
  ])
  return c.json({
    products: products.results || [], services: services.results || [],
    projects: projects.results || [], categories: categories.results || []
  })
})

// POST /api/quote (quote request → lead)
api.post('/quote', async (c) => {
  const ip = getClientIp(c)
  if (!(await rateLimit(c.env.DB, `quote:${ip}`, 5, 3600))) {
    return jsonError(c, 429, 'تم إرسال طلبات كثيرة، حاول لاحقاً')
  }
  const body = await c.req.json().catch(() => null)
  if (!body) return jsonError(c, 400, 'بيانات غير صالحة')

  const name = sanitize(body.name, 200)
  const phone = sanitize(body.phone, 30)
  if (!name || !phone) return jsonError(c, 400, 'الاسم ورقم الهاتف مطلوبان')
  if (!/^[\d\s+\-()]{7,30}$/.test(phone)) return jsonError(c, 400, 'رقم الهاتف غير صالح')

  const email = sanitize(body.email, 200)
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return jsonError(c, 400, 'البريد الإلكتروني غير صالح')

  const requestId = generateRequestId()
  let productId: number | null = null
  let productName: string | null = null
  if (body.product_slug) {
    const p = await c.env.DB.prepare('SELECT id, name_ar FROM products WHERE slug = ?').bind(sanitize(body.product_slug, 200)).first<any>()
    if (p) { productId = p.id; productName = p.name_ar }
  }

  await c.env.DB.prepare(`
    INSERT INTO leads (request_id, type, name, company, phone, whatsapp, email, project_type, city, units_count, product_id, product_name, message, source)
    VALUES (?, 'quote', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    requestId, name, sanitize(body.company, 200), phone, sanitize(body.whatsapp, 30), email,
    sanitize(body.project_type, 100), sanitize(body.city, 100), sanitize(body.units_count, 50),
    productId, productName, sanitize(body.message, 3000), sanitize(body.source, 50) || 'website'
  ).run()

  return c.json({ success: true, request_id: requestId })
})

// POST /api/contact (contact message → lead)
api.post('/contact', async (c) => {
  const ip = getClientIp(c)
  if (!(await rateLimit(c.env.DB, `contact:${ip}`, 5, 3600))) {
    return jsonError(c, 429, 'تم إرسال رسائل كثيرة، حاول لاحقاً')
  }
  const body = await c.req.json().catch(() => null)
  if (!body) return jsonError(c, 400, 'بيانات غير صالحة')
  const name = sanitize(body.name, 200)
  const phone = sanitize(body.phone, 30)
  const message = sanitize(body.message, 3000)
  if (!name || !phone || !message) return jsonError(c, 400, 'الاسم والهاتف والرسالة مطلوبة')

  const requestId = generateRequestId()
  await c.env.DB.prepare(`
    INSERT INTO leads (request_id, type, name, phone, email, message, source)
    VALUES (?, 'contact', ?, ?, ?, ?, 'contact_page')
  `).bind(requestId, name, phone, sanitize(body.email, 200), message).run()

  return c.json({ success: true, request_id: requestId })
})

export default api
