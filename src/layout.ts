// Shared HTML layout for public pages (RTL Arabic)

export interface PageMeta {
  title: string
  description?: string
  activeNav?: string
  content: string
  extraHead?: string
}

export function renderPage(meta: PageMeta): string {
  const nav = [
    { href: '/', label: 'الرئيسية', key: 'home' },
    { href: '/products', label: 'المنتجات', key: 'products' },
    { href: '/services', label: 'الخدمات', key: 'services' },
    { href: '/projects', label: 'مشاريعنا', key: 'projects' },
    { href: '/about', label: 'من نحن', key: 'about' },
    { href: '/contact', label: 'اتصل بنا', key: 'contact' }
  ]
  const navLinks = nav.map((n) =>
    `<a href="${n.href}" class="nav-link ${meta.activeNav === n.key ? 'nav-active' : ''}">${n.label}</a>`
  ).join('')
  const mobileLinks = nav.map((n) =>
    `<a href="${n.href}" class="block py-3 px-4 border-b border-slate-100 ${meta.activeNav === n.key ? 'text-amber-600 font-bold' : 'text-slate-700'}">${n.label}</a>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} | سرايا الألمنيوم</title>
  <meta name="description" content="${meta.description || 'سرايا الألمنيوم - تصنيع وتركيب أعمال الألمنيوم والزجاج في السعودية'}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <script>
    tailwind.config = { theme: { extend: { fontFamily: { sans: ['Tajawal', 'sans-serif'] } } } }
  </script>
  ${meta.extraHead || ''}
</head>
<body class="bg-slate-50 font-sans text-slate-800">

  <!-- Top bar -->
  <div class="bg-slate-900 text-slate-300 text-sm hidden md:block">
    <div class="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
      <div class="flex gap-6">
        <span id="topbar-phone"><i class="fas fa-phone ml-1 text-amber-500"></i> ...</span>
        <span id="topbar-email"><i class="fas fa-envelope ml-1 text-amber-500"></i> ...</span>
      </div>
      <div class="flex gap-4" id="topbar-social"></div>
    </div>
  </div>

  <!-- Header -->
  <header class="bg-white shadow-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between items-center h-20">
        <a href="/" id="site-logo" class="flex items-center gap-3">
          <span class="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-amber-400 text-2xl"><i class="fas fa-border-all"></i></span>
          <span>
            <span class="block text-xl font-black text-slate-800">سرايا الألمنيوم</span>
            <span class="block text-xs text-slate-500">SARAYA ALUMINUM</span>
          </span>
        </a>
        <nav id="main-nav" class="hidden lg:flex items-center gap-2">${navLinks}</nav>
        <div class="flex items-center gap-3">
          <a href="/quote" class="hidden sm:inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-lg transition">
            <i class="fas fa-file-invoice"></i> اطلب عرض سعر
          </a>
          <button id="mobile-menu-btn" class="lg:hidden w-10 h-10 rounded-lg bg-slate-100 text-slate-700" aria-label="القائمة">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </div>
    <div id="mobile-menu" class="hidden lg:hidden bg-white border-t border-slate-100">
      ${mobileLinks}
      <a href="/quote" class="block py-3 px-4 text-amber-600 font-bold"><i class="fas fa-file-invoice ml-1"></i> اطلب عرض سعر</a>
    </div>
  </header>

  <main id="main-content">${meta.content}</main>

  <!-- Footer -->
  <footer class="bg-slate-900 text-slate-300 mt-20">
    <div class="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-4 gap-10">
      <section id="footer-about">
        <h3 class="text-white font-black text-lg mb-4">سرايا الألمنيوم</h3>
        <p class="text-sm leading-7" id="footer-tagline">شركة سعودية متخصصة في تصنيع وتركيب أعمال الألمنيوم والزجاج.</p>
      </section>
      <nav id="footer-links" aria-label="روابط سريعة">
        <h3 class="text-white font-bold mb-4">روابط سريعة</h3>
        <ul class="space-y-2 text-sm">
          <li><a href="/products" class="hover:text-amber-400 transition">المنتجات</a></li>
          <li><a href="/services" class="hover:text-amber-400 transition">الخدمات</a></li>
          <li><a href="/projects" class="hover:text-amber-400 transition">مشاريعنا</a></li>
          <li><a href="/about" class="hover:text-amber-400 transition">من نحن</a></li>
          <li><a href="/quote" class="hover:text-amber-400 transition">اطلب عرض سعر</a></li>
        </ul>
      </nav>
      <section id="footer-contact">
        <h3 class="text-white font-bold mb-4">تواصل معنا</h3>
        <ul class="space-y-3 text-sm" id="footer-contact-list">
          <li><i class="fas fa-phone ml-2 text-amber-500"></i><span data-setting="phone">...</span></li>
          <li><i class="fas fa-envelope ml-2 text-amber-500"></i><span data-setting="email">...</span></li>
          <li><i class="fas fa-location-dot ml-2 text-amber-500"></i><span data-setting="address_ar">...</span></li>
          <li><i class="fas fa-clock ml-2 text-amber-500"></i><span data-setting="working_hours_ar">...</span></li>
        </ul>
      </section>
      <section id="footer-cta">
        <h3 class="text-white font-bold mb-4">جاهز تبدأ مشروعك؟</h3>
        <p class="text-sm mb-4">اطلب عرض سعر مجاني وسنتواصل معك خلال 24 ساعة</p>
        <a href="/quote" class="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-lg transition">اطلب الآن</a>
      </section>
    </div>
    <div class="border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-slate-500">
        © 2026 سرايا الألمنيوم - جميع الحقوق محفوظة
      </div>
    </div>
  </footer>

  <!-- WhatsApp float button -->
  <a id="whatsapp-float" href="#" target="_blank" rel="noopener"
     class="fixed bottom-6 left-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-2xl shadow-lg z-40 transition"
     aria-label="واتساب">
    <i class="fab fa-whatsapp"></i>
  </a>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
</body>
</html>`
}
