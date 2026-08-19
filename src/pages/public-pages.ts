// Page content shells - data loaded client-side from API

export const homePage = `
<!-- Hero slider -->
<section id="hero-section" class="relative bg-brand-900 text-white overflow-hidden min-h-[520px] flex items-center">
  <div id="hero-slides" class="absolute inset-0"></div>
  <div class="absolute inset-0 bg-gradient-to-l from-brand-900/95 via-brand-900/70 to-brand-900/30"></div>
  <div class="relative max-w-7xl mx-auto px-4 py-20 w-full">
    <div class="max-w-2xl" id="hero-content">
      <h1 id="hero-title" class="text-4xl md:text-5xl font-black leading-tight mb-5">حلول ألمنيوم متكاملة بجودة عالمية</h1>
      <p id="hero-subtitle" class="text-lg text-gray-200 mb-8 leading-relaxed"></p>
      <div class="flex flex-wrap gap-4">
        <a id="hero-cta" href="/quote" class="bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-3.5 rounded-lg text-lg transition">اطلب عرض سعر</a>
        <a href="/products" class="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-bold px-8 py-3.5 rounded-lg text-lg transition">تصفح المنتجات</a>
      </div>
    </div>
    <div id="hero-dots" class="flex gap-2 mt-10"></div>
  </div>
</section>

<!-- Categories -->
<section id="categories-section" class="max-w-7xl mx-auto px-4 py-16">
  <header class="text-center mb-10">
    <h2 class="text-3xl font-black text-brand-800 mb-3">أقسام منتجاتنا</h2>
    <p class="text-gray-500">تشكيلة شاملة من حلول الألمنيوم والزجاج لكل احتياجاتك</p>
  </header>
  <div id="categories-grid" class="grid grid-cols-2 md:grid-cols-4 gap-5"></div>
</section>

<!-- Featured products -->
<section id="featured-section" class="bg-white py-16">
  <div class="max-w-7xl mx-auto px-4">
    <header class="flex items-end justify-between mb-10">
      <div>
        <h2 class="text-3xl font-black text-brand-800 mb-2">منتجات مميزة</h2>
        <p class="text-gray-500">أكثر منتجاتنا طلباً</p>
      </div>
      <a href="/products" class="text-brand-600 font-bold hover:text-brand-800">عرض الكل <i class="fas fa-arrow-left mr-1"></i></a>
    </header>
    <div id="featured-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </div>
</section>

<!-- Services -->
<section id="services-section" class="max-w-7xl mx-auto px-4 py-16">
  <header class="text-center mb-10">
    <h2 class="text-3xl font-black text-brand-800 mb-3">خدماتنا</h2>
    <p class="text-gray-500">من الاستشارة الأولى حتى ما بعد التسليم</p>
  </header>
  <div id="services-grid" class="grid md:grid-cols-2 lg:grid-cols-4 gap-6"></div>
</section>

<!-- Why us -->
<section id="why-us-section" class="bg-brand-800 text-white py-16">
  <div class="max-w-7xl mx-auto px-4">
    <header class="text-center mb-12">
      <h2 class="text-3xl font-black mb-3">لماذا سرايا الألمنيوم؟</h2>
      <p class="text-gray-300">أرقام وحقائق تتحدث عنا</p>
    </header>
    <div id="why-us-grid" class="grid grid-cols-2 lg:grid-cols-3 gap-8"></div>
  </div>
</section>

<!-- Projects -->
<section id="projects-section" class="max-w-7xl mx-auto px-4 py-16">
  <header class="flex items-end justify-between mb-10">
    <div>
      <h2 class="text-3xl font-black text-brand-800 mb-2">من مشاريعنا</h2>
      <p class="text-gray-500">أعمال ننفذها بفخر في مختلف مناطق المملكة</p>
    </div>
    <a href="/projects" class="text-brand-600 font-bold hover:text-brand-800">كل المشاريع <i class="fas fa-arrow-left mr-1"></i></a>
  </header>
  <div id="home-projects-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
</section>

<!-- CTA -->
<section id="cta-section" class="max-w-7xl mx-auto px-4 pb-4">
  <div class="bg-gradient-to-l from-brand-700 to-brand-900 rounded-3xl px-8 py-14 text-center text-white relative overflow-hidden">
    <div class="relative">
      <h2 class="text-3xl md:text-4xl font-black mb-4">جاهز تبدأ مشروعك؟</h2>
      <p class="text-gray-200 mb-8 max-w-xl mx-auto">أرسل تفاصيل مشروعك واحصل على عرض سعر مفصل خلال 24 ساعة، مع زيارة موقع ورفع مقاسات مجاني</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="/quote" class="bg-accent-500 hover:bg-accent-600 font-bold px-8 py-3.5 rounded-lg text-lg transition">اطلب عرض سعر الآن</a>
        <a id="cta-whatsapp" href="#" target="_blank" rel="noopener" class="bg-green-500 hover:bg-green-600 font-bold px-8 py-3.5 rounded-lg text-lg transition"><i class="fab fa-whatsapp ml-2"></i>واتساب مباشر</a>
      </div>
    </div>
  </div>
</section>
`

