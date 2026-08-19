import { Hono } from 'hono'
import type { Bindings, Variables } from './types'
import authRoutes from './routes/auth'
import publicApi from './routes/public-api'
import adminApi from './routes/admin-api'
import { publicLayout } from './pages/layout'
import { adminPage } from './pages/admin-page'
import {
  homePage, productsPage, productDetailPage, servicesPage,
  projectsPage, projectDetailPage, aboutPage, contactPage, quotePage
} from './pages/public-pages'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Security headers
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'SAMEORIGIN')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
})

// ── APIs ──
app.route('/api/auth', authRoutes)
app.route('/api/admin', adminApi)
app.route('/api', publicApi)

// ── Admin panel ──
app.get('/admin', (c) => c.html(adminPage))
app.get('/admin/*', (c) => c.html(adminPage))

// ── Public pages ──
app.get('/', (c) => c.html(publicLayout('الرئيسية', homePage, 'home')))
app.get('/products', (c) => c.html(publicLayout('المنتجات', productsPage, 'products')))
app.get('/products/:slug', (c) => c.html(publicLayout('تفاصيل المنتج', productDetailPage, 'product-detail')))
app.get('/services', (c) => c.html(publicLayout('خدماتنا', servicesPage, 'services')))
app.get('/projects', (c) => c.html(publicLayout('مشاريعنا', projectsPage, 'projects')))
app.get('/projects/:slug', (c) => c.html(publicLayout('تفاصيل المشروع', projectDetailPage, 'project-detail')))
app.get('/about', (c) => c.html(publicLayout('من نحن', aboutPage, 'about')))
app.get('/contact', (c) => c.html(publicLayout('اتصل بنا', contactPage, 'contact')))
app.get('/quote', (c) => c.html(publicLayout('طلب عرض سعر', quotePage, 'quote')))

// 404
app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'غير موجود' }, 404)
  return c.html(publicLayout('الصفحة غير موجودة', `
    <section class="max-w-3xl mx-auto px-4 py-24 text-center">
      <div class="text-8xl font-black text-brand-100 mb-4">404</div>
      <h1 class="text-2xl font-black text-brand-800 mb-3">الصفحة غير موجودة</h1>
      <p class="text-gray-500 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها</p>
      <a href="/" class="bg-brand-700 hover:bg-brand-800 text-white font-bold px-8 py-3 rounded-lg transition">العودة للرئيسية</a>
    </section>
  `, '404'), 404)
})

export default app
