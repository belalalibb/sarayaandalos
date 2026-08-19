// Public site layout (Arabic RTL)
export function publicLayout(title: string, content: string, pageId = ''): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | سرايا الألمنيوم</title>
  <meta name="description" content="سرايا الألمنيوم - حلول الألمنيوم والزجاج المتكاملة: نوافذ، أبواب، واجهات زجاجية، مطابخ، درابزين وبرجولات في السعودية">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { 50:'#f0f7fa',100:'#dcebf2',500:'#1a6a8a',600:'#15586f',700:'#124a5e',800:'#0e3a4a',900:'#0a2c39' },
            accent: { 400:'#e8b64c', 500:'#d9a53a', 600:'#c08f28' }
          },
          fontFamily: { sans: ['Tajawal','sans-serif'] }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
</head>
<body class="bg-gray-50 font-sans text-gray-800" data-page="${pageId}">

<!-- Top bar -->
<div class="bg-brand-900 text-white text-sm py-2 hidden md:block">
  <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
    <div class="flex gap-6">
      <span id="topbar-phone"><i class="fas fa-phone ml-1 text-accent-400"></i> <span data-setting="phone">...</span></span>
      <span><i class="fas fa-envelope ml-1 text-accent-400"></i> <span data-setting="email">...</span></span>
    </div>
    <div class="flex gap-4 items-center" id="topbar-social"></div>
  </div>
</div>

<!-- Header -->
<header class="bg-white shadow-md sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex items-center justify-between h-20">
      <a href="/" id="site-logo" class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center">
          <i class="fas fa-building-columns text-accent-400 text-xl"></i>
        </div>
        <div>
          <div class="font-black text-xl text-brand-800">سرايا الألمنيوم</div>
          <div class="text-xs text-gray-500">SARAYA ALUMINUM</div>
        </div>
      </a>
      <nav id="main-nav" class="hidden lg:flex items-center gap-8 font-medium">
        <a href="/" class="nav-link hover:text-brand-600" data-nav="home">الرئيسية</a>
        <a href="/products" class="nav-link hover:text-brand-600" data-nav="products">المنتجات</a>
        <a href="/services" class="nav-link hover:text-brand-600" data-nav="services">خدماتنا</a>
        <a href="/projects" class="nav-link hover:text-brand-600" data-nav="projects">مشاريعنا</a>
        <a href="/about" class="nav-link hover:text-brand-600" data-nav="about">من نحن</a>
        <a href="/contact" class="nav-link hover:text-brand-600" data-nav="contact">اتصل بنا</a>
      </nav>
      <div class="flex items-center gap-3">
        <button id="search-btn" class="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-600" aria-label="بحث">
          <i class="fas fa-magnifying-glass"></i>
        </button>
        <a href="/quote" class="hidden md:inline-flex bg-accent-500 hover:bg-accent-600 text-white font-bold px-5 py-2.5 rounded-lg transition">
          <i class="fas fa-file-invoice ml-2 mt-1"></i> اطلب عرض سعر
        </a>
        <button id="mobile-menu-btn" class="lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="القائمة">
          <i class="fas fa-bars text-lg"></i>
        </button>
      </div>
    </div>
  </div>
  <!-- Mobile nav -->
  <nav id="mobile-nav" class="hidden lg:hidden bg-white border-t px-4 py-3 space-y-1">
    <a href="/" class="block py-2.5 px-3 rounded-lg hover:bg-gray-50 font-medium">الرئيسية</a>
    <a href="/products" class="block py-2.5 px-3 rounded-lg hover:bg-gray-50 font-medium">المنتجات</a>
    <a href="/services" class="block py-2.5 px-3 rounded-lg hover:bg-gray-50 font-medium">خدماتنا</a>
    <a href="/projects" class="block py-2.5 px-3 rounded-lg hover:bg-gray-50 font-medium">مشاريعنا</a>
    <a href="/about" class="block py-2.5 px-3 rounded-lg hover:bg-gray-50 font-medium">من نحن</a>
    <a href="/contact" class="block py-2.5 px-3 rounded-lg hover:bg-gray-50 font-medium">اتصل بنا</a>
    <a href="/quote" class="block py-2.5 px-3 rounded-lg bg-accent-500 text-white text-center font-bold">اطلب عرض سعر</a>
  </nav>
