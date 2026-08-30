# مواصفة مخطط قاعدة البيانات (Database Schema Specification)

| البند                       | التفاصيل                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| **المعرف**                  | `SCHEMA-001-PORTFOLIO-PLATFORM`                                           |
| **الإصدار**                 | `1.0.0`                                                                   |
| **الحالة**                  | **DRAFT — Under COO Review**                                              |
| **التاريخ**                 | 30 أغسطس 2026                                                             |
| **قاعدة البيانات المقترحة** | PostgreSQL 16+                                                            |
| **الوثائق المكملة**         | [مخطط العلاقات ERD](./ERD.md) · [دورة حياة البيانات](./DATA-LIFECYCLE.md) |

---

## 1. مبادئ نموذج البيانات (Data Model Principles)

1. **تسميات موحدة (snake_case)**: استخدام نمط `snake_case` لجميع أسماء الجداول والأعمدة والمؤشرات.
2. **المفاتيح الرئيسية (UUID Primary Keys)**: استخدام `uuid` فريد يولد عبر `gen_random_uuid()` كمفتاح رئيسي لكل الجداول لتجنب التخمين وهجمات Enumeration.
3. **التوقيع الزمني المشترك (Timestamps)**: استخدام نوع البيانات `timestamptz` (Timestamp with Time Zone) لكافة التواريخ.
4. **سياسة الأرشفة فقط (Archive-Only Policy)**: لا يوجد حذف نهائي (Hard Delete) في المرحلة الأولى لأي كيان (مقال، مشروع، وسيط، رسالة). تضاف أعمدة `archived_at` و`archived_by_user_id` للكيانات القابلة للأرشفة.
5. **سجلات تدقيق غير قابلة للتعديل (Immutable Append-Only Audit Logs)**: جدول `audit_logs` يقبل الإضافة فقط (INSERT) ويمنع التعديل (UPDATE) أو الحذف (DELETE).
6. **منع العلاقات متعددة الأشكال للوسائط (No Polymorphic Media Relations)**: استخدام جداول ربط صريحة (`post_media_assets`, `project_media_assets`) بدلاً من العلاقات البوليمورفية لضمان سلامة العلاقات المرجعية (Foreign Keys).
7. **عزل ثنائيات الوسائط (Metadata-Only Media Storage)**: يخزن جدول `media_assets` البيانات الوصفية ومفاتيح الكائنات في مخزن R2 فقط؛ ولا تُخزن أي ثنائيات ملفات في DB.

---

## 2. المواصفة التفصيلية للجداول (Table-by-Table Specification)

### 2.1 جدول المستخدمين (`users`)

يخزن حساب مدير النظام (مدير واحد في المرحلة الأولى).

| اسم العمود      | النوع          | إلزامي؟ | القيود                                     | الوصف                              |
| --------------- | -------------- | ------- | ------------------------------------------ | ---------------------------------- |
| `id`            | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للحساب               |
| `email`         | `varchar(255)` | نعم     | `UNIQUE`, `NOT NULL`                       | البريد الإلكتروني للمدير           |
| `password_hash` | `varchar(255)` | نعم     | `NOT NULL`                                 | كلمة المرور المشفرة بخوارزمية آمنة |
| `full_name`     | `varchar(100)` | نعم     | `NOT NULL`                                 | الاسم الكامل للمدير                |
| `role`          | `varchar(20)`  | نعم     | `NOT NULL`, `DEFAULT 'ADMIN'`              | دور المستخدم (ADMIN حصراً)         |
| `created_at`    | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء                      |
| `updated_at`    | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ آخر تحديث                    |

- **المؤشرات (Indexes)**: `idx_users_email` على العمود `email`.

---

### 2.2 جدول التصنيفات (`categories`)

تصنيفات المقالات التقنية.

