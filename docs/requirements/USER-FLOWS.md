# تدفقات المستخدم الرئيسية (User Flows Specification)

## 1. نظرة عامة

تحدد هذه الوثيقة تدفقات العمليات البرمجية والتفاعلية لكل من الزائر (Visitor) ومدير النظام (Admin) على منصة الموقع الشخصي المتقدم، مع الالتزام التام بنمط الرفع المباشر عبر Presigned URLs وحماية الجلسات الإدارية وإعادة تنشيط الكاش (Cache Revalidation).

---

## 2. التدفق الأول: الزائر يقرأ مقالاً ويتواصل مع المطور (Visitor Post Reading & Contact Flow)

```mermaid
sequenceDiagram
    autonumber
    actor V as الزائر (Visitor)
    participant B as متصفح الزائر (Browser)
    participant S as معالج الطلبات (Framework Application Server)
    participant DB as قاعدة البيانات (PostgreSQL)

    V->>B: يفتح صفحة المدونة العامة (/blog)
    B->>S: طلب استعراض المدونة
    S->>DB: الاستعلام عن المقالات المنشورة (PUBLISHED)
    DB-->>S: إرجاع قائمة المقالات المنشورة
    S-->>B: رندر وتوليد صفحة المدونة (RTL)

    alt طلب مقال غير موجود
        V->>B: ينقر على رابط مقال غير موجود (/blog/invalid-slug)
        B->>S: طلب استعراض المقال
        S->>DB: البحث عن المقال عبر slug
        DB-->>S: عدم وجود المقال
        S-->>B: إطلاق حالة notFound() لعرض واجهة app/not-found.tsx
    else طلب مقال موجود
        V->>B: ينقر على مقال تقني مخصص (/blog/[slug])
        B->>S: طلب استعراض المقال
        S->>DB: جلب تفاصيل المقال، جدول المحتويات والوسوم
        DB-->>S: بيانات المقال
        S-->>B: عرض المقال مع Syntax Highlighting و Dynamic OpenGraph Meta
    end

    V->>B: ينتقل إلى صفحة التواصل (/contact) ويملأ النموذج
    B->>S: إرسال نموذج التواصل (بيانات النموذج + Honeypot Guard)
    alt التحقق فاشل (Spam Guard / Rate Limit Exceeded)
        S-->>B: رفض الطلب مع رسالة موحدة (400/429)
        B-->>V: عرض رسالة خطأ تنبيهية
    else التحقق ناجح (Valid Submission)
        S->>DB: حفظ الرسالة في جدول الرسائل (Status: UNREAD)
        DB-->>S: تأكيد الحفظ
        S-->>B: تأكيد نجاح الإرسال (200 OK)
        B-->>V: عرض شاشة التأكيد بنجاح التواصل
    end
```

---

## 3. التدفق الثاني: مصادقة الأدمن، إنشاء المقال ونشره مع تنشيط الكاش (Admin Auth, Post Lifecycle & Revalidation)

