// Public page content blocks (rendered client-side via /static/app.js + API)

export const homePage = `
<!-- Hero slider -->
<section id="hero-section" class="relative h-[520px] md:h-[600px] bg-slate-900 overflow-hidden">
  <div id="hero-slides" class="absolute inset-0"></div>
  <div class="absolute inset-0 bg-gradient-to-l from-slate-900/90 via-slate-900/60 to-transparent"></div>
  <div class="relative max-w-7xl mx-auto px-4 h-full flex items-center">
    <div class="max-w-2xl text-white" id="hero-content">
      <h1 id="hero-title" class="text-3xl md:text-5xl font-black leading-tight mb-5">حلول ألمنيوم متكاملة</h1>
      <p id="hero-subtitle" class="text-lg md:text-xl text-slate-200 leading-8 mb-8"></p>
      <div class="flex flex-wrap gap-4">
        <a id="hero-cta" href="/quote" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-lg text-lg transition">اطلب عرض سعر</a>
        <a href="tel:" id="hero-call" class="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-bold px-8 py-4 rounded-lg text-lg transition border border-white/30">
          <i class="fas fa-phone ml-2"></i> اتصل بنا
        </a>
      </div>
    </div>
  </div>
  <div id="hero-dots" class="absolute bottom-6 right-1/2 translate-x-1/2 flex gap-2"></div>
</section>

<!-- Categories -->
<section id="categories-section" class="max-w-7xl mx-auto px-4 py-16">
  <header class="text-center mb-10">
    <h2 class="text-3xl font-black text-slate-800 mb-3">أقسام منتجاتنا</h2>
    <p class="text-slate-500">تشكيلة شاملة من أعمال الألمنيوم والزجاج لكل احتياجاتك</p>
  </header>
  <div id="categories-grid" class="grid grid-cols-2 md:grid-cols-4 gap-5"></div>
</section>

<!-- Featured products -->
<section id="featured-section" class="bg-white py-16">
  <div class="max-w-7xl mx-auto px-4">
    <header class="flex justify-between items-end mb-10">
      <div>
        <h2 class="text-3xl font-black text-slate-800 mb-2">منتجات مميزة</h2>
        <p class="text-slate-500">الأكثر طلباً من عملائنا</p>
      </div>
      <a href="/products" class="text-amber-600 font-bold hover:text-amber-700">كل المنتجات <i class="fas fa-arrow-left mr-1"></i></a>
    </header>
    <div id="featured-grid" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </div>
</section>

<!-- Why us -->
<section id="why-us-section" class="max-w-7xl mx-auto px-4 py-16">
  <header class="text-center mb-10">
    <h2 class="text-3xl font-black text-slate-800 mb-3">لماذا سرايا الألمنيوم؟</h2>
  </header>
  <div id="why-us-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
</section>

<!-- Featured projects -->
<section id="home-projects-section" class="bg-slate-900 py-16">
  <div class="max-w-7xl mx-auto px-4">
    <header class="flex justify-between items-end mb-10">
      <div>
        <h2 class="text-3xl font-black text-white mb-2">من مشاريعنا</h2>
        <p class="text-slate-400">أعمال نفخر بها في مختلف مناطق المملكة</p>
      </div>
      <a href="/projects" class="text-amber-400 font-bold hover:text-amber-300">كل المشاريع <i class="fas fa-arrow-left mr-1"></i></a>
    </header>
    <div id="home-projects-grid" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </div>
</section>

<!-- CTA -->
<section id="cta-section" class="max-w-7xl mx-auto px-4 py-16">
  <div class="bg-gradient-to-l from-amber-500 to-amber-600 rounded-3xl p-10 md:p-14 text-center text-white">
    <h2 class="text-3xl md:text-4xl font-black mb-4">جاهز تبدأ مشروعك؟</h2>
    <p class="text-lg mb-8 text-amber-50">احصل على استشارة ورفع مقاسات مجاني وعرض سعر خلال 24 ساعة</p>
    <a href="/quote" class="inline-block bg-white text-amber-600 font-black px-10 py-4 rounded-xl text-lg hover:bg-slate-100 transition">اطلب عرض سعر مجاني</a>
  </div>
</section>
`

