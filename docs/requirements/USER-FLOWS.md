# تدفقات المستخدم الرئيسية (User Flows Specification)

## 1. نظرة عامة

تحدد هذه الوثيقة تدفقات العمليات البرمجية والتفاعلية لكل من الزائر (Visitor) ومدير النظام (Admin) على منصة الموقع الشخصي المتقدم.

---

## 2. التدفق الأول: الزائر يقرأ مقالاً ويتواصل مع المطور (Visitor Post Reading & Contact Flow)

```mermaid
sequenceDiagram
    autonumber
    actor V as الزائر (Visitor)
    participant B as متصفح الزائر (Browser)
    participant S as سيرفر Next.js (App Router)
    participant DB as قاعدة البيانات (Database)

    V->>B: يفتح صفحة المدونة العامة (/blog)
    B->>S: طلب GET /blog
    S->>DB: الاستعلام عن المقالات المنشورة فقط (Status: PUBLISHED)
    DB-->>S: إرجاع قائمة المقالات المنشورة
    S-->>B: رندر وتوليد صفحة المدونة (RTL)
    V->>B: ينقر على مقال تقني مخصص (/blog/[slug])
    B->>S: طلب GET /blog/[slug]
    S->>DB: جلب تفاصيل المقال، جدول المحتويات والوسوم
    DB-->>S: بيانات المقال
    S-->>B: عرض المقال مع Syntax Highlighting وتوليد OpenGraph Meta
    V->>B: ينقر على زر التواصل أو يفتح (/contact)
    V->>B: يملأ نموذج التواصل (الاسم، البريد، الرسالة) ويدخل إرسال
    B->>S: طلب POST /api/contact (يتضمن بيانات النموذج + Honeypot Guard)
    alt التحقق فاشل (Spam/Rate Limit Exceeded)
        S-->>B: إرجاع استجابة 400/429 (رفض الطلب)
        B-->>V: عرض رسالة تنبيه بالأيرور
    else التحقق ناجح (Valid Submission)
        S->>DB: حفظ الرسالة في جدول الرسائل (Status: UNREAD)
        DB-->>S: تأكيد الحفظ
        S-->>B: استجابة 200 OK (تم الإرسال بنجاح)
        B-->>V: عرض شاشة تأكيد تم استلام رسالتك
    end
```

---

## 3. التدفق الثاني: الأدمن ينشئ ويراجع وينشر مقالاً (Admin Post Creation & Publishing Flow)

```mermaid
sequenceDiagram
    autonumber
    actor A as مدير النظام (Admin)
    actor V as الزائر (Visitor)
    participant B as لوحة التحكم (Admin UI)
    participant S as API / Server Actions
    participant DB as قاعدة البيانات (Database)

    A->>B: تسجيل الدخول وفتح (/admin/posts/new)
    B->>A: عرض محرر المقالات (Markdown / Metadata Settings)
    A->>B: إدخال العنوان، النطاق، الوسوم، ونص المقال
    A->>B: اختيار خيار "حفظ كـ مسودة (Save Draft)"
    B->>S: طلب POST /api/admin/posts (Status: DRAFT)
    S->>DB: كتابة المقال + إدراج سجل تدقيق (Audit Log: CREATE_POST_DRAFT)
    DB-->>S: نجاح الحفظ
    S-->>B: إرجاع تم الحفظ كـ مسودة
    Note over A,V: المقال المسودة غير مرئي مطلقاً للزوار العامة
    A->>B: مراجعة المقال ثم الضغط على "نشر (Publish)"
    B->>S: طلب PATCH /api/admin/posts/[id] (Status: PUBLISHED)
    S->>DB: تحديث الحالة إلى PUBLISHED + إدراج سجل تدقيق (Audit Log: PUBLISH_POST)
    DB-->>S: تأكيد التحديث
    S-->>B: إرجاع تم نشر المقال بنجاح
    V->>S: طلب فتح صفحة المدونة (/blog)
    S->>DB: الاستعلام عن المقالات
    DB-->>S: إرجاع المقال الجديد المنشور
    S-->>V: ظهور المقال الجديد للعامة فوراً
```

---

## 4. التدفق الثالث: الأدمن يرفع أصلاً صورياً ويربطه بمشروع أو مقال (Media Upload & Attachment Flow)

```mermaid
sequenceDiagram
    autonumber
    actor A as مدير النظام (Admin)
    actor V as الزائر (Visitor)
    participant B as لوحة التحكم (Admin UI)
    participant S as سيرفر الميديا والمعالجة (Media Handler)
    participant FS as مخزن الأصول (Storage / Public Assets)
    participant DB as قاعدة البيانات (Database)

    A->>B: فتح مكتبة الوسائط (/admin/media) والضغط على رفع أصل جديد
    A->>B: اختيار صورة أو مجسم (.webp, .png, .glb)
    B->>S: طلب POST /api/admin/media (Upload Payload)
    S->>S: ضغط الصور وتوليد صيغة WebP وأبعاد متجاوبة
    S->>FS: حفظ الأصول المعالجة في مجزن الأصول
    FS-->>S: إرجاع المسار النهائي ورابط URL للأصل
    S->>DB: حفظ بيانات الأصل في جدول الميديا + (Audit Log: UPLOAD_MEDIA)
    DB-->>S: تأكيد الحفظ
    S-->>B: إرجاع تم رفع الملف بنجاح وتحديث الشبكة
    A->>B: فتح صفحة تعديل مشروع (/admin/projects/edit/[id])
    A->>B: اختيار الصورة المرفوعة كـ غلاف للمشروع (Cover Image)
    B->>S: طلب PATCH /api/admin/projects/[id] (ربط معرف الميديا للمشروع)
    S->>DB: تحديث بيانات المشروع بالمعرف الجديد
    DB-->>S: تأكيد التحديث
    S-->>B: تم ربط الغلاف بالمشروع بنجاح
```