| اسم العمود    | النوع         | إلزامي؟ | القيود                                     | الوصف                               |
| ------------- | ------------- | ------- | ------------------------------------------ | ----------------------------------- |
| `id`          | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للتصنيف               |
| `name`        | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم التصنيف (مثال: "تطبيقات وحلول") |
| `slug`        | `varchar(60)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف للتصنيف               |
| `description` | `text`        | لا      | -                                          | وصف اختياري للتصنيف                 |
| `created_at`  | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء                       |
| `updated_at`  | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث                       |

- **المؤشرات (Indexes)**: `idx_categories_slug` على العمود `slug`.

---

### 2.3 جدول المقالات (`posts`)

المقالات التقنية المنشورة والمسودات والمؤرشفة.

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                             | الوصف                       |
| --------------------- | -------------- | ------- | ------------------------------------------------------------------ | --------------------------- |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | المعرف الفريد للمقال        |
| `title`               | `varchar(200)` | نعم     | `NOT NULL`                                                         | عنوان المقال                |
| `slug`                | `varchar(220)` | نعم     | `UNIQUE`, `NOT NULL`                                               | الرابط اللطيف للمقال        |
| `summary`             | `text`         | نعم     | `NOT NULL`                                                         | ملخص قصير للعرض والمشاركات  |
| `content_markdown`    | `text`         | نعم     | `NOT NULL`                                                         | محتوى المقال بصيغة Markdown |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))` | حالة المقال                 |
| `category_id`         | `uuid`         | نعم     | `FOREIGN KEY (categories.id) ON DELETE RESTRICT`                   | التصنيف الرئيسي             |
| `author_id`           | `uuid`         | نعم     | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                        | الكاتب (الأدمن)             |
| `published_at`        | `timestamptz`  | لا      | -                                                                  | تاريخ النشر الإشهاري        |
| `archived_at`         | `timestamptz`  | لا      | -                                                                  | تاريخ الأرشفة إن وجد        |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                        | المستخدم الذي قام بالأرشفة  |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ الإنشاء               |
| `updated_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ آخر تحديث             |

- **المؤشرات (Indexes)**:
  - `idx_posts_slug` على `slug`
  - `idx_posts_status_published_at` على (`status`, `published_at DESC`)
  - `idx_posts_category_id` على `category_id`

---

### 2.4 جدول الوسوم (`tags`)

الوسوم المستخدمة لربط المقالات.

| اسم العمود   | النوع         | إلزامي؟ | القيود                                     | الوصف                          |
| ------------ | ------------- | ------- | ------------------------------------------ | ------------------------------ |
| `id`         | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للوسم            |
| `name`       | `varchar(40)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم الوسم (مثال: "TypeScript") |
| `slug`       | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف للوسم            |
| `created_at` | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء                  |

- **المؤشرات (Indexes)**: `idx_tags_slug` على `slug`.

---

### 2.5 جدول الربط بين المقالات والوسوم (`post_tags`)

| اسم العمود | النوع  | إلزامي؟ | القيود                                     | الوصف       |
| ---------- | ------ | ------- | ------------------------------------------ | ----------- |
| `post_id`  | `uuid` | نعم     | `FOREIGN KEY (posts.id) ON DELETE CASCADE` | معرف المقال |
| `tag_id`   | `uuid` | نعم     | `FOREIGN KEY (tags.id) ON DELETE RESTRICT` | معرف الوسم  |

- **المفتاح الرئيسي الأولي المركب**: `PRIMARY KEY (post_id, tag_id)`.
- **المؤشرات (Indexes)**: `idx_post_tags_tag_id` على `tag_id`.

---

### 2.6 جدول التقنيات (`technologies`)

التقنيات المستخدمة في المشاريع المعروضة.