```mermaid
sequenceDiagram
    autonumber
    actor A as مدير النظام (Admin)
    actor V as الزائر (Visitor)
    participant B as لوحة التحكم (Admin UI)
    participant S as معالج المصادقة والعمليات (App Handler)
    participant DB as قاعدة البيانات (PostgreSQL)

    %% Unauthenticated Access Attempt
    A->>B: محاولة فتح مسار محمي (/admin/posts) دون تسجيل دخول
    B->>S: التحقق من الجلسة الإدارية
    S-->>B: جلسة غير موجودة / غير صالحة -> إعادة توجيه تلقائي إلى (/admin/login)

    %% Login Flow & Failures
    A->>B: إدخال اسم المستخدم وكلمة المرور
    B->>S: طلب مصادقة الدخول
    alt بيانات الدخول خاطئة
        S->>DB: تسجيل محاولة فاشلة + حصر المعدل (Rate Limit)
        S-->>B: إرجاع رسالة خطأ موحدة دون كشف وجود الحساب ("بيانات الدخول غير صحيحة")
        B-->>A: عرض رسالة التنبيه
    else بيانات الدخول صحيحة
        S->>DB: كتابة سجل تدقيق (Audit Log: ADMIN_LOGIN_SUCCESS)
        S-->>B: إنشاء جلسة إدارية محمية (HTTP-only Secure Cookie)
        B-->>A: التوجيه لصفحة لوحة التحكم (/admin)
    end

    %% Post Creation & Publishing
    A->>B: إدخال بيانات مقال جديد واختيار "حفظ كـ مسودة"
    B->>S: طلب إنشاء مقال (يتضمن توقيع الجلسة الإدارية)
    S->>S: التحقق من الجلسة الصالحة للعميل
    S->>DB: كتابة المقال بحالة DRAFT + (Audit Log: CREATE_POST_DRAFT) ذرياً
    DB-->>S: تأكيد الحفظ
    S-->>B: إرجاع تم الحفظ كـ مسودة بنجاح

    A->>B: مراجعة المقال والضغط على "نشر (Publish)"
    B->>S: طلب نشر المقال (مشفوعاً بالجلسة الإدارية)
    S->>DB: تحديث الحالة إلى PUBLISHED + (Audit Log: PUBLISH_POST) ذرياً
    DB-->>S: تأكيد التحديث
    S->>S: إطلاق ميزة تنشيط الكاش (Cache Revalidation for /blog & /blog/[slug])
    S-->>B: إرجاع تم نشر المقال وإعادة تنشيط الكاش بنجاح

    V->>S: زائر يطلب صفحة المدونة العامة (/blog)
    S-->>V: عرض المقال الجديد المنشور فوراً بفضل Revalidation
```

---

## 4. التدفق الثالث: رفع الميديا المباشر عبر Presigned URL والربط بالمحتوى (Direct Presigned Media Upload Flow)

```mermaid
sequenceDiagram
    autonumber
    actor A as مدير النظام (Admin)
    participant B as لوحة التحكم (Admin UI)
    participant S as معالج التطبيق (App Route Handler)
    participant ST as مخزن الأصول المباشر (Cloudflare R2 / S3)
    participant DB as قاعدة البيانات (PostgreSQL)

    A->>B: اختيار ملف ميديا للرفع (تحديد الاسم، الحجم، نوع MIME)
    B->>S: طلب الحصول على Presigned Upload URL
    S->>S: التحقق من الجلسة الإدارية المحمية
    alt نوع الملف أو الحجم غير مسموح (Invalid MIME / Oversized)
        S-->>B: رفض الطلب بحالة خطأ (Invalid File Metadata)
        B-->>A: عرض تنبيه بنوع الملف أو الحجم غير المسموح
    else الملف مطابق للشروط
        S->>ST: إنشاء رابط رفع مؤقت محدد بمدة زمنية (Short-lived Presigned URL)
        ST-->>S: إرجاع Presigned URL + Object Key
        S-->>B: إرجاع Presigned Upload URL للعميل
    end

    %% Direct Binary Upload from Browser to Storage
    B->>ST: رفع الثنائيات (Binary File) مباشرة عبر Presigned URL
    alt فشل الرفع إلى المخزن أو انتهاء صلاحية الرابط (Expired Presigned URL / Upload Failure)
        ST-->>B: خطأ الرفع إلى المخزن (403/500 Storage Error)
        B-->>A: إظهار فشل رفع الملف وإمكانية الإعادة
    else نجاح الرفع المباشر
        ST-->>B: نجاح الرفع للمخزن (200 OK)
    end

    %% Confirmation & Database Registration
    B->>S: تأكيد اكتمال الرفع بإرسال Object Key وبيانات الميديا
    S->>ST: التحقق من وجود الكائن وملكيته في المخزن
    ST-->>S: تأكيد وجود الملف
    S->>DB: حفظ سجل الميديا (URL + Object Key + Metadata) + (Audit Log: UPLOAD_MEDIA) ذرياً
    DB-->>S: تأكيد الكتابة في DB
    S-->>B: تم تسجيل الميديا بنجاح في النظام

    %% Linking Media to Project or Post
    A->>B: اختيار الميديا كغلاف لمشروع أو مقال
    B->>S: طلب ربط الميديا بالمورد (مشفوعاً بالجلسة الإدارية)
    S->>DB: تحديث القيد في قاعدة البيانات + (Audit Log: LINK_MEDIA_TO_RESOURCE)
    DB-->>S: تأكيد الربط
    S-->>B: تم تحديث غلاف المورد بنجاح
```
