// Public API routes (no auth required)
import { Hono } from 'hono'
import type { Bindings } from './auth'

const api = new Hono<{ Bindings: Bindings }>()

// Site settings (public subset)
api.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT key, value FROM settings').all()
  const settings: Record<string, string> = {}
  for (const row of results as any[]) settings[row.key] = row.value
  return c.json(settings)
})

// Categories
api.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT cat.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = cat.id AND p.status = 'published') AS product_count
     FROM categories cat ORDER BY cat.sort_order, cat.id`
  ).all()
  return c.json(results)
})

// Products (published only) — optional ?category=slug&featured=1&q=text
api.get('/products', async (c) => {
  const category = c.req.query('category')
  const featured = c.req.query('featured')
  const q = c.req.query('q')

  let sql = `SELECT p.id, p.slug, p.name_ar, p.short_desc_ar, p.image_url, p.is_featured,
                    c.slug AS category_slug, c.name_ar AS category_name
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.status = 'published'`
  const binds: any[] = []
  if (category) { sql += ' AND c.slug = ?'; binds.push(category) }
  if (featured === '1') { sql += ' AND p.is_featured = 1' }
  if (q) { sql += ' AND (p.name_ar LIKE ? OR p.short_desc_ar LIKE ?)'; binds.push(`%${q}%`, `%${q}%`) }
  sql += ' ORDER BY p.sort_order, p.id'

  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(results)
})

// Single product by slug + related
api.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(
    `SELECT p.*, c.slug AS category_slug, c.name_ar AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.status = 'published'`
  ).bind(slug).first<any>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const { results: related } = await c.env.DB.prepare(
    `SELECT p.id, p.slug, p.name_ar, p.short_desc_ar, p.image_url,
            c.name_ar AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.status = 'published' AND p.id != ? AND p.category_id = ?
     ORDER BY p.sort_order LIMIT 4`
  ).bind(product.id, product.category_id).all()

  try { product.features_ar = JSON.parse(product.features_ar || '[]') } catch { product.features_ar = [] }
  return c.json({ product, related })
})

// Services
api.get('/services', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, title_ar, description_ar, icon, sort_order FROM services WHERE is_active = 1 ORDER BY sort_order, id'
  ).all()
  return c.json(results)
})

// Projects — optional ?type=residential|commercial|governmental&featured=1
api.get('/projects', async (c) => {
  const type = c.req.query('type')
  const featured = c.req.query('featured')
  let sql = 'SELECT id, title_ar, description_ar, city_ar, project_type, image_url, year FROM projects WHERE 1=1'
  const binds: any[] = []
  if (type && ['residential', 'commercial', 'governmental'].includes(type)) { sql += ' AND project_type = ?'; binds.push(type) }
  if (featured === '1') sql += ' AND is_featured = 1'
  sql += ' ORDER BY sort_order, id'
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(results)
})

// Lead submission (quote request or contact message)
api.post('/leads', async (c) => {
  let body: any
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid_json' }, 400) }

  const leadType = body.lead_type === 'contact' ? 'contact' : 'quote'
  const name = String(body.name || '').trim()
  const phone = String(body.phone || '').trim()
  const email = String(body.email || '').trim()
  const city = String(body.city || '').trim()
  const projectType = String(body.project_type || '').trim()
  const productInterest = String(body.product_interest || '').trim()
  const message = String(body.message || '').trim()

  if (name.length < 2 || name.length > 100) return c.json({ error: 'invalid_name', message: 'الاسم مطلوب (2-100 حرف)' }, 400)
  if (!/^[0-9+\s()-]{8,20}$/.test(phone)) return c.json({ error: 'invalid_phone', message: 'رقم الجوال غير صحيح' }, 400)
  if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return c.json({ error: 'invalid_email', message: 'البريد الإلكتروني غير صحيح' }, 400)
  if (leadType === 'contact' && message.length < 2) return c.json({ error: 'invalid_message', message: 'الرسالة مطلوبة' }, 400)
  if (message.length > 2000) return c.json({ error: 'message_too_long', message: 'الرسالة طويلة جداً' }, 400)

  const result = await c.env.DB.prepare(
    `INSERT INTO leads (lead_type, name, phone, email, city, project_type, product_interest, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(leadType, name, phone, email || null, city || null, projectType || null, productInterest || null, message || null).run()

  return c.json({ success: true, id: result.meta.last_row_id }, 201)
})

export default api
