// Admin panel SPA shell (logic in /static/admin.js)

export const adminPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>لوحة التحكم | سرايا الألمنيوم</title>
  <meta name="robots" content="noindex, nofollow">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  <link href="/static/style.css" rel="stylesheet">
  <script>
    tailwind.config = { theme: { extend: { fontFamily: { sans: ['Tajawal', 'sans-serif'] } } } }
  </script>
</head>
<body class="bg-slate-100 font-sans text-slate-800">

  <!-- Login screen -->
  <section id="login-screen" class="hidden min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <span class="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 items-center justify-center text-amber-400 text-3xl mb-4"><i class="fas fa-border-all"></i></span>
        <h1 class="text-2xl font-black text-slate-800">لوحة تحكم سرايا الألمنيوم</h1>
        <p class="text-slate-500 text-sm mt-1">سجّل الدخول للمتابعة</p>
      </div>
      <form id="login-form" class="bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <div>
          <label class="block font-bold mb-2 text-sm" for="login-username">اسم المستخدم</label>
          <input id="login-username" required autocomplete="username" class="form-input" dir="ltr">
        </div>
        <div>
          <label class="block font-bold mb-2 text-sm" for="login-password">كلمة المرور</label>
          <input id="login-password" type="password" required autocomplete="current-password" class="form-input" dir="ltr">
        </div>
        <button type="submit" id="login-btn" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3.5 rounded-xl transition">
          <i class="fas fa-right-to-bracket ml-2"></i> تسجيل الدخول
        </button>
        <p id="login-error" class="hidden text-center text-red-600 font-bold text-sm"></p>
      </form>
    </div>
  </section>

  <!-- Admin layout -->
  <div id="admin-layout" class="hidden min-h-screen">
    <!-- Sidebar -->
    <aside id="admin-sidebar" class="fixed top-0 right-0 h-full w-64 bg-slate-900 text-slate-300 z-40 transform transition-transform lg:translate-x-0 translate-x-full">
      <div class="p-5 border-b border-slate-800 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-amber-400"><i class="fas fa-border-all"></i></span>
        <div>
          <p class="font-black text-white text-sm">سرايا الألمنيوم</p>
          <p class="text-xs text-slate-500">لوحة التحكم</p>
        </div>
      </div>
      <nav id="admin-nav" class="p-3 space-y-1">
        <button data-view="dashboard" class="admin-nav-btn admin-nav-active"><i class="fas fa-gauge-high w-5"></i> الرئيسية</button>
        <button data-view="leads" class="admin-nav-btn"><i class="fas fa-inbox w-5"></i> الطلبات <span id="leads-badge" class="hidden mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"></span></button>
        <button data-view="products" class="admin-nav-btn"><i class="fas fa-boxes-stacked w-5"></i> المنتجات</button>
        <button data-view="categories" class="admin-nav-btn"><i class="fas fa-layer-group w-5"></i> التصنيفات</button>
        <button data-view="services" class="admin-nav-btn"><i class="fas fa-screwdriver-wrench w-5"></i> الخدمات</button>
        <button data-view="projects" class="admin-nav-btn"><i class="fas fa-building w-5"></i> المشاريع</button>
        <button data-view="settings" class="admin-nav-btn" data-roles="super_admin,content_manager"><i class="fas fa-gear w-5"></i> إعدادات الموقع</button>
        <button data-view="users" class="admin-nav-btn" data-roles="super_admin"><i class="fas fa-users-gear w-5"></i> المستخدمون</button>
        <button data-view="audit" class="admin-nav-btn" data-roles="super_admin"><i class="fas fa-clipboard-list w-5"></i> سجل النشاط</button>
      </nav>
      <div class="absolute bottom-0 right-0 left-0 p-4 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <div>
            <p id="current-user-name" class="text-white font-bold text-sm"></p>
            <p id="current-user-role" class="text-xs text-slate-500"></p>
          </div>
          <button id="logout-btn" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-red-600 text-white transition" title="خروج"><i class="fas fa-right-from-bracket"></i></button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="lg:mr-64">
      <header class="bg-white shadow-sm sticky top-0 z-30 px-5 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button id="sidebar-toggle" class="lg:hidden w-10 h-10 rounded-lg bg-slate-100"><i class="fas fa-bars"></i></button>
          <h1 id="view-title" class="text-lg font-black">الرئيسية</h1>
        </div>
        <a href="/" target="_blank" class="text-sm text-slate-500 hover:text-amber-600"><i class="fas fa-arrow-up-left-from-square ml-1"></i> عرض الموقع</a>
      </header>
      <main id="admin-content" class="p-5 md:p-8"></main>
    </div>
  </div>

  <!-- Modal -->
  <div id="modal-overlay" class="hidden fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4">
    <div id="modal-box" class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
      <div class="flex justify-between items-center p-5 border-b border-slate-100">
        <h2 id="modal-title" class="font-black text-lg"></h2>
        <button id="modal-close" class="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200"><i class="fas fa-xmark"></i></button>
      </div>
      <div id="modal-body" class="p-5"></div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="hidden fixed bottom-6 right-1/2 translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg z-[60] font-bold text-sm"></div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/admin.js"></script>
</body>
</html>`
