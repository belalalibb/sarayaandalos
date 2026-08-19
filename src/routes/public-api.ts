import { Hono } from 'hono'
import type { Bindings } from '../types'
import { sanitize, jsonError, generateRequestId, checkRateLimit } from '../lib/utils'

const pub = new Hono<{ Bindings: Bindings }>()

// ── Settings (public subset) ──
pub.get('/settings', async (c) => {
  const rows = await c.env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
  const settings: Record<string, string> = {}
  for (const r of rows.results || []) settings[r.key] = r.value
  return c.json(settings)
})

// ── Categories ──
pub.get('/categories', async (c) => {
  const rows = await c.env.DB.prepare(`
    SELECT c.id, c.slug, c.name_ar, c.name_en, c.description_ar, c.image, c.icon, c.sort_order,
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') as products_count
    FROM categories c WHERE c.active = 1 ORDER BY c.sort_order, c.id
  `).all()
  return c.json(rows.results || [])
})

// ── Products list ──
pub.get('/products', async (c) => {
  const category = sanitize(c.req.query('category'), 200)
  const featured = c.req.query('featured') === '1'
  const sort = c.req.query('sort')
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1)
  const perPage = 12
  let where = "p.status = 'published'"
  const binds: unknown[] = []
  if (category) { where += ' AND c.slug = ?'; binds.push(category) }
  if (featured) where += ' AND p.featured = 1'
  let order = 'p.sort_order, p.id DESC'
  if (sort === 'newest') order = 'p.created_at DESC'
  else if (sort === 'name') order = 'p.name_ar'
  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where}`
  ).bind(...binds).first<{ n: number }>()
  const rows = await c.env.DB.prepare(`
    SELECT p.id, p.slug, p.name_ar, p.short_desc_ar, p.main_image, p.price, p.show_price,
      p.featured, p.is_new, p.is_offer, c.name_ar as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?
  `).bind(...binds, perPage, (page - 1) * perPage).all()
  return c.json({ items: rows.results || [], total: total?.n || 0, page, per_page: perPage })
})

// ── Product detail ──
pub.get('/products/:slug', async (c) => {
  const slug = sanitize(c.req.param('slug'), 300)
  if (!slug) return jsonError(c, 404, 'غير موجود')
  const p = await c.env.DB.prepare(`
    SELECT p.*, c.name_ar as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.status = 'published'
  `).bind(slug).first<any>()
  if (!p) return jsonError(c, 404, 'المنتج غير موجود')
  await c.env.DB.prepare('UPDATE products SET views = views + 1 WHERE id = ?').bind(p.id).run()
  const [images, related] = await Promise.all([
    c.env.DB.prepare('SELECT url, alt_ar FROM product_images WHERE product_id = ? ORDER BY sort_order').bind(p.id).all(),
    c.env.DB.prepare(`
      SELECT slug, name_ar, short_desc_ar, main_image FROM products
      WHERE category_id = ? AND id != ? AND status = 'published' ORDER BY RANDOM() LIMIT 4
    `).bind(p.category_id || 0, p.id).all()
  ])
  return c.json({ ...p, images: images.results || [], related: related.results || [] })
})

// ── Services ──
pub.get('/services', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM services WHERE active = 1 ORDER BY sort_order, id').all()
  return c.json(rows.results || [])
})

// ── Projects ──
pub.get('/projects', async (c) => {
  const type = sanitize(c.req.query('type'), 50)
  const featured = c.req.query('featured') === '1'
  let where = "status = 'published'"
  const binds: unknown[] = []
  if (type) { where += ' AND project_type = ?'; binds.push(type) }
  if (featured) where += ' AND featured = 1'
  const rows = await c.env.DB.prepare(
    `SELECT id, slug, title_ar, cover_image, client, location, project_type, project_date FROM projects WHERE ${where} ORDER BY sort_order, id DESC LIMIT 60`
  ).bind(...binds).all()
  return c.json(rows.results || [])
})

pub.get('/projects/:slug', async (c) => {
  const slug = sanitize(c.req.param('slug'), 300)
  if (!slug) return jsonError(c, 404, 'غير موجود')
  const p = await c.env.DB.prepare("SELECT * FROM projects WHERE slug = ? AND status = 'published'").bind(slug).first<any>()
  if (!p) return jsonError(c, 404, 'المشروع غير موجود')
  const images = await c.env.DB.prepare('SELECT url, caption_ar FROM project_images WHERE project_id = ? ORDER BY sort_order').bind(p.id).all()
  return c.json({ ...p, images: images.results || [] })
})

// ── Home content ──
pub.get('/home', async (c) => {
  const [sections, whyUs, featured, categories, projects, services] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM home_sections WHERE active = 1 ORDER BY sort_order').all(),
    c.env.DB.prepare('SELECT * FROM why_us_items WHERE active = 1 ORDER BY sort_order').all(),
    c.env.DB.prepare(`
      SELECT p.slug, p.name_ar, p.short_desc_ar, p.main_image, p.is_new, p.is_offer, c.name_ar as category_name
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.status = 'published' AND p.featured = 1 ORDER BY p.sort_order LIMIT 8
    `).all(),
    c.env.DB.prepare(`
      SELECT c.slug, c.name_ar, c.image, c.icon,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status='published') as products_count
      FROM categories c WHERE c.active = 1 ORDER BY c.sort_order LIMIT 8
    `).all(),
    c.env.DB.prepare("SELECT slug, title_ar, cover_image, location, project_type FROM projects WHERE status = 'published' AND featured = 1 ORDER BY sort_order LIMIT 6").all(),
    c.env.DB.prepare('SELECT slug, title_ar, short_desc_ar, icon FROM services WHERE active = 1 ORDER BY sort_order LIMIT 8').all()
  ])
  return c.json({
    sections: sections.results || [], why_us: whyUs.results || [], featured: featured.results || [],
    categories: categories.results || [], projects: projects.results || [], services: services.results || []
  })
})

// ── Search ──
pub.get('/search', async (c) => {
  const q = sanitize(c.req.query('q'), 100)
  if (!q || q.length < 2) return c.json({ products: [], services: [], projects: [] })
  const like = `%${q}%`
  const [products, services, projects] = await Promise.all([
    c.env.DB.prepare(`
      SELECT slug, name_ar, main_image, short_desc_ar FROM products
      WHERE status = 'published' AND (name_ar LIKE ? OR name_en LIKE ? OR short_desc_ar LIKE ?) LIMIT 8
    `).bind(like, like, like).all(),
    c.env.DB.prepare('SELECT slug, title_ar, icon FROM services WHERE active = 1 AND title_ar LIKE ? LIMIT 5').bind(like).all(),
    c.env.DB.prepare("SELECT slug, title_ar, cover_image FROM projects WHERE status = 'published' AND title_ar LIKE ? LIMIT 5").bind(like).all()
  ])
  return c.json({ products: products.results || [], services: services.results || [], projects: projects.results || [] })
})

// ── Leads: quote request ──
pub.post('/leads/quote', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  if (!(await checkRateLimit(c.env.DB, ip))) return jsonError(c, 429, 'تم استلام طلبات كثيرة، حاول لاحقاً')
  const b = await c.req.json().catch(() => null)
  const name = sanitize(b?.name, 200)
  const phone = sanitize(b?.phone, 30)
  if (!name || !phone) return jsonError(c, 400, 'الاسم ورقم الجوال مطلوبان')
  if (!/^[\d+\s()-]{8,20}$/.test(phone)) return jsonError(c, 400, 'رقم الجوال غير صالح')
  const requestId = generateRequestId()
  await c.env.DB.prepare(`
    INSERT INTO leads (request_id, type, name, phone, email, company, city, project_type, product_slug, units_count, message, ip)
    VALUES (?, 'quote', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(requestId, name, phone, sanitize(b?.email, 200), sanitize(b?.company, 300), sanitize(b?.city, 100),
    sanitize(b?.project_type, 100), sanitize(b?.product_slug, 300), sanitize(b?.units_count, 200),
    sanitize(b?.message, 3000), ip).run()
  return c.json({ success: true, request_id: requestId })
})

// ── Leads: contact message ──
pub.post('/leads/contact', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  if (!(await checkRateLimit(c.env.DB, ip))) return jsonError(c, 429, 'تم استلام رسائل كثيرة، حاول لاحقاً')
  const b = await c.req.json().catch(() => null)
  const name = sanitize(b?.name, 200)
  const phone = sanitize(b?.phone, 30)
  const message = sanitize(b?.message, 3000)
  if (!name || !phone || !message) return jsonError(c, 400, 'جميع الحقول المطلوبة يجب تعبئتها')
  const requestId = generateRequestId()
  await c.env.DB.prepare(
    "INSERT INTO leads (request_id, type, name, phone, email, message, ip) VALUES (?, 'contact', ?, ?, ?, ?, ?)"
  ).bind(requestId, name, phone, sanitize(b?.email, 200), message, ip).run()
  return c.json({ success: true, request_id: requestId })
})

export default pub
