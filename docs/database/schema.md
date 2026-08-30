# مواصفة مخطط قاعدة البيانات (Database Schema Specification)

| البند                       | التفاصيل                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| **المعرف**                  | `SCHEMA-001-PORTFOLIO-PLATFORM`                                           |
| **الإصدار**                 | `1.1.0`                                                                   |
| **الحالة**                  | **DRAFT — Under COO Review**                                              |
| **التاريخ**                 | 30 أغسطس 2026                                                             |
| **قاعدة البيانات المقترحة** | PostgreSQL 16+ (مع تفعيل إضافة `pgcrypto`)                                |
| **الوثائق المكملة**         | [مخطط العلاقات ERD](./ERD.md) · [دورة حياة البيانات](./DATA-LIFECYCLE.md) |

---

## 1. مبادئ نموذج البيانات وتوسيعات النظام (Data Model Principles & Extensions)

1. **إضافة pgcrypto**: تتطلب دالة `gen_random_uuid()` تفعيل إضافة `pgcrypto` في أول ملف هجرة (Migration 0001): `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.
2. **تسميات موحدة (snake_case)**: استخدام نمط `snake_case` لجميع أسماء الجداول والأعمدة والمؤشرات.
3. **المفاتيح الرئيسية (UUID Primary Keys)**: استخدام `uuid` فريد يولد عبر `gen_random_uuid()` كمفتاح رئيسي لكافة الجداول.
4. **التوقيع الزمني المشترك (Timestamps)**: استخدام نوع البيانات `timestamptz` لكافة التواريخ، مع ضمان وجود `updated_at` في كافة الكائنات ذات الحالات المتغيرة (`media_assets`, `contact_messages`, `posts`, `projects`).
5. **سياسة الأرشفة فقط ومنع الحذف (Archive-Only Policy)**: لا يوجد حذف نهائي (Hard Delete) لأي كيان (مقال، مشروع، وسيط، رسالة). تضاف أعمدة `archived_at` و`archived_by_user_id` للكيانات القابلة للأرشفة، مع استبعاد الكيانات المؤرشفة تلقائياً من الاستعلامات العامة.
6. **تقييد الحساب الإداري الموحد (Single-Admin Constraint)**: فرض قيد فرادة على عمود `role` بقيمة `'ADMIN'` صراحة لمنع إنشاء أكثر من حساب أدمن واحد في المرحلة الأولى.
7. **سلامة رفع الوسائط بدون ثنائيات (Metadata-Only Media Lifecycle)**: استخدام جدول `media_assets` نفسه لسجل الرفع المعلق (`PENDING_UPLOAD`) بدلاً من السجلات المؤقتة، مع جعل `public_url` قابلاً لـ `NULL` لحين تأكيد الرفع التام.
8. **سجلات تدقيق غير قابلة للتعديل (Immutable Append-Only Audit Logs)**: جدول `audit_logs` يقبل الإضافة فقط (`INSERT`) ويمنع التعديل (`UPDATE`) أو الحذف (`DELETE`).
9. **منع التكرار في الفهارس (No Redundant Indexes)**: الاعتماد على فهارس `UNIQUE` التلقائية وعدم إنشاء فهارس ثانوية مكررة للأعمدة الفريدة مثل `email` و`slug` و`storage_key`.
10. **حماية الخصوصية بـ HMAC-SHA256**: تشفير عنوان IP للزائر باستخدام `HMAC-SHA256(normalized_ip, server_managed_secret)` حيث يُدار المفتاح السري خارج قاعدة البيانات والمستودع.

---

## 2. المواصفة التفصيلية للجداول (Table-by-Table Specification)

### 2.1 جدول المستخدمين (`users`)

يخزن حساب مدير النظام، مع فرض قيد الفرادة على دور `'ADMIN'` لضمان حساب واحد فقط في المرحلة الأولى.

| اسم العمود      | النوع          | إلزامي؟ | القيود                                                                  | الوصف                              |
| --------------- | -------------- | ------- | ----------------------------------------------------------------------- | ---------------------------------- |
| `id`            | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                              | المعرف الفريد للحساب               |
| `email`         | `varchar(255)` | نعم     | `UNIQUE`, `NOT NULL`                                                    | البريد الإلكتروني للمدير           |
| `password_hash` | `varchar(255)` | نعم     | `NOT NULL`                                                              | كلمة المرور المشفرة بخوارزمية آمنة |
| `full_name`     | `varchar(100)` | نعم     | `NOT NULL`                                                              | الاسم الكامل للمدير                |
| `role`          | `varchar(20)`  | نعم     | `NOT NULL`, `DEFAULT 'ADMIN'`, `CHECK (role = 'ADMIN')`, `UNIQUE(role)` | دور المستخدم (أدمن واحد فريد)      |
| `created_at`    | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                 | تاريخ الإنشاء                      |
| `updated_at`    | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                 | تاريخ آخر تحديث                    |

- **المؤشرات (Indexes)**: لا تضاف فهارس إضافية لـ `email` أو `role` للاكتفاء بفهارس قيود `UNIQUE` التلقائية.

---

### 2.2 جدول التصنيفات (`categories`)

| اسم العمود    | النوع         | إلزامي؟ | القيود                                     | الوصف                 |
| ------------- | ------------- | ------- | ------------------------------------------ | --------------------- |
| `id`          | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للتصنيف |
| `name`        | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم التصنيف           |
| `slug`        | `varchar(60)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف للتصنيف |
| `description` | `text`        | لا      | -                                          | وصف اختياري للتصنيف   |
| `created_at`  | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء         |
| `updated_at`  | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث         |

