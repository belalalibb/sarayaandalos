// Shared public site layout (RTL Arabic)

interface PageOptions {
  title: string
  description?: string
  activeNav?: string
  content: string
}

export function renderPage(opts: PageOptions): string {
  const { title, description = '', activeNav = '', content } = opts
  const nav = (key: string) => (key === activeNav ? 'nav-link nav-active' : 'nav-link')

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | سرايا الألمنيوم</title>
  <meta name="description" content="${description.replace(/"/g, '&quot;')}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <script>
    tailwind.config = { theme: { extend: { fontFamily: { sans: ['Tajawal', 'sans-serif'] } } } }
  </script>
</head>
<body class="bg-slate-50 font-sans text-slate-800">

  <!-- Top bar -->
  <div id="topbar" class="bg-slate-900 text-slate-300 text-sm py-2 hidden md:block">
    <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
      <div class="flex gap-6">
        <span><i class="fas fa-phone ml-1 text-amber-400"></i> <span data-setting="phone" dir="ltr"></span></span>
        <span><i class="fas fa-envelope ml-1 text-amber-400"></i> <span data-setting="email"></span></span>
      </div>
      <div class="flex gap-4" id="topbar-social"></div>
    </div>
  </div>

  <!-- Header -->
  <header id="site-header" class="bg-white shadow-sm sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between items-center h-20">
        <a href="/" id="site-logo" class="flex items-center gap-3">
          <span class="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-amber-400 text-2xl"><i class="fas fa-border-all"></i></span>
          <span>
            <span class="block text-xl font-black text-slate-800">سرايا الألمنيوم</span>
            <span class="block text-xs text-slate-500">SARAYA ALUMINUM</span>
          </span>
        </a>
        <nav id="main-nav" class="hidden lg:flex items-center gap-1" aria-label="القائمة الرئيسية">
          <a href="/" class="${nav('home')}">الرئيسية</a>
          <a href="/products" class="${nav('products')}">المنتجات</a>
          <a href="/services" class="${nav('services')}">خدماتنا</a>
          <a href="/projects" class="${nav('projects')}">مشاريعنا</a>
          <a href="/about" class="${nav('about')}">من نحن</a>
          <a href="/contact" class="${nav('contact')}">اتصل بنا</a>
        </nav>
        <div class="flex items-center gap-3">
          <a href="/quote" id="header-quote-btn" class="hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-lg transition items-center gap-2">
            <i class="fas fa-file-invoice"></i> اطلب عرض سعر
          </a>
          <button id="mobile-menu-btn" class="lg:hidden w-11 h-11 rounded-lg bg-slate-100 text-slate-700" aria-label="القائمة">
            <i class="fas fa-bars text-lg"></i>
          </button>
        </div>
      </div>
    </div>
    <nav id="mobile-nav" class="hidden lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1" aria-label="قائمة الجوال">
      <a href="/" class="block ${nav('home')}">الرئيسية</a>
      <a href="/products" class="block ${nav('products')}">المنتجات</a>
      <a href="/services" class="block ${nav('services')}">خدماتنا</a>
      <a href="/projects" class="block ${nav('projects')}">مشاريعنا</a>
      <a href="/about" class="block ${nav('about')}">من نحن</a>
      <a href="/contact" class="block ${nav('contact')}">اتصل بنا</a>
      <a href="/quote" class="block bg-amber-500 text-white font-bold px-4 py-2.5 rounded-lg text-center mt-2">اطلب عرض سعر</a>
    </nav>
  </header>

  <main id="page-main">
${content}
  </main>

  <!-- Footer -->
  <footer id="site-footer" class="bg-slate-900 text-slate-300 mt-16">
    <div class="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-4 gap-10">
      <section id="footer-about">
        <div class="flex items-center gap-3 mb-4">
          <span class="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center text-amber-400 text-xl"><i class="fas fa-border-all"></i></span>
          <span class="text-lg font-black text-white">سرايا الألمنيوم</span>
        </div>
        <p class="text-sm leading-7 text-slate-400" data-setting="site_tagline_ar"></p>
        <div class="flex gap-3 mt-5" id="footer-social"></div>
      </section>
      <nav id="footer-links" aria-label="روابط سريعة">
        <h3 class="text-white font-bold mb-4">روابط سريعة</h3>
        <ul class="space-y-2.5 text-sm">
          <li><a href="/products" class="hover:text-amber-400 transition">المنتجات</a></li>
          <li><a href="/services" class="hover:text-amber-400 transition">خدماتنا</a></li>
          <li><a href="/projects" class="hover:text-amber-400 transition">مشاريعنا</a></li>
          <li><a href="/about" class="hover:text-amber-400 transition">من نحن</a></li>
          <li><a href="/quote" class="hover:text-amber-400 transition">اطلب عرض سعر</a></li>
        </ul>
      </nav>
      <nav id="footer-products" aria-label="أهم المنتجات">
        <h3 class="text-white font-bold mb-4">منتجاتنا</h3>
        <ul class="space-y-2.5 text-sm" id="footer-categories"></ul>
      </nav>
      <section id="footer-contact">
        <h3 class="text-white font-bold mb-4">تواصل معنا</h3>
        <ul class="space-y-3 text-sm">
          <li class="flex items-start gap-2"><i class="fas fa-location-dot text-amber-400 mt-1"></i> <span data-setting="address_ar"></span></li>
          <li class="flex items-center gap-2"><i class="fas fa-phone text-amber-400"></i> <span data-setting="phone" dir="ltr"></span></li>
          <li class="flex items-center gap-2"><i class="fas fa-envelope text-amber-400"></i> <span data-setting="email"></span></li>
          <li class="flex items-start gap-2"><i class="fas fa-clock text-amber-400 mt-1"></i> <span data-setting="working_hours_ar"></span></li>
        </ul>
      </section>
    </div>
    <div class="border-t border-slate-800 py-5 text-center text-sm text-slate-500">
      © <span id="footer-year"></span> سرايا الألمنيوم — جميع الحقوق محفوظة
    </div>
  </footer>

  <!-- Floating WhatsApp -->
  <a id="whatsapp-float" href="#" target="_blank" rel="noopener"
     class="fixed bottom-6 left-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-50 transition"
     aria-label="تواصل عبر واتساب">
    <i class="fab fa-whatsapp"></i>
  </a>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
</body>
</html>`
}