</header>

<!-- Search overlay -->
<div id="search-overlay" class="hidden fixed inset-0 bg-black/60 z-[60] pt-24 px-4">
  <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
    <div class="flex items-center gap-3 p-4 border-b">
      <i class="fas fa-magnifying-glass text-gray-400"></i>
      <input id="search-input" type="text" placeholder="ابحث عن منتج أو خدمة أو مشروع..." class="flex-1 outline-none text-lg" autocomplete="off">
      <button id="search-close" class="text-gray-400 hover:text-gray-700" aria-label="إغلاق"><i class="fas fa-xmark text-xl"></i></button>
    </div>
    <div id="search-results" class="max-h-96 overflow-y-auto p-4 text-gray-500 text-center">اكتب للبحث...</div>
  </div>
</div>

<main id="page-main">
${content}
</main>

<!-- Footer -->
<footer class="bg-brand-900 text-gray-300 mt-20">
  <div class="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-4 gap-10">
    <section id="footer-about">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center"><i class="fas fa-building-columns text-accent-400"></i></div>
        <span class="font-black text-white text-lg">سرايا الألمنيوم</span>
      </div>
      <p class="text-sm leading-relaxed" data-setting="tagline_ar">...</p>
      <div class="flex gap-3 mt-5" id="footer-social"></div>
    </section>
    <nav id="footer-links">
      <h3 class="text-white font-bold mb-4">روابط سريعة</h3>
      <ul class="space-y-2.5 text-sm">
        <li><a href="/products" class="hover:text-accent-400 transition">المنتجات</a></li>
        <li><a href="/services" class="hover:text-accent-400 transition">خدماتنا</a></li>
        <li><a href="/projects" class="hover:text-accent-400 transition">مشاريعنا</a></li>
        <li><a href="/about" class="hover:text-accent-400 transition">من نحن</a></li>
        <li><a href="/quote" class="hover:text-accent-400 transition">طلب عرض سعر</a></li>
      </ul>
    </nav>
    <nav id="footer-categories">
      <h3 class="text-white font-bold mb-4">منتجاتنا</h3>
      <ul class="space-y-2.5 text-sm" id="footer-cats-list"></ul>
    </nav>
    <section id="footer-contact">
      <h3 class="text-white font-bold mb-4">تواصل معنا</h3>
      <ul class="space-y-3 text-sm">
        <li class="flex gap-3"><i class="fas fa-location-dot text-accent-400 mt-1"></i><span data-setting="address_ar">...</span></li>
        <li class="flex gap-3"><i class="fas fa-phone text-accent-400 mt-1"></i><span dir="ltr" data-setting="phone">...</span></li>
        <li class="flex gap-3"><i class="fas fa-envelope text-accent-400 mt-1"></i><span data-setting="email">...</span></li>
        <li class="flex gap-3"><i class="fas fa-clock text-accent-400 mt-1"></i><span data-setting="working_hours_ar">...</span></li>
      </ul>
    </section>
  </div>
  <div class="border-t border-white/10 py-5 text-center text-sm">
    © <span id="footer-year"></span> سرايا الألمنيوم — جميع الحقوق محفوظة
  </div>
</footer>

<!-- WhatsApp float -->
<a id="whatsapp-float" href="#" target="_blank" rel="noopener"
   class="fixed bottom-6 left-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition hover:scale-110"
   aria-label="واتساب">
  <i class="fab fa-whatsapp"></i>
</a>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/app.js"></script>
</body>
</html>`
}