- **المؤشرات (Indexes)**: الفهرس الفريد لـ `slug` ينشأ تلقائياً من قيد `UNIQUE`.

---

### 2.3 جدول المقالات (`posts`)

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                             | الوصف                       |
| --------------------- | -------------- | ------- | ------------------------------------------------------------------ | --------------------------- |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | المعرف الفريد للمقال        |
| `title`               | `varchar(200)` | نعم     | `NOT NULL`                                                         | عنوان المقال                |
| `slug`                | `varchar(220)` | نعم     | `UNIQUE`, `NOT NULL`                                               | الرابط اللطيف للمقال        |
| `summary`             | `text`         | نعم     | `NOT NULL`                                                         | ملخص قصير                   |
| `content_markdown`    | `text`         | نعم     | `NOT NULL`                                                         | محتوى المقال بصيغة Markdown |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))` | حالة المقال                 |
| `category_id`         | `uuid`         | نعم     | `FOREIGN KEY (categories.id) ON DELETE RESTRICT`                   | التصنيف الرئيسي             |
| `author_id`           | `uuid`         | نعم     | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                        | الكاتب (الأدمن)             |
| `published_at`        | `timestamptz`  | لا      | -                                                                  | تاريخ النشر                 |
| `archived_at`         | `timestamptz`  | لا      | -                                                                  | تاريخ الأرشفة               |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                        | من أرشف المقال              |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ الإنشاء               |
| `updated_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ آخر تحديث             |

- **قيود السلامة (Check Constraints)**:
  - `CHECK (status != 'PUBLISHED' OR published_at IS NOT NULL)`
  - `CHECK (status != 'ARCHIVED' OR (archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL))`
- **المؤشرات الموصى بها (Non-redundant Indexes)**:
  - `idx_posts_status_published_at` على (`status`, `published_at DESC`) للاستعلام العام السريع.
  - `idx_posts_category_id` على `category_id` لتسريع التصفح حسب التصنيف.

---

### 2.4 جدول الوسوم (`tags`)

| اسم العمود   | النوع         | إلزامي؟ | القيود                                     | الوصف               |
| ------------ | ------------- | ------- | ------------------------------------------ | ------------------- |
| `id`         | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للوسم |
| `name`       | `varchar(40)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم الوسم           |
| `slug`       | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف       |
| `created_at` | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء       |

---

### 2.5 جدول الربط بين المقالات والوسوم (`post_tags`)

| اسم العمود | النوع  | إلزامي؟ | القيود                                     | الوصف       |
| ---------- | ------ | ------- | ------------------------------------------ | ----------- |
| `post_id`  | `uuid` | نعم     | `FOREIGN KEY (posts.id) ON DELETE CASCADE` | معرف المقال |
| `tag_id`   | `uuid` | نعم     | `FOREIGN KEY (tags.id) ON DELETE RESTRICT` | معرف الوسم  |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (post_id, tag_id)`.
- **المؤشرات**: `idx_post_tags_tag_id` على `tag_id`.

---

### 2.6 جدول التقنيات (`technologies`)