export const productsPage = `
<section id="products-header" class="bg-slate-900 py-14">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h1 class="text-4xl font-black mb-3">منتجاتنا</h1>
    <p class="text-slate-400">تشكيلة متكاملة من أعمال الألمنيوم والزجاج بجودة عالمية</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-10">
  <div class="flex flex-col md:flex-row gap-4 mb-8">
    <div class="relative flex-1">
      <i class="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
      <input id="search-input" type="search" placeholder="ابحث عن منتج..."
        class="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none bg-white">
    </div>
    <div id="category-filters" class="flex gap-2 flex-wrap"></div>
  </div>
  <div id="products-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
  <div id="products-empty" class="hidden text-center py-20 text-slate-400">
    <i class="fas fa-box-open text-5xl mb-4"></i>
    <p class="text-lg">لا توجد منتجات مطابقة</p>
  </div>
</section>
`

export const productDetailPage = `
<section id="product-detail" class="max-w-7xl mx-auto px-4 py-10">
  <nav id="breadcrumb" class="text-sm text-slate-500 mb-6" aria-label="مسار التنقل"></nav>
  <div id="product-loading" class="text-center py-20 text-slate-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>
  <div id="product-content" class="hidden grid lg:grid-cols-2 gap-10"></div>
  <section id="related-section" class="hidden mt-16">
    <h2 class="text-2xl font-black text-slate-800 mb-6">منتجات مشابهة</h2>
    <div id="related-grid" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </section>
</section>
`

export const servicesPage = `
<section id="services-header" class="bg-slate-900 py-14">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h1 class="text-4xl font-black mb-3">خدماتنا</h1>
    <p class="text-slate-400">من الاستشارة الأولى حتى الضمان.. نرافقك في كل خطوة</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-12">
  <div id="services-list" class="space-y-8"></div>
</section>
`

export const projectsPage = `
<section id="projects-header" class="bg-slate-900 py-14">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h1 class="text-4xl font-black mb-3">مشاريعنا</h1>
    <p class="text-slate-400">أعمال ننجزها بفخر في مختلف مناطق المملكة</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-10">
  <div id="project-filters" class="flex gap-2 flex-wrap justify-center mb-10">
    <button data-type="" class="proj-filter proj-filter-active">الكل</button>
    <button data-type="residential" class="proj-filter">سكني</button>
    <button data-type="commercial" class="proj-filter">تجاري</button>
    <button data-type="governmental" class="proj-filter">حكومي</button>
  </div>
  <div id="projects-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
</section>
`

export const aboutPage = `
<section id="about-header" class="bg-slate-900 py-14">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h1 class="text-4xl font-black mb-3">من نحن</h1>
    <p class="text-slate-400">قصة سرايا الألمنيوم</p>
  </div>
</section>
<section class="max-w-5xl mx-auto px-4 py-14">
  <article class="bg-white rounded-2xl shadow-sm p-8 md:p-12">
    <div class="flex items-center gap-4 mb-8">
      <span class="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-amber-400 text-3xl"><i class="fas fa-border-all"></i></span>
      <div>
        <h2 class="text-2xl font-black text-slate-800">سرايا الألمنيوم</h2>
        <p class="text-slate-500">SARAYA ALUMINUM</p>
      </div>
    </div>
    <p id="about-text" class="text-lg leading-9 text-slate-600"></p>
  </article>
  <div id="about-stats" class="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
    <div class="bg-white rounded-2xl p-6 text-center shadow-sm"><p class="text-3xl font-black text-amber-500 mb-1">+15</p><p class="text-slate-500 text-sm">سنة خبرة</p></div>
    <div class="bg-white rounded-2xl p-6 text-center shadow-sm"><p class="text-3xl font-black text-amber-500 mb-1">+500</p><p class="text-slate-500 text-sm">مشروع منجز</p></div>
    <div class="bg-white rounded-2xl p-6 text-center shadow-sm"><p class="text-3xl font-black text-amber-500 mb-1">+40</p><p class="text-slate-500 text-sm">موظف وفني</p></div>
    <div class="bg-white rounded-2xl p-6 text-center shadow-sm"><p class="text-3xl font-black text-amber-500 mb-1">15</p><p class="text-slate-500 text-sm">سنة ضمان</p></div>
  </div>
  <div id="why-us-about" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10"></div>
</section>
`