| اسم العمود   | النوع         | إلزامي؟ | القيود                                     | الوصف                         |
| ------------ | ------------- | ------- | ------------------------------------------ | ----------------------------- |
| `id`         | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للتقنية         |
| `name`       | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم التقنية (مثال: "Next.js") |
| `slug`       | `varchar(60)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف للتقنية         |
| `icon_name`  | `varchar(50)` | لا      | -                                          | اسم الأيقونة في الواجهة       |
| `created_at` | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء                 |

- **المؤشرات (Indexes)**: `idx_technologies_slug` على `slug`.

---

### 2.7 جدول المشاريع (`projects`)

| اسم العمود             | النوع          | إلزامي؟ | القيود                                                             | الوصف                             |
| ---------------------- | -------------- | ------- | ------------------------------------------------------------------ | --------------------------------- |
| `id`                   | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | المعرف الفريد للمشروع             |
| `title`                | `varchar(200)` | نعم     | `NOT NULL`                                                         | عنوان المشروع                     |
| `slug`                 | `varchar(220)` | نعم     | `UNIQUE`, `NOT NULL`                                               | الرابط اللطيف للمشروع             |
| `summary`              | `text`         | نعم     | `NOT NULL`                                                         | ملخص موجز للمشروع                 |
| `description_markdown` | `text`         | نعم     | `NOT NULL`                                                         | تفاصيل المشروع وتحدياته الهندسية  |
| `live_url`             | `varchar(500)` | لا      | -                                                                  | رابط المعاينة الحية               |
| `github_url`           | `varchar(500)` | لا      | -                                                                  | رابط المستودع                     |
| `is_featured`          | `boolean`      | نعم     | `NOT NULL`, `DEFAULT false`                                        | هل المشروع مميز بالصفحة الرئيسية؟ |
| `status`               | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))` | حالة المشروع                      |
| `published_at`         | `timestamptz`  | لا      | -                                                                  | تاريخ النشر                       |
| `archived_at`          | `timestamptz`  | لا      | -                                                                  | تاريخ الأرشفة                     |
| `archived_by_user_id`  | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                        | من قام بأرشفة المشروع             |
| `created_at`           | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ الإنشاء                     |
| `updated_at`           | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ التحديث                     |

- **المؤشرات (Indexes)**:
  - `idx_projects_slug` على `slug`
  - `idx_projects_featured_status` على (`is_featured`, `status`)

---

### 2.8 جدول الربط بين المشاريع والتقنيات (`project_technologies`)

| اسم العمود      | النوع  | إلزامي؟ | القيود                                             | الوصف        |
| --------------- | ------ | ------- | -------------------------------------------------- | ------------ |
| `project_id`    | `uuid` | نعم     | `FOREIGN KEY (projects.id) ON DELETE CASCADE`      | معرف المشروع |
| `technology_id` | `uuid` | نعم     | `FOREIGN KEY (technologies.id) ON DELETE RESTRICT` | معرف التقنية |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (project_id, technology_id)`.
- **المؤشرات (Indexes)**: `idx_project_technologies_tech_id` على `technology_id`.

---

### 2.9 جدول الوسائط والملفات (`media_assets`)

خزن البيانات الوصفية ومفاتيح الكائنات في Cloudflare R2 حصراً.

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                                   | الوصف                                                |
| --------------------- | -------------- | ------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                               | المعرف الفريد للأصل                                  |
| `filename`            | `varchar(255)` | نعم     | `NOT NULL`                                                               | الاسم الأصلي للملف                                   |
| `storage_key`         | `varchar(500)` | نعم     | `UNIQUE`, `NOT NULL`                                                     | مفتاح الكائن الفريد في مخزن R2                       |
| `public_url`          | `varchar(500)` | نعم     | `NOT NULL`                                                               | الرابط العام لعرض الأصل                              |
| `mime_type`           | `varchar(100)` | نعم     | `NOT NULL`                                                               | نوع الوسيط (مثال: `image/webp`, `model/gltf-binary`) |
| `file_size_bytes`     | `bigint`       | نعم     | `NOT NULL`                                                               | حجم الملف بالبايت                                    |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('PENDING_UPLOAD', 'ACTIVE', 'ARCHIVED'))` | حالة الأصل                                           |
| `uploaded_by_user_id` | `uuid`         | نعم     | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                              | الأدمن الذي طلب الرفع                                |
| `archived_at`         | `timestamptz`  | لا      | -                                                                        | تاريخ الأرشفة إن وجد                                 |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                              | الأدمن الذي أرشف الأصل                               |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                  | تاريخ الطلب والإنشاء                                 |