| اسم العمود   | النوع         | إلزامي؟ | القيود                                     | الوصف                 |
| ------------ | ------------- | ------- | ------------------------------------------ | --------------------- |
| `id`         | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للتقنية |
| `name`       | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم التقنية           |
| `slug`       | `varchar(60)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف         |
| `icon_name`  | `varchar(50)` | لا      | -                                          | اسم الأيقونة          |
| `created_at` | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء         |

---

### 2.7 جدول المشاريع (`projects`)

| اسم العمود             | النوع          | إلزامي؟ | القيود                                                             | الوصف                 |
| ---------------------- | -------------- | ------- | ------------------------------------------------------------------ | --------------------- |
| `id`                   | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | المعرف الفريد للمشروع |
| `title`                | `varchar(200)` | نعم     | `NOT NULL`                                                         | عنوان المشروع         |
| `slug`                 | `varchar(220)` | نعم     | `UNIQUE`, `NOT NULL`                                               | الرابط اللطيف         |
| `summary`              | `text`         | نعم     | `NOT NULL`                                                         | ملخص موجز             |
| `description_markdown` | `text`         | نعم     | `NOT NULL`                                                         | تفاصيل المشروع        |
| `live_url`             | `varchar(500)` | لا      | -                                                                  | رابط المعاينة         |
| `github_url`           | `varchar(500)` | لا      | -                                                                  | رابط المستودع         |
| `is_featured`          | `boolean`      | نعم     | `NOT NULL`, `DEFAULT false`                                        | هل المشروع مميز؟      |
| `status`               | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))` | حالة المشروع          |
| `published_at`         | `timestamptz`  | لا      | -                                                                  | تاريخ النشر           |
| `archived_at`          | `timestamptz`  | لا      | -                                                                  | تاريخ الأرشفة         |
| `archived_by_user_id`  | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                        | من أرشف المشروع       |
| `created_at`           | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ الإنشاء         |
| `updated_at`           | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ التحديث         |

- **قيود السلامة (Check Constraints)**:
  - `CHECK (status != 'PUBLISHED' OR published_at IS NOT NULL)`
  - `CHECK (status != 'ARCHIVED' OR (archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL))`
- **المؤشرات**: `idx_projects_featured_status` على (`is_featured`, `status`, `published_at DESC`).

---

### 2.8 جدول الربط بين المشاريع والتقنيات (`project_technologies`)

| اسم العمود      | النوع  | إلزامي؟ | القيود                                             | الوصف        |
| --------------- | ------ | ------- | -------------------------------------------------- | ------------ |
| `project_id`    | `uuid` | نعم     | `FOREIGN KEY (projects.id) ON DELETE CASCADE`      | معرف المشروع |
| `technology_id` | `uuid` | نعم     | `FOREIGN KEY (technologies.id) ON DELETE RESTRICT` | معرف التقنية |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (project_id, technology_id)`.
- **المؤشرات**: `idx_project_technologies_tech_id` على `technology_id`.

---

### 2.9 جدول الوسائط والملفات (`media_assets`)

يمثل سجل الرفع وتفاصيل الأصل. يُنشأ بالحالة `PENDING_UPLOAD` مع `public_url = NULL` وتاريخ انتهاء الصلاحية `upload_expires_at` قبل إعطاء رابط الرفع المباشر.

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                                   | الوصف                                               |
| --------------------- | -------------- | ------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                               | المعرف الفريد للأصل                                 |
| `filename`            | `varchar(255)` | نعم     | `NOT NULL`                                                               | الاسم الأصلي للملف                                  |
| `storage_key`         | `varchar(500)` | نعم     | `UNIQUE`, `NOT NULL`                                                     | مفتاح الكائن الفريد في مخزن R2                      |
| `public_url`          | `varchar(500)` | لا      | -                                                                        | الرابط العام لعرض الأصل (NULL أثناء PENDING_UPLOAD) |
| `mime_type`           | `varchar(100)` | نعم     | `NOT NULL`                                                               | نوع الوسيط                                          |
| `file_size_bytes`     | `bigint`       | نعم     | `NOT NULL`                                                               | حجم الملف بالبايت                                   |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('PENDING_UPLOAD', 'ACTIVE', 'ARCHIVED'))` | حالة الأصل                                          |
| `uploaded_by_user_id` | `uuid`         | نعم     | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                              | الأدمن الذي طلب الرفع                               |
| `upload_expires_at`   | `timestamptz`  | نعم     | `NOT NULL`                                                               | تاريخ انتهاء صلاحية رابط الرفع                      |
| `uploaded_at`         | `timestamptz`  | لا      | -                                                                        | تاريخ اكتمال الرفع الناجح                           |
| `archived_at`         | `timestamptz`  | لا      | -                                                                        | تاريخ الأرشفة إن وجد                                |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                              | من قام بأرشفة الأصل                                 |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                  | تاريخ طلب الرفع                                     |
| `updated_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                  | تاريخ آخر تحديث                                     |

- **قيود السلامة (Check Constraints)**:
  - `CHECK (status != 'PENDING_UPLOAD' OR upload_expires_at IS NOT NULL)`
  - `CHECK (status != 'ACTIVE' OR (public_url IS NOT NULL AND uploaded_at IS NOT NULL))`
  - `CHECK (status != 'ARCHIVED' OR archived_at IS NOT NULL)`
- **المؤشرات**: `idx_media_assets_status_expires` على (`status`, `upload_expires_at`).

---

### 2.10 جدول الربط بين المقالات والوسائط (`post_media_assets`)

| اسم العمود       | النوع     | إلزامي؟ | القيود                                             | الوصف                        |
| ---------------- | --------- | ------- | -------------------------------------------------- | ---------------------------- |
| `post_id`        | `uuid`    | نعم     | `FOREIGN KEY (posts.id) ON DELETE CASCADE`         | معرف المقال                  |
| `media_asset_id` | `uuid`    | نعم     | `FOREIGN KEY (media_assets.id) ON DELETE RESTRICT` | معرف الأصل الوسيط            |
| `is_cover`       | `boolean` | نعم     | `NOT NULL`, `DEFAULT false`                        | هل هذا الأصل هو غلاف المقال؟ |
| `display_order`  | `integer` | نعم     | `NOT NULL`, `DEFAULT 0`                            | ترتيب العرض داخل المقال      |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (post_id, media_asset_id)`.
- **قيود الفرادة والترتيب (Unique Constraints & Partial Indexes)**:
  - `UNIQUE (post_id, display_order)` لضمان عدم تكرار الترتيب داخل المقال الواحد.
  - `CREATE UNIQUE INDEX idx_post_media_single_cover ON post_media_assets (post_id) WHERE is_cover = true;` لضمان غلاف واحد فريد فقط لكل مقال.
