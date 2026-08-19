// Admin panel shell (SPA driven by /static/admin.js)
export const adminPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة التحكم | سرايا الألمنيوم</title>
  <meta name="robots" content="noindex, nofollow">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: {
        colors: { brand: { 50:'#f0f7fa',100:'#dcebf2',500:'#1a6a8a',600:'#15586f',700:'#124a5e',800:'#0e3a4a',900:'#0a2c39' },
                  accent: { 400:'#e8b64c', 500:'#d9a53a', 600:'#c08f28' } },
        fontFamily: { sans: ['Tajawal','sans-serif'] }
      } }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
</head>
<body class="bg-gray-100 font-sans text-gray-800">

<!-- Login screen -->
<div id="login-screen" class="hidden min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-900 to-brand-700">
  <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-building-columns text-accent-400 text-2xl"></i>
      </div>
      <h1 class="text-2xl font-black text-brand-800">لوحة تحكم سرايا الألمنيوم</h1>
      <p class="text-gray-500 text-sm mt-1">سجّل الدخول للمتابعة</p>
    </div>
    <form id="login-form" class="space-y-4">
      <div>
        <label class="block text-sm font-bold mb-1.5" for="login-username">اسم المستخدم</label>
        <input id="login-username" required autocomplete="username" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="login-password">كلمة المرور</label>
        <input id="login-password" type="password" required autocomplete="current-password" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <button type="submit" class="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition">
        <i class="fas fa-right-to-bracket ml-2"></i>دخول
      </button>
      <div id="login-error" class="hidden bg-red-50 text-red-700 text-sm rounded-lg p-3 text-center"></div>
    </form>
  </div>
</div>

<!-- Admin app -->
<div id="admin-app" class="hidden min-h-screen flex">
  <!-- Sidebar -->
  <aside id="admin-sidebar" class="w-64 bg-brand-900 text-gray-300 flex flex-col fixed inset-y-0 right-0 z-40 transform transition-transform lg:translate-x-0 translate-x-full lg:static">
    <div class="p-5 border-b border-white/10 flex items-center gap-3">
      <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><i class="fas fa-building-columns text-accent-400"></i></div>
      <div>
        <div class="font-black text-white">سرايا الألمنيوم</div>
        <div class="text-xs text-gray-400">لوحة التحكم</div>
      </div>
    </div>
    <nav id="admin-nav" class="flex-1 p-3 space-y-1 overflow-y-auto">
      <button data-view="dashboard" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-gauge w-5"></i>الرئيسية</button>
      <button data-view="leads" data-perm="leads" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-inbox w-5"></i>الطلبات <span id="leads-badge" class="hidden mr-auto bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full"></span></button>
      <button data-view="products" data-perm="products" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-box w-5"></i>المنتجات</button>
      <button data-view="categories" data-perm="categories" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-layer-group w-5"></i>التصنيفات</button>
      <button data-view="services" data-perm="services" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-handshake w-5"></i>الخدمات</button>
      <button data-view="projects" data-perm="projects" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-diagram-project w-5"></i>المشاريع</button>
      <button data-view="home" data-perm="home" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-house w-5"></i>الصفحة الرئيسية</button>
      <button data-view="settings" data-perm="settings" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-gear w-5"></i>الإعدادات</button>
      <button data-view="users" data-perm="users" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-users-gear w-5"></i>المستخدمون</button>
      <button data-view="audit" data-perm="audit" class="admin-nav-btn w-full text-right px-4 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-3"><i class="fas fa-clock-rotate-left w-5"></i>سجل النشاط</button>
    </nav>
    <div class="p-4 border-t border-white/10">
      <a href="/" target="_blank" class="block text-center text-sm text-gray-400 hover:text-white mb-3"><i class="fas fa-arrow-up-right-from-square ml-1"></i>عرض الموقع</a>
      <button id="logout-btn" class="w-full bg-white/10 hover:bg-red-500/80 text-white py-2 rounded-lg text-sm font-bold transition"><i class="fas fa-right-from-bracket ml-2"></i>تسجيل الخروج</button>
    </div>
  </aside>

  <!-- Main -->
  <div class="flex-1 flex flex-col min-w-0">
    <header class="bg-white shadow-sm px-5 py-4 flex items-center justify-between sticky top-0 z-30">
      <div class="flex items-center gap-3">
        <button id="sidebar-toggle" class="lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100"><i class="fas fa-bars"></i></button>
        <h1 id="view-title" class="text-lg font-black text-brand-800">الرئيسية</h1>
      </div>
      <div class="flex items-center gap-3">
        <span id="user-name" class="text-sm font-bold hidden sm:block"></span>
        <span id="user-role" class="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-full font-bold"></span>
        <button id="change-pass-btn" class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500" title="تغيير كلمة المرور"><i class="fas fa-key"></i></button>
      </div>
    </header>
    <main id="admin-content" class="flex-1 p-5 overflow-y-auto"></main>
  </div>
</div>

<!-- Modal -->
<div id="modal-overlay" class="hidden fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
  <div id="modal-box" class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
    <div class="flex items-center justify-between p-5 border-b">
      <h2 id="modal-title" class="font-black text-lg text-brand-800"></h2>
      <button id="modal-close" class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500"><i class="fas fa-xmark"></i></button>
    </div>
    <div id="modal-body" class="p-5 max-h-[70vh] overflow-y-auto"></div>
  </div>
</div>

<!-- Toast -->
<div id="toast" class="hidden fixed bottom-6 right-6 z-[60] bg-brand-900 text-white px-6 py-3.5 rounded-xl shadow-2xl font-bold"></div>

<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script src="/static/admin.js"></script>
</body>
</html>`