export const productsPage = `
<section id="products-header" class="bg-brand-800 text-white py-12">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-3xl font-black mb-2">منتجاتنا</h1>
    <p class="text-gray-300">تشكيلة متكاملة من أنظمة الألمنيوم والزجاج</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-10">
  <div class="flex flex-col lg:flex-row gap-8">
    <aside id="products-sidebar" class="lg:w-64 shrink-0">
      <div class="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
        <h2 class="font-bold text-brand-800 mb-4"><i class="fas fa-filter ml-2"></i>التصنيفات</h2>
        <div id="category-filters" class="space-y-1"></div>
      </div>
    </aside>
    <div class="flex-1">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div id="products-count" class="text-gray-500 text-sm"></div>
        <select id="products-sort" class="bg-white border rounded-lg px-4 py-2 text-sm">
          <option value="default">الترتيب الافتراضي</option>
          <option value="newest">الأحدث</option>
          <option value="name">الاسم</option>
        </select>
      </div>
      <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"></div>
      <div id="products-pagination" class="flex justify-center gap-2 mt-10"></div>
    </div>
  </div>
</section>
`

export const productDetailPage = `
<section id="product-detail" class="max-w-7xl mx-auto px-4 py-10">
  <nav id="product-breadcrumb" class="text-sm text-gray-500 mb-6"></nav>
  <div id="product-content" class="grid lg:grid-cols-2 gap-10">
    <div class="text-center py-20 text-gray-400 lg:col-span-2"><i class="fas fa-spinner fa-spin text-3xl"></i></div>
  </div>
  <section id="related-section" class="mt-16 hidden">
    <h2 class="text-2xl font-black text-brand-800 mb-6">منتجات مشابهة</h2>
    <div id="related-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
  </section>
</section>
`

export const servicesPage = `
<section class="bg-brand-800 text-white py-12">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-3xl font-black mb-2">خدماتنا</h1>
    <p class="text-gray-300">منظومة عمل متكاملة من الاستشارة حتى ما بعد التسليم</p>
  </div>
</section>
<section id="services-list" class="max-w-5xl mx-auto px-4 py-14 space-y-10"></section>
`

export const projectsPage = `
<section class="bg-brand-800 text-white py-12">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-3xl font-black mb-2">مشاريعنا</h1>
    <p class="text-gray-300">أعمال منفذة نفتخر بها في مختلف القطاعات</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-10">
  <div id="project-type-filters" class="flex flex-wrap gap-3 mb-8">
    <button data-type="" class="proj-filter active bg-brand-700 text-white px-5 py-2 rounded-full text-sm font-bold">الكل</button>
    <button data-type="residential" class="proj-filter bg-white px-5 py-2 rounded-full text-sm font-bold border hover:border-brand-500">سكني</button>
    <button data-type="commercial" class="proj-filter bg-white px-5 py-2 rounded-full text-sm font-bold border hover:border-brand-500">تجاري</button>
    <button data-type="governmental" class="proj-filter bg-white px-5 py-2 rounded-full text-sm font-bold border hover:border-brand-500">حكومي</button>
  </div>
  <div id="projects-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
</section>
`

export const projectDetailPage = `
<section id="project-detail" class="max-w-5xl mx-auto px-4 py-10">
  <nav id="project-breadcrumb" class="text-sm text-gray-500 mb-6"></nav>
  <div id="project-content">
    <div class="text-center py-20 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>
  </div>
</section>
`

export const aboutPage = `
<section class="bg-brand-800 text-white py-12">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-3xl font-black mb-2">من نحن</h1>
    <p class="text-gray-300">تعرّف على سرايا الألمنيوم</p>
  </div>
</section>
<section class="max-w-5xl mx-auto px-4 py-14">
  <article class="bg-white rounded-3xl shadow-sm p-8 md:p-12">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-14 h-14 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl flex items-center justify-center">
        <i class="fas fa-building-columns text-accent-400 text-2xl"></i>
      </div>
      <div>
        <h2 class="text-2xl font-black text-brand-800">سرايا الألمنيوم</h2>
        <p class="text-gray-500 text-sm">SARAYA ALUMINUM</p>
      </div>
    </div>
    <p id="about-text" class="text-lg leading-loose text-gray-700"></p>
  </article>
  <div id="about-why-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10"></div>
</section>
`