- **قاعدة التطبيق الصارمة**: يُسمح فقط بربط الأصول ذات الحالة `ACTIVE` وغير المؤرشفة بالمدونة.

---

### 2.11 جدول الربط بين المشاريع والوسائط (`project_media_assets`)

| اسم العمود       | النوع     | إلزامي؟ | القيود                                             | الوصف                         |
| ---------------- | --------- | ------- | -------------------------------------------------- | ----------------------------- |
| `project_id`     | `uuid`    | نعم     | `FOREIGN KEY (projects.id) ON DELETE CASCADE`      | معرف المشروع                  |
| `media_asset_id` | `uuid`    | نعم     | `FOREIGN KEY (media_assets.id) ON DELETE RESTRICT` | معرف الأصل الوسيط             |
| `is_cover`       | `boolean` | نعم     | `NOT NULL`, `DEFAULT false`                        | هل هذا الأصل هو غلاف المشروع؟ |
| `display_order`  | `integer` | نعم     | `NOT NULL`, `DEFAULT 0`                            | ترتيب العرض معرض الصور        |

- **المفتاح الرئيسي المركب**: `PRIMARY KEY (project_id, media_asset_id)`.
- **قيود الفرادة والترتيب (Unique Constraints & Partial Indexes)**:
  - `UNIQUE (project_id, display_order)` لضمان عدم تكرار الترتيب داخل معرض المشروع.
  - `CREATE UNIQUE INDEX idx_project_media_single_cover ON project_media_assets (project_id) WHERE is_cover = true;` لضمان غلاف واحد فريد فقط لكل مشروع.

---