export const contactPage = `
<section id="contact-header" class="bg-slate-900 py-14">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h1 class="text-4xl font-black mb-3">اتصل بنا</h1>
    <p class="text-slate-400">نسعد بتواصلك معنا في أي وقت</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10">
  <div id="contact-info" class="space-y-5">
    <h2 class="text-2xl font-black text-slate-800 mb-6">معلومات التواصل</h2>
    <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <span class="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl"><i class="fas fa-phone"></i></span>
      <div><p class="text-sm text-slate-500">الجوال</p><p class="font-bold" data-setting="phone" dir="ltr">...</p></div>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <span class="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl"><i class="fab fa-whatsapp"></i></span>
      <div><p class="text-sm text-slate-500">واتساب</p><a id="contact-whatsapp" href="#" target="_blank" class="font-bold text-green-600">تواصل عبر واتساب</a></div>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <span class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl"><i class="fas fa-envelope"></i></span>
      <div><p class="text-sm text-slate-500">البريد الإلكتروني</p><p class="font-bold" data-setting="email" dir="ltr">...</p></div>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <span class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl"><i class="fas fa-location-dot"></i></span>
      <div><p class="text-sm text-slate-500">العنوان</p><p class="font-bold" data-setting="address_ar">...</p></div>
    </div>
    <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <span class="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xl"><i class="fas fa-clock"></i></span>
      <div><p class="text-sm text-slate-500">ساعات العمل</p><p class="font-bold" data-setting="working_hours_ar">...</p></div>
    </div>
  </div>
  <div>
    <h2 class="text-2xl font-black text-slate-800 mb-6">أرسل رسالة</h2>
    <form id="contact-form" class="bg-white rounded-2xl p-8 shadow-sm space-y-5">
      <div>
        <label class="block font-bold mb-2 text-sm" for="cf-name">الاسم <span class="text-red-500">*</span></label>
        <input id="cf-name" required minlength="2" maxlength="100" class="form-input" placeholder="اسمك الكريم">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="cf-phone">رقم الجوال <span class="text-red-500">*</span></label>
        <input id="cf-phone" required dir="ltr" pattern="[0-9+\\s()-]{8,20}" class="form-input" placeholder="05xxxxxxxx">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="cf-email">البريد الإلكتروني</label>
        <input id="cf-email" type="email" maxlength="100" class="form-input" placeholder="example@email.com">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="cf-message">رسالتك <span class="text-red-500">*</span></label>
        <textarea id="cf-message" required rows="5" maxlength="2000" class="form-input" placeholder="اكتب رسالتك هنا..."></textarea>
      </div>
      <button type="submit" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl transition">
        <i class="fas fa-paper-plane ml-2"></i> إرسال الرسالة
      </button>
      <p id="cf-result" class="hidden text-center font-bold"></p>
    </form>
  </div>
</section>
`

export const quotePage = `
<section id="quote-header" class="bg-slate-900 py-14">
  <div class="max-w-7xl mx-auto px-4 text-center text-white">
    <h1 class="text-4xl font-black mb-3">اطلب عرض سعر</h1>
    <p class="text-slate-400">عبّي النموذج وبنتواصل معك خلال 24 ساعة</p>
  </div>
</section>
<section class="max-w-3xl mx-auto px-4 py-14">
  <form id="quote-form" class="bg-white rounded-2xl p-8 md:p-10 shadow-sm space-y-6">
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <label class="block font-bold mb-2 text-sm" for="qf-name">الاسم <span class="text-red-500">*</span></label>
        <input id="qf-name" required minlength="2" maxlength="100" class="form-input" placeholder="اسمك الكريم">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="qf-phone">رقم الجوال <span class="text-red-500">*</span></label>
        <input id="qf-phone" required dir="ltr" pattern="[0-9+\\s()-]{8,20}" class="form-input" placeholder="05xxxxxxxx">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="qf-email">البريد الإلكتروني</label>
        <input id="qf-email" type="email" maxlength="100" class="form-input" placeholder="اختياري">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="qf-city">المدينة</label>
        <input id="qf-city" maxlength="60" class="form-input" placeholder="الرياض، جدة...">
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="qf-project-type">نوع المشروع</label>
        <select id="qf-project-type" class="form-input">
          <option value="">اختر...</option>
          <option value="سكني">سكني (فيلا / شقة)</option>
          <option value="تجاري">تجاري (مكاتب / محلات)</option>
          <option value="حكومي">حكومي</option>
          <option value="أخرى">أخرى</option>
        </select>
      </div>
      <div>
        <label class="block font-bold mb-2 text-sm" for="qf-product">المنتج المطلوب</label>
        <select id="qf-product" class="form-input"><option value="">اختر المنتج...</option></select>
      </div>
    </div>
    <div>
      <label class="block font-bold mb-2 text-sm" for="qf-message">تفاصيل الطلب</label>
      <textarea id="qf-message" rows="5" maxlength="2000" class="form-input" placeholder="اذكر التفاصيل: المقاسات التقريبية، عدد النوافذ/الأبواب، الألوان المفضلة..."></textarea>
    </div>
    <button type="submit" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl text-lg transition">
      <i class="fas fa-file-invoice ml-2"></i> إرسال طلب عرض السعر
    </button>
    <p id="qf-result" class="hidden text-center font-bold"></p>
  </form>
</section>
`
