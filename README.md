# RELIGION ARCHIVE

[فتح الموقع على GitHub Pages](https://techaura26-max.github.io/religion-archive/)

موقع عربي لتصفح المواضيع والمقالات المنشورة. لوحة الإدارة منفصلة ومحميّة بحساب Google المالك. ملفات المحتوى والصور بتتخزّن داخل مجلد خاص في Google Drive.

## الربط لأول مرة

استخدم نفس حساب Google في المشروعين. في محرّر [Google Apps Script](https://script.google.com/home)، الزر **+** بجانب **Files** بيسمح تضيف ملف **Script** أو **HTML**. لما تنسخ الملفات من GitHub، افتح كل ملف واضغط **Raw** أو **Copy raw file**.

### 1. نشر لوحة الإدارة الخاصة

1. افتح [Google Apps Script](https://script.google.com/home) واضغط **New project**. سمِّه `Religion Archive – Admin`.
2. انسخ محتوى [Admin.gs](google/Admin.gs) داخل `Code.gs` الموجود. أضف ملف **Script** باسم `Storage` والصق محتوى [Storage.gs](google/Storage.gs). أضف ملف **HTML** باسم `Admin` والصق محتوى [Admin.html](google/Admin.html). احفظ الملفات.
3. من قائمة الدوال فوق المحرّر اختَر `setupArchive` واضغط **Run**. وافق على الوصول لحساب Drive بعد التأكد إن المشروع تابع إلك. الدالة بتنشئ مجلداً خاصاً اسمه **RELIGION ARCHIVE**. من **Execution log** انسخ القيمة بعد `ARCHIVE_ROOT_ID =`. إذا سكّرت السجل، شغّل الدالة مرة ثانية حتى تطبع نفس المعرّف.
4. اختَر **Deploy → New deployment → Web app**. اضبط **Execute as** على **Me**، و**Who has access** على **Only myself**. اضغط **Deploy** وانسخ رابط **Web app URL** المنتهي بـ `/exec`. هذا رابط الإدارة.
5. افتح الرابط بنفس حساب Google. المفروض تشوف لوحة الإدارة. افتحه بنافذة خاصة بدون الحساب وتأكد إن Google بطلب تسجيل الدخول أو برفض الوصول.

### 2. نشر خدمة القراءة العامة

1. اعمل **New project** ثاني وسمِّه `Religion Archive – Public`.
2. الصق [Public.gs](google/Public.gs) داخل `Code.gs`، وأضف ملف **Script** باسم `Storage` والصق فيه [Storage.gs](google/Storage.gs).
3. افتح **Project Settings** وفعّل **Show "appsscript.json" manifest file in editor**. ارجع للمحرّر واستبدل محتوى `appsscript.json` بمحتوى [Public.appsscript.json](google/Public.appsscript.json) حتى يطلب المشروع صلاحية قراءة Drive فقط.
4. في **Project Settings → Script properties → Add script property**. اكتب الاسم `ARCHIVE_ROOT_ID` والقيمة اللي نسختها من سجل مشروع الإدارة. اضغط **Save script properties**. خلّي صلاحية المجلد والملفات **Restricted** داخل Drive.
5. اختَر **Deploy → New deployment → Web app**. اضبط **Execute as** على **Me**، و**Who has access** على **Anyone** حتى يقدر الزائر يقرأ بدون حساب. وافق على صلاحية Drive وانسخ رابط `/exec` الثاني. إذا خيار **Anyone** مش ظاهر بحساب عمل أو مدرسة، جرّب حساب Google شخصي أو ارجع لمسؤول الحساب.

### 3. ربط الرابطين بالموقع

1. في [config.js على GitHub](https://github.com/techaura26-max/religion-archive/edit/main/config.js)، الصق رابط خدمة القراءة بين علامتي الاقتباس بجانب `publicUrl`، ورابط لوحة الإدارة بجانب `adminUrl`. اترك صيغة الملف زي ما هي واضغط **Commit changes**. هذول رابطين فقط. صلاحية الإدارة مرتبطة بحساب Google. معرّف مجلد Drive ينحفظ داخل إعدادات Apps Script.
2. انتظر تشغيل **pages build and deployment** يخلص من تبويب **Actions**، وافتح الموقع. إذا ما ظهر رابط الإدارة مباشرة، حدّث الصفحة. عند تعديل كود Apps Script مستقبلاً، اختَر **Deploy → Manage deployments → Edit → New version** للمحافظة على نفس عنوان الخدمة.

### 4. جرّب من جهازين

1. افتح **الإدارة** وسجّل دخول بالحساب المالك. اختار ديانة واضغط **موضوع جديد**، اكتب اسمه، واضغط **حفظ الموضوع**.
2. افتح **مقال جديد**. اكتب عنوان وفقرة، وبعدين الصق Screenshot بـ **Ctrl + V** داخل المقال. ممكن تسحب الصورة أو تختار **رفع صور**. الصور بتنضاف بعد الكتلة النشطة، وفيك ترتّبها بالأسهم. لتنسيق فقرة أو إضافة رابط، ظلّل النص واستخدم شريط الأدوات.
3. استنّى رسالة الرفع تختفي. احفظ **مسودة** وتأكد إنها بترجع لما تعيد فتح المقال في الإدارة. اضغط **نشر** ثم **فتح المقال**. جرّب نفس الرابط بنافذة خاصة أو جهاز ثاني. تأكد إن النص والصورة بيظهروا بدون حساب، وإن البحث بلاقي كلمة من نص المقال.
4. حفظ مسودة جديدة لمقال منشور بخلي النسخة المنشورة السابقة ظاهرة. زر **إخفاء** بسحبها من الموقع وبحفظ آخر التعديلات كمسودة. حذف الموضوع بطلب نقل أو حذف مقالاته أول. الصور غير المستخدمة بتظل محفوظة داخل مجلد `images` الخاص، وحذف مقال ما بمسح صوره من Drive.

## البنية والحدود

- GitHub Pages يقدّم الواجهة الثابتة. روابط المقالات تستخدم معرّفاً ثابتاً في الرابط، فإعادة تسمية المقال أو نقله ما بتغيّر رابطه.
- كل موضوع ومقال إله ملف JSON مستقل في Drive. سجل المقال يحتوي على مسودة ونسخة منشورة منفصلتين. قوائم القراءة والبحث تفحص سجلات Drive، وبتعرض النسخ المنشورة فقط. البحث يشمل العنوان ونص الفقرات والمراجع ووصف الصور. تكلفة الفحص تزيد مع حجم الأرشيف.
- خدمة القراءة بتجلب صور Drive من خلال Apps Script، وتتحقق إن كل صورة مشار إليها بالنسخة المنشورة للمقال المطلوب. ما فيها عمليات كتابة. المحتوى العام يمر عبر JSONP ضمن روابط نشر Google المحددة. روابط معاينة Drive مؤقتة. تحميل الصور مؤجّل لحد ما يقرب الزائر منها، وبحد أقصى ثلاث طلبات متزامنة لكل صفحة.
- كل صورة مخزّنة إلها حد 3 ميغابايت، والمحرّر بحاول يصغّر PNG وJPEG وWebP الأكبر تلقائياً. سجل المقال له حد 1 ميغابايت للنص المنسّق والمسودة والنسخة المنشورة مع بعض. الصور خارج سجل النص. مساحة Drive مشتركة مع خدمات Google الأخرى. كثرة الزيارات ممكن توصل لحصص Apps Script وDrive؛ إذا زاد الضغط، ممكن نقل تقديم الصور لخدمة تخزين عامة مع الإبقاء على Drive للنسخ الأصلية.
- وثائق الخدمات: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)، [نشر Apps Script](https://developers.google.com/apps-script/guides/web)، [الحصص](https://developers.google.com/apps-script/guides/services/quotas)، [Content Service](https://developers.google.com/apps-script/guides/content)، [روابط Drive](https://developers.google.com/workspace/drive/api/reference/rest/v3/files).

## مصادر صور البطاقات

- [مسجد السلطان أحمد](https://commons.wikimedia.org/wiki/File:Sultan_Ahmed_Mosque_Interior,_2024.jpg) — Julian Lupyan، [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- [كاتدرائية سالزبري](https://commons.wikimedia.org/wiki/File:Salisbury_Cathedral_Nave,_Wiltshire,_UK_-_Diliff.jpg) — Diliff، [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). صُغّرت وحُوّلت إلى WebP، وتُعرض بقصّ ولون معدّلين. نسخة الصورة ضمن المشروع تحت الرخصة نفسها.
- [الكنيس الإسباني في براغ](https://commons.wikimedia.org/wiki/File:Spanish_synagogue_interior.jpg) — Thomazzo، ملكية عامة.