### 2.12 جدول رسائل التواصل (`contact_messages`)

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                         | الوصف                                |
| --------------------- | -------------- | ------- | -------------------------------------------------------------- | ------------------------------------ |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                     | المعرف الفريد للرسالة                |
| `sender_name`         | `varchar(100)` | نعم     | `NOT NULL`                                                     | اسم مرسل الرسالة                     |
| `sender_email`        | `varchar(255)` | نعم     | `NOT NULL`                                                     | البريد الإلكتروني للمرسل             |
| `subject`             | `varchar(200)` | نعم     | `NOT NULL`                                                     | موضوع الرسالة                        |
| `message_body`        | `text`         | نعم     | `NOT NULL`                                                     | نص الرسالة                           |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED'))` | حالة الرسالة                         |
| `ip_address_hash`     | `varchar(64)`  | نعم     | `NOT NULL`                                                     | HMAC-SHA256 لمنع السبام ورصد التكرار |
| `read_at`             | `timestamptz`  | لا      | -                                                              | تاريخ فتح وقراءة الرسالة             |
| `archived_at`         | `timestamptz`  | لا      | -                                                              | تاريخ الأرشفة                        |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (users.id) ON DELETE RESTRICT`                    | من أرشف الرسالة                      |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                        | تاريخ وصول الرسالة                   |
| `updated_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                        | تاريخ آخر تحديث                      |

- **قيود السلامة (Check Constraints)**:
  - `CHECK (status != 'READ' OR read_at IS NOT NULL)`
  - `CHECK (status != 'ARCHIVED' OR archived_at IS NOT NULL)`
- **المؤشرات**: `idx_contact_messages_status_created_at` على (`status`, `created_at DESC`).

---

### 2.13 جدول سجلات التدقيق الإداري (`audit_logs`)

| اسم العمود      | النوع          | إلزامي؟ | القيود                                      | الوصف                  |
| --------------- | -------------- | ------- | ------------------------------------------- | ---------------------- |
| `id`            | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`  | المعرف الفريد للسجل    |
| `actor_user_id` | `uuid`         | نعم     | `FOREIGN KEY (users.id) ON DELETE RESTRICT` | الأدمن منفذ العملية    |
| `action`        | `varchar(100)` | نعم     | `NOT NULL`                                  | نوع العملية            |
| `entity_type`   | `varchar(50)`  | نعم     | `NOT NULL`                                  | اسم الكيان المـتأثر    |
| `entity_id`     | `uuid`         | لا      | -                                           | المعرف الفريد للكيان   |
| `metadata_json` | `jsonb`        | نعم     | `NOT NULL`, `DEFAULT '{}'`                  | بيانات وصفية آمنة      |
| `created_at`    | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`     | التوقيع الزمني للعملية |

- **المؤشرات**: `idx_audit_logs_actor_created_at` على (`actor_user_id`, `created_at DESC`).

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
- **استبعاد المؤرشف من الاستعلامات العامة**: تضمن الواجهة البرمجية تصفية العناصر ذات الحالة `ARCHIVED` وحجبها عن الزوار.
- **حصانة سجلات التدقيق**: جدول `audit_logs` محمي بقواعد DB يمنع تعديله أو حذف سجلاته نهائياً.

---

## 5. قواعد سلامة البيانات والخصوصية (Data Integrity & Privacy)

1. **حماية IP بـ HMAC-SHA256**: يتم تشفير عنوان IP للزائر عبر `HMAC-SHA256(normalized_ip, server_managed_secret)` لحماية الخصوصية ومنع التكرار، مع إدارة المفتاح السري خارج قاعدة البيانات.
2. **عزل الثنائيات**: عدم قبول أي ملفات ثنائية داخل DB تحت أي ظرف.
3. **القيود المرجعية الصارمة**: استخدام `ON DELETE RESTRICT` يمنع كسر العلاقات المرجعية عند أرشفة أي عنصر.

---

## 6. استراتيجية الهجرة وبوابات الجودة لجداول البيانات (Planned Quality Gates)

سيتم فحص مخطط قاعدة البيانات في مرحلة التنفيذ القادمة عبر بوابات الجودة المخططة التالية:

1. **Migration-From-Zero**: اختبار تطبيق ملفات الهجرة من الصفر مع تفعيل `pgcrypto` بنجاح.
2. **Schema Drift Check**: التأكد من مطابقة مخطط قاعدة البيانات الفعلي مع كود ORM بدون انحراف.
3. **Foreign Key Integrity Verification**: فحوصات تكامل المفاتيح الأجنبية وقيود `ON DELETE`.
4. **Archive Behavior Test**: إثبات تحول العناصر لحالة `ARCHIVED` بدلاً من حذفها من السجلات.
5. **Partial Index & Cover Constraint Test**: اختبار محاولة إضافة أكثر من غلاف واحد للمقال أو المشروع والتأكد من رفض قاعدة البيانات للعملية.
6. **Immutable Audit Log Guard Test**: اختبار محاولة التعديل أو الحذف لجدول `audit_logs` والتأكد من رفض العملية.
