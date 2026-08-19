import { Hono } from 'hono'
import type { Bindings } from './auth'
import apiPublic from './api-public'
import apiAdmin from './api-admin'
import { renderPage } from './layout'
import { homePage, productsPage, productDetailPage, servicesPage, projectsPage, aboutPage, contactPage, quotePage } from './pages'
import { adminPage } from './admin-page'

const app = new Hono<{ Bindings: Bindings }>()

// APIs
app.route('/api', apiPublic)
app.route('/api/admin', apiAdmin)

// Public pages
app.get('/', (c) => c.html(renderPage({
  title: 'الرئيسية',
  description: 'سرايا الألمنيوم - شركة سعودية متخصصة في تصنيع وتركيب النوافذ والأبواب والواجهات الزجاجية والمطابخ والبرجولات',
  activeNav: 'home',
  content: homePage
})))

app.get('/products', (c) => c.html(renderPage({
  title: 'المنتجات',
  description: 'تصفح منتجات سرايا الألمنيوم: نوافذ، أبواب، واجهات زجاجية، مطابخ ألمنيوم، درابزين، برجولات وأكثر',
  activeNav: 'products',
  content: productsPage
})))

app.get('/products/:slug', (c) => c.html(renderPage({
  title: 'تفاصيل المنتج',
  activeNav: 'products',
  content: productDetailPage
})))

app.get('/services', (c) => c.html(renderPage({
  title: 'خدماتنا',
  description: 'خدمات سرايا الألمنيوم: استشارة ورفع مقاسات مجاني، تصنيع حسب الطلب، تركيب احترافي، صيانة وضمان',
  activeNav: 'services',
  content: servicesPage
})))

app.get('/projects', (c) => c.html(renderPage({
  title: 'مشاريعنا',
  description: 'مشاريع سرايا الألمنيوم المنفذة: فلل سكنية، أبراج تجارية، مشاريع حكومية في مختلف مناطق المملكة',
  activeNav: 'projects',
  content: projectsPage
})))

app.get('/about', (c) => c.html(renderPage({
  title: 'من نحن',
  description: 'تعرف على سرايا الألمنيوم - خبرة تتجاوز 15 عاماً في تصنيع وتركيب أعمال الألمنيوم والزجاج',
  activeNav: 'about',
  content: aboutPage
})))

app.get('/contact', (c) => c.html(renderPage({
  title: 'اتصل بنا',
  description: 'تواصل مع سرايا الألمنيوم - هاتف، واتساب، بريد إلكتروني',
  activeNav: 'contact',
  content: contactPage
})))

app.get('/quote', (c) => c.html(renderPage({
  title: 'اطلب عرض سعر',
  description: 'اطلب عرض سعر مجاني من سرايا الألمنيوم - نرد عليك خلال 24 ساعة',
  content: quotePage
})))

// Admin panel
app.get('/admin', (c) => c.html(adminPage))

// 404
app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'not_found' }, 404)
  return c.html(renderPage({
    title: 'الصفحة غير موجودة',
    content: `<section class="max-w-3xl mx-auto px-4 py-24 text-center">
      <p class="text-7xl font-black text-amber-500 mb-4">404</p>
      <h1 class="text-2xl font-black mb-3">الصفحة غير موجودة</h1>
      <p class="text-slate-500 mb-8">عذراً، الصفحة التي تبحث عنها غير متوفرة</p>
      <a href="/" class="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl transition">العودة للرئيسية</a>
    </section>`
  }), 404)
})

export default app
