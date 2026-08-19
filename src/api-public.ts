// Public API routes (no auth required)
import { Hono } from 'hono'
import type { Bindings } from './auth'

const api = new Hono<{ Bindings: Bindings }>()

// Site settings
api.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT key, value FROM settings').all()
  const settings: Record<string, string> = {}
  for (const row of results as any[]) settings[row.key] = row.value
  return c.json(settings)
})

// Categories
api.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') AS products_count
     FROM categories c WHERE c.active = 1 ORDER BY c.sort_order`
  ).all()
  return c.json(results)
})

// Products (with filters)
api.get('/products', async (c) => {
  const category = c.req.query('category')
  const featured = c.req.query('featured')
  const search = c.req.query('q')
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)

  let sql = `SELECT p.id, p.slug, p.name_ar, p.short_desc_ar, p.main_image, p.colors, p.featured, p.is_new,
             c.name_ar AS category_name, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.status = 'published'`
  const binds: any[] = []
  if (category) { sql += ' AND c.slug = ?'; binds.push(category) }
  if (featured === '1') { sql += ' AND p.featured = 1' }
  if (search) { sql += ' AND (p.name_ar LIKE ? OR p.short_desc_ar LIKE ?)'; binds.push(`%${search}%`, `%${search}%`) }
  sql += ' ORDER BY p.sort_order, p.id LIMIT ?'
  binds.push(limit)

  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(results)
})

// Single product
api.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(
    `SELECT p.*, c.name_ar AS category_name, c.slug AS category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.status = 'published'`
  ).bind(slug).first()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const { results: images } = await c.env.DB.prepare(
    'SELECT url, alt_ar FROM product_images WHERE product_id = ? ORDER BY sort_order'
  ).bind((product as any).id).all()

  // Related products from same category
  const { results: related } = await c.env.DB.prepare(
    `SELECT slug, name_ar, short_desc_ar, main_image FROM products
     WHERE category_id = ? AND id != ? AND status = 'published' ORDER BY RANDOM() LIMIT 4`
  ).bind((product as any).category_id, (product as any).id).all()

  // Increment views (fire and forget)
  c.executionCtx.waitUntil(
    c.env.DB.prepare('UPDATE products SET views = views + 1 WHERE id = ?').bind((product as any).id).run()
  )

  return c.json({ ...product, images, related })
})

// Services
api.get('/services', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM services WHERE active = 1 ORDER BY sort_order'
  ).all()
  return c.json(results)
})

// Projects
api.get('/projects', async (c) => {
  const type = c.req.query('type')
  let sql = `SELECT id, slug, title_ar, description_ar, cover_image, client, location, project_type, project_date, featured
             FROM projects WHERE status = 'published'`
  const binds: any[] = []
  if (type) { sql += ' AND project_type = ?'; binds.push(type) }
  sql += ' ORDER BY sort_order, id'
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(results)
})

api.get('/projects/:slug', async (c) => {
  const project = await c.env.DB.prepare(
    "SELECT * FROM projects WHERE slug = ? AND status = 'published'"
  ).bind(c.req.param('slug')).first()
  if (!project) return c.json({ error: 'not_found' }, 404)
  const { results: images } = await c.env.DB.prepare(
    'SELECT url, caption_ar FROM project_images WHERE project_id = ? ORDER BY sort_order'
  ).bind((project as any).id).all()
  return c.json({ ...project, images })
})

// Home data (hero + why us + featured products + featured projects)
api.get('/home', async (c) => {
  const [hero, whyUs, featuredProducts, featuredProjects, categories] = await Promise.all([
    c.env.DB.prepare("SELECT * FROM home_sections WHERE section_type = 'hero' AND active = 1 ORDER BY sort_order").all(),
    c.env.DB.prepare('SELECT * FROM why_us_items WHERE active = 1 ORDER BY sort_order').all(),
    c.env.DB.prepare(
      `SELECT p.slug, p.name_ar, p.short_desc_ar, p.main_image, p.is_new, c.name_ar AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.featured = 1 AND p.status = 'published' ORDER BY p.sort_order LIMIT 8`
    ).all(),
    c.env.DB.prepare(
      `SELECT slug, title_ar, cover_image, location, project_type FROM projects
       WHERE featured = 1 AND status = 'published' ORDER BY sort_order LIMIT 4`
    ).all(),
    c.env.DB.prepare(
      `SELECT c.slug, c.name_ar, c.icon, c.image,
       (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status='published') AS products_count
       FROM categories c WHERE c.active = 1 ORDER BY c.sort_order`
    ).all()
  ])
  return c.json({
    hero: hero.results,
    whyUs: whyUs.results,
    featuredProducts: featuredProducts.results,
    featuredProjects: featuredProjects.results,
    categories: categories.results
  })
})

// Submit lead (quote request / contact message)
api.post('/leads', async (c) => {
  let body: any
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }

  const name = (body.name || '').toString().trim()
  const phone = (body.phone || '').toString().trim()
  const type = body.type === 'contact' ? 'contact' : 'quote'

  if (name.length < 2 || name.length > 100) return c.json({ error: 'الاسم مطلوب (2-100 حرف)' }, 400)
  if (!/^[0-9+\s()-]{8,20}$/.test(phone)) return c.json({ error: 'رقم الجوال غير صحيح' }, 400)

  const email = (body.email || '').toString().trim().slice(0, 100)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: 'البريد الإلكتروني غير صحيح' }, 400)

  const requestId = `${type === 'quote' ? 'Q' : 'C'}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  await c.env.DB.prepare(
    `INSERT INTO leads (request_id, type, name, phone, email, city, project_type, product_slug, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    requestId, type, name, phone,
    email || null,
    (body.city || '').toString().slice(0, 60) || null,
    (body.project_type || '').toString().slice(0, 60) || null,
    (body.product_slug || '').toString().slice(0, 100) || null,
    (body.message || '').toString().slice(0, 2000) || null
  ).run()

  return c.json({ success: true, request_id: requestId })
})

export default api