- **المؤشرات (Indexes)**:
  - `idx_media_assets_storage_key` على `storage_key`
  - `idx_media_assets_status` على `status`

---

### 2.10 جدول الربط بين المقالات والوسائط (`post_media_assets`)

| اسم العمود       | النوع     | إلزامي؟ | القيود                                             | الوصف                        |
| ---------------- | --------- | ------- | -------------------------------------------------- | ---------------------------- |
| `post_id`        | `uuid`    | نعم     | `FOREIGN KEY (posts.id) ON DELETE CASCADE`         | معرف المقال                  |
| `media_asset_id` | `uuid`    | نعم     | `FOREIGN KEY (media_assets.id) ON DELETE RESTRICT` | معرف الأصل الوسيط            |
| `is_cover`       | `boolean` | نعم     | `NOT NULL`, `DEFAULT false`                        | هل هذا الأصل هو غلاف المقال؟ |
| `display_order`  | `integer` | نعم     | `NOT NULL`, `DEFAULT 0`                            | ترتيب العرض داخل المقال      |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (post_id, media_asset_id)`.
- **المؤشرات (Indexes)**: `idx_post_media_asset_id` على `media_asset_id`.

---

### 2.11 جدول الربط بين المشاريع والوسائط (`project_media_assets`)

| اسم العمود       | النوع     | إلزامي؟ | القيود                                             | الوصف                         |
| ---------------- | --------- | ------- | -------------------------------------------------- | ----------------------------- |
| `project_id`     | `uuid`    | نعم     | `FOREIGN KEY (projects.id) ON DELETE CASCADE`      | معرف المشروع                  |
| `media_asset_id` | `uuid`    | نعم     | `FOREIGN KEY (media_assets.id) ON DELETE RESTRICT` | معرف الأصل الوسيط             |
| `is_cover`       | `boolean` | نعم     | `NOT NULL`, `DEFAULT false`                        | هل هذا الأصل هو غلاف المشروع؟ |
| `display_order`  | `integer` | نعم     | `NOT NULL`, `DEFAULT 0`                            | ترتيب العرض معرض الصور        |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (project_id, media_asset_id)`.
- **المؤشرات (Indexes)**: `idx_project_media_asset_id` على `media_asset_id`.

---

### 2.12 جدول رسائل التواصل (`contact_messages`)

صندوق الوارد الداخلي لرسائل زوار الموقع.

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                         | الوصف                                          |
| --------------------- | -------------- | ------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                     | المعرف الفريد للرسالة                          |
| `sender_name`         | `varchar(100)` | نعم     | `NOT NULL`                                                     | اسم مرسل الرسالة                               |
| `sender_email`        | `varchar(255)` | نعم     | `NOT NULL`                                                     | البريد الإلكتروني للمرسل                       |
| `subject`             | `varchar(200)` | نعم     | `NOT NULL`                                                     | موضوع الرسالة                                  |
| `message_body`        | `text`         | نعم     | `NOT NULL`                                                     | نص الرسالة                                     |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED'))` | حالة الرسالة في الصندوق                        |
| `ip_address_hash`     | `varchar(64)`  | نعم     | `NOT NULL`                                                     | Hash مجهول للهوية لمنع السبام ورصد Rate Limits |
| `archived_at`         | `timestamptz`  | لا      | -                                                              | تاريخ الأرشفة                                  |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                    | الأدمن الذي أرشف الرسالة                       |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                        | تاريخ وصول الرسالة                             |

- **المؤشرات (Indexes)**:
  - `idx_contact_messages_status_created_at` على (`status`, `created_at DESC`)

---

### 2.13 جدول سجلات التدقيق الإداري (`audit_logs`)

جدول الإضافة فقط (Append-Only) لتسجيل كل عملية إدارية بشكل آمن.