export const contactPage = `
<section class="bg-brand-800 text-white py-12">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-3xl font-black mb-2">اتصل بنا</h1>
    <p class="text-gray-300">يسعدنا تواصلك معنا في أي وقت</p>
  </div>
</section>
<section class="max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10">
  <div id="contact-info" class="space-y-5">
    <div class="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
      <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-location-dot text-xl"></i></div>
      <div><h3 class="font-bold mb-1">العنوان</h3><p class="text-gray-600 text-sm" data-setting="address_ar"></p></div>
    </div>
    <div class="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
      <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-phone text-xl"></i></div>
      <div><h3 class="font-bold mb-1">الهاتف</h3><p class="text-gray-600 text-sm" dir="ltr" data-setting="phone"></p></div>
    </div>
    <div class="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
      <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-envelope text-xl"></i></div>
      <div><h3 class="font-bold mb-1">البريد الإلكتروني</h3><p class="text-gray-600 text-sm" data-setting="email"></p></div>
    </div>
    <div class="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
      <div class="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0"><i class="fas fa-clock text-xl"></i></div>
      <div><h3 class="font-bold mb-1">ساعات العمل</h3><p class="text-gray-600 text-sm" data-setting="working_hours_ar"></p></div>
    </div>
  </div>
  <div class="bg-white rounded-3xl shadow-sm p-8">
    <h2 class="text-xl font-black text-brand-800 mb-6">أرسل رسالة</h2>
    <form id="contact-form" class="space-y-4">
      <div>
        <label class="block text-sm font-bold mb-1.5" for="cf-name">الاسم *</label>
        <input id="cf-name" name="name" required class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-bold mb-1.5" for="cf-phone">رقم الجوال *</label>
          <input id="cf-phone" name="phone" required dir="ltr" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
        </div>
        <div>
          <label class="block text-sm font-bold mb-1.5" for="cf-email">البريد الإلكتروني</label>
          <input id="cf-email" name="email" type="email" dir="ltr" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
        </div>
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="cf-message">الرسالة *</label>
        <textarea id="cf-message" name="message" rows="5" required class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"></textarea>
      </div>
      <button type="submit" class="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition">
        <i class="fas fa-paper-plane ml-2"></i>إرسال الرسالة
      </button>
      <div id="contact-result" class="hidden"></div>
    </form>
  </div>
</section>
`

export const quotePage = `
<section class="bg-brand-800 text-white py-12">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-3xl font-black mb-2">طلب عرض سعر</h1>
    <p class="text-gray-300">عبّئ النموذج وسيتواصل معك فريق المبيعات خلال 24 ساعة</p>
  </div>
</section>
<section class="max-w-3xl mx-auto px-4 py-14">
  <form id="quote-form" class="bg-white rounded-3xl shadow-sm p-8 space-y-5">
    <div class="grid md:grid-cols-2 gap-5">
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-name">الاسم *</label>
        <input id="qf-name" name="name" required class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-company">اسم الشركة / الجهة</label>
        <input id="qf-company" name="company" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-phone">رقم الجوال *</label>
        <input id="qf-phone" name="phone" required dir="ltr" placeholder="05xxxxxxxx" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-email">البريد الإلكتروني</label>
        <input id="qf-email" name="email" type="email" dir="ltr" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-project-type">نوع المشروع</label>
        <select id="qf-project-type" name="project_type" class="w-full border rounded-lg px-4 py-2.5 bg-white">
          <option value="">اختر...</option>
          <option>فيلا سكنية</option>
          <option>عمارة سكنية</option>
          <option>مبنى تجاري</option>
          <option>برج</option>
          <option>مشروع حكومي</option>
          <option>أخرى</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-city">المدينة</label>
        <input id="qf-city" name="city" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-product">المنتج المطلوب</label>
        <select id="qf-product" name="product_slug" class="w-full border rounded-lg px-4 py-2.5 bg-white">
          <option value="">غير محدد</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-bold mb-1.5" for="qf-units">عدد الوحدات / المساحة التقريبية</label>
        <input id="qf-units" name="units_count" placeholder="مثال: 20 نافذة أو 500 م²" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none">
      </div>
    </div>
    <div>
      <label class="block text-sm font-bold mb-1.5" for="qf-message">تفاصيل إضافية</label>
      <textarea id="qf-message" name="message" rows="4" class="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="اذكر أي تفاصيل تساعدنا في تسعير مشروعك بدقة..."></textarea>
    </div>
    <button type="submit" class="w-full bg-accent-500 hover:bg-accent-600 text-white font-black py-3.5 rounded-lg text-lg transition">
      <i class="fas fa-file-invoice ml-2"></i>إرسال طلب عرض السعر
    </button>
    <div id="quote-result" class="hidden"></div>
  </form>
</section>
`