| اسم العمود      | النوع          | إلزامي؟ | القيود                                      | الوصف                                                                                          |
| --------------- | -------------- | ------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`            | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`  | المعرف الفريد للسجل                                                                            |
| `actor_user_id` | `uuid`         | نعم     | `FOREIGN KEY (users.id) ON DELETE RESTRICT` | الأدمن منفذ العملية                                                                            |
| `action`        | `varchar(100)` | نعم     | `NOT NULL`                                  | نوع العملية (مثال: `CREATE_POST`, `PUBLISH_POST`, `ARCHIVE_PROJECT`, `GENERATE_PRESIGNED_URL`) |
| `entity_type`   | `varchar(50)`  | نعم     | `NOT NULL`                                  | اسم الكيان المـتأثر (مثال: `POST`, `PROJECT`, `MEDIA_ASSET`, `CONTACT_MESSAGE`)                |
| `entity_id`     | `uuid`         | لا      | -                                           | المعرف الفريد للكيان المـتأثر                                                                  |
| `metadata_json` | `jsonb`        | نعم     | `NOT NULL`, `DEFAULT '{}'`                  | بيانات وصفية آمنة بلا أسرار أو كلمات مرور                                                      |
| `created_at`    | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`     | التوقيع الزمني للعملية                                                                         |

- **المؤشرات (Indexes)**:
  - `idx_audit_logs_actor_created_at` على (`actor_user_id`, `created_at DESC`)
  - `idx_audit_logs_entity` على (`entity_type`, `entity_id`)

---

## 3. الأنواع المحدودة ودورة الحياة (Enums & Lifecycle States)

1. **`Post / Project Status`**: `DRAFT` ←→ `PUBLISHED` → `ARCHIVED`.
2. **`Media Asset Status`**: `PENDING_UPLOAD` → `ACTIVE` → `ARCHIVED`.
3. **`Contact Message Status`**: `UNREAD` → `READ` → `ARCHIVED`.
4. **`Audit Log`**: `APPEND_ONLY` (لا توجد حالة، يقبل الإضافة فقط).

---

## 4. سياسة الأرشفة والاحتفاظ بالبيانات (Archive Policy & Retention Behavior)

- **الأرشفة الناعمة (Soft Archive)**: تحول جميع عمليات الإلغاء والإنهاء إلى حالة `ARCHIVED` مع تسجيل `archived_at` و`archived_by_user_id`.
- **منع الحذف النهائي**: يمنع تنفيذ استعلامات `DELETE` في المرحلة الأولى لأي جدول محتوى (`posts`, `projects`, `media_assets`, `contact_messages`).
- **حصانة سجلات التدقيق**: جدول `audit_logs` محمي بقواعد DB يمنع تعديله أو حذف سجلاته نهائياً.

---

## 5. قواعد سلامة البيانات والخصوصية (Data Integrity & Privacy)

1. **عدم كشف IP صريح**: تخزين عنوان IP للزائر كـ Hash مجهول الهوية (`sha256(ip + salt)`) لحماية الخصوصية ومنع السبام.
2. **عزل الثنائيات**: عدم قبول أي ملفات ثنائية داخل DB تحت أي ظرف.
3. **القيود المرجعية الصارمة (Foreign Key Constraints)**: استخدام `ON DELETE RESTRICT` يمنع كسر العلاقات المرجعية عند أرشفة أي عنصر.

---

## 6. استراتيجية الهجرة وبوابات الجودة لجداول البيانات (Planned Quality Gates)

سيتم فحص مخطط قاعدة البيانات في مرحلة التنفيذ القادمة عبر بوابات الجودة المخططة التالية:

1. **Migration-From-Zero**: اختبار تطبيق ملفات الهجرة من الصفر على قاعدة بيانات فارغة بنجاح.
2. **Schema Drift Check**: التأكد من مطابقة مخطط قاعدة البيانات الفعلي مع كود ORM بدون انحراف.
3. **Foreign Key Integrity Verification**: فحوصات تكامل المفاتيح الأجنبية وقيود `ON DELETE`.
4. **Archive Behavior Test**: إثبات تحول العناصر لحالة `ARCHIVED` بدلاً من حذفها من السجلات.
5. **Immutable Audit Log Guard Test**: اختبار محاولة التعديل أو الحذف لجدول `audit_logs` والتأكد من رفض قاعدة البيانات العملية.
