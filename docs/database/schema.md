# مواصفة مخطط قاعدة البيانات (Database Schema Specification)

| البند                           | التفاصيل                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| **المعرف**                      | `SCHEMA-001-PORTFOLIO-PLATFORM`                                           |
| **الإصدار**                     | `1.2.0`                                                                   |
| **الحالة**                      | **DRAFT — Under COO Review**                                              |
| **التاريخ**                     | 30 أغسطس 2026                                                             |
| **قاعدة البيانات المقترحة**     | PostgreSQL 16+ (مع تفعيل إضافة `pgcrypto`)                                |
| **مكافئ التوثيق (Better Auth)** | Better Auth Drizzle Adapter (16 جداول)                                    |
| **الوثائق المكملة**             | [مخطط العلاقات ERD](./ERD.md) · [دورة حياة البيانات](./DATA-LIFECYCLE.md) |

---

## 1. مبادئ نموذج البيانات وتوسيعات النظام (Data Model Principles & Extensions)

1. **إضافة pgcrypto**: تتطلب دالة `gen_random_uuid()` تفعيل إضافة `pgcrypto` في أول ملف هجرة (Migration 0001): `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.
2. **توافقية Better Auth**: اعتماد جداول مصادقة Better Auth القياسية (`user`, `session`, `account`, `verification`) لربط الجلسات والمصادقة بشكل موثق ورسمي.
3. **تسميات موحدة (snake_case)**: استخدام نمط `snake_case` لجميع أسماء الجداول والأعمدة والمؤشرات.
4. **المفاتيح الرئيسية (UUID Primary Keys)**: استخدام `uuid` فريد يولد عبر `gen_random_uuid()` كمفتاح رئيسي لكافة الجداول الـ 16.
5. **التوقيع الزمني المشترك (Timestamps)**: استخدام نوع البيانات `timestamptz` لكافة التواريخ، مع ضمان وجود `updated_at` في كافة الكائنات ذات الحالات المتغيرة.
6. **سياسة الأرشفة فقط ومنع الحذف (Archive-Only Policy)**: لا يوجد حذف نهائي (Hard Delete) لأي كيان محتوى (`posts`, `projects`, `media_assets`, `contact_messages`).
7. **تقييد الحساب الإداري الموحد (Single-Admin Constraint)**: فرض قيد فرادة على عمود `role` بقيمة `'ADMIN'` صراحة في جدول `user` لمنع إنشاء أكثر من حساب أدمن واحد في المرحلة الأولى.
8. **سلامة رفع الوسائط بدون ثنائيات (Metadata-Only Media Lifecycle)**: تزويد `media_assets` بالحقول الوصفية `alt_text`, `width`, `height`, `checksum` وقيد الأبعاد الموجبة `width > 0 AND height > 0` مع جعل `public_url` قابلاً لـ `NULL` لحين تأكيد الرفع التام.
9. **تصنيف المشاريع (`project_type`)**: إضافة العمود المحكوم `project_type` بالقيم المعتمدة: `MOBILE_APP`, `WEB_SYSTEM`, `API`, `ADMIN_SYSTEM`, `OTHER`.
10. **فهارس Slug غير الحساسة لحالة الأحرف**: إنشاء فهارس فريدة صريحة باستعمال `lower(slug)` على جميع جداول الرابط اللطيف.
11. **سجلات تدقيق حصينة تماماً (Append-Only Audit Logs)**: جدول `audit_logs` محمي بمشغلات DB يمنع التعديل (`UPDATE`) والحذف (`DELETE`) والتفريغ (`TRUNCATE`).
12. **إدارة الآمان وبيئة العمل**: حظر أي قيم افتراضية لـ `DATABASE_URL` في كود التهيئة والاعتماد الحصري على `.env.example` لضمان الفشل المبكر المباشر عند غياب المتغير.

---

## 2. المواصفة التفصيلية للجداول (Table-by-Table Specification - 16 Tables)

### 2.1 جداول المصادقة (Better Auth Schema Tables)

#### 1. جدول المستخدمين (`user`)

يخزن حساب مدير النظام، مع فرض قيد الفرادة على دور `'ADMIN'` لضمان حساب واحد فقط في المرحلة الأولى.

| اسم العمود       | النوع          | إلزامي؟ | القيود                                                                  | الوصف                         |
| ---------------- | -------------- | ------- | ----------------------------------------------------------------------- | ----------------------------- |
| `id`             | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                              | المعرف الفريد للحساب          |
| `name`           | `varchar(100)` | نعم     | `NOT NULL`                                                              | الاسم الكامل للمستخدم         |
| `email`          | `varchar(255)` | نعم     | `UNIQUE`, `NOT NULL`                                                    | البريد الإلكتروني للمدير      |
| `email_verified` | `boolean`      | نعم     | `NOT NULL`, `DEFAULT false`                                             | تأكيد البريد الإلكتروني       |
| `image`          | `text`         | لا      | -                                                                       | صورة الحساب                   |
| `password_hash`  | `varchar(255)` | لا      | -                                                                       | كلمة المرور المشفرة           |
| `role`           | `varchar(20)`  | نعم     | `NOT NULL`, `DEFAULT 'ADMIN'`, `CHECK (role = 'ADMIN')`, `UNIQUE(role)` | دور المستخدم (أدمن واحد فريد) |
| `created_at`     | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                 | تاريخ الإنشاء                 |
| `updated_at`     | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                 | تاريخ آخر تحديث               |

#### 2. جدول الجلسات (`session`)

| اسم العمود   | النوع          | إلزامي؟ | القيود                                     | الوصف               |
| ------------ | -------------- | ------- | ------------------------------------------ | ------------------- |
| `id`         | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | معرف الجلسة         |
| `user_id`    | `uuid`         | نعم     | `FOREIGN KEY (user.id) ON DELETE CASCADE`  | معرف المستخدم       |
| `token`      | `varchar(255)` | نعم     | `UNIQUE`, `NOT NULL`                       | رمُز الجلسة الفريد  |
| `expires_at` | `timestamptz`  | نعم     | `NOT NULL`                                 | تاريخ انتهاء الجلسة |
| `ip_address` | `varchar(64)`  | لا      | -                                          | عنوان IP            |
| `user_agent` | `text`         | لا      | -                                          | متصفح ورأس الطلب    |
| `created_at` | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء       |
| `updated_at` | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث       |

#### 3. جدول الحسابات والمرتبطات (`account`)

| اسم العمود                 | النوع          | إلزامي؟ | القيود                                     | الوصف                      |
| -------------------------- | -------------- | ------- | ------------------------------------------ | -------------------------- |
| `id`                       | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | معرف السجل                 |
| `user_id`                  | `uuid`         | نعم     | `FOREIGN KEY (user.id) ON DELETE CASCADE`  | معرف المستخدم              |
| `account_id`               | `varchar(255)` | نعم     | `NOT NULL`                                 | معرف الحساب لدى المزود     |
| `provider_id`              | `varchar(255)` | نعم     | `NOT NULL`                                 | معرف مزود الهوية           |
| `access_token`             | `text`         | لا      | -                                          | رمُز الوصول                |
| `refresh_token`            | `text`         | لا      | -                                          | رمُز التحديث               |
| `access_token_expires_at`  | `timestamptz`  | لا      | -                                          | انتهاء رمز الوصول          |
| `refresh_token_expires_at` | `timestamptz`  | لا      | -                                          | انتهاء رمز التحديث         |
| `scope`                    | `text`         | لا      | -                                          | الصلاحيات المطلوبة         |
| `password`                 | `text`         | لا      | -                                          | كلمة المرور المشفرة للمزود |
| `created_at`               | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء              |
| `updated_at`               | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث              |

#### 4. جدول التحقق والرموز المؤقتة (`verification`)

| اسم العمود   | النوع          | إلزامي؟ | القيود                                     | الوصف                |
| ------------ | -------------- | ------- | ------------------------------------------ | -------------------- |
| `id`         | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | معرف رمز التحقق      |
| `identifier` | `varchar(255)` | نعم     | `NOT NULL`                                 | المستهدف (بريد/هاتف) |
| `value`      | `text`         | نعم     | `NOT NULL`                                 | قيمة الرمز التراكمية |
| `expires_at` | `timestamptz`  | نعم     | `NOT NULL`                                 | انتهاء الصلاحية      |
| `created_at` | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء        |
| `updated_at` | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث        |

---

### 2.2 جداول المحتوى والبيانات (Domain Content Tables)

#### 5. جدول التصنيفات (`categories`)

| اسم العمود    | النوع         | إلزامي؟ | القيود                                     | الوصف                 |
| ------------- | ------------- | ------- | ------------------------------------------ | --------------------- |
| `id`          | `uuid`        | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | المعرف الفريد للتصنيف |
| `name`        | `varchar(50)` | نعم     | `UNIQUE`, `NOT NULL`                       | اسم التصنيف           |
| `slug`        | `varchar(60)` | نعم     | `UNIQUE`, `NOT NULL`                       | الرابط اللطيف للتصنيف |
| `description` | `text`        | لا      | -                                          | وصف اختياري           |
| `created_at`  | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء         |
| `updated_at`  | `timestamptz` | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث         |

- **المؤشرات (Indexes)**: `CREATE UNIQUE INDEX idx_categories_lower_slug ON categories (lower(slug));`

#### 6. جدول المقالات (`posts`)

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                             | الوصف                       |
| --------------------- | -------------- | ------- | ------------------------------------------------------------------ | --------------------------- |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | المعرف الفريد للمقال        |
| `title`               | `varchar(200)` | نعم     | `NOT NULL`                                                         | عنوان المقال                |
| `slug`                | `varchar(220)` | نعم     | `UNIQUE`, `NOT NULL`                                               | الرابط اللطيف للمقال        |
| `summary`             | `text`         | نعم     | `NOT NULL`                                                         | ملخص قصير                   |
| `content_markdown`    | `text`         | نعم     | `NOT NULL`                                                         | محتوى المقال بصيغة Markdown |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))` | حالة المقال                 |
| `category_id`         | `uuid`         | نعم     | `FOREIGN KEY (categories.id) ON DELETE RESTRICT`                   | التصنيف الرئيسي             |
| `author_id`           | `uuid`         | نعم     | `FOREIGN KEY (user.id) ON DELETE RESTRICT`                         | الكاتب (الأدمن)             |
| `published_at`        | `timestamptz`  | لا      | -                                                                  | تاريخ النشر                 |
| `archived_at`         | `timestamptz`  | لا      | -                                                                  | تاريخ الأرشفة               |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (user.id) ON DELETE RESTRICT`                         | من أرشف المقال              |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ الإنشاء               |
| `updated_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                            | تاريخ آخر تحديث             |

- **قيود السلامة (Check Constraints)**:
  - `CHECK (status != 'PUBLISHED' OR published_at IS NOT NULL)`
  - `CHECK (status != 'ARCHIVED' OR (archived_at IS NOT NULL AND archived_by_user_id IS NOT NULL))`
- **المؤشرات**: `CREATE UNIQUE INDEX idx_posts_lower_slug ON posts (lower(slug));`

#### 7. جدول الوسوم (`tags`)

- **المؤشرات**: `CREATE UNIQUE INDEX idx_tags_lower_slug ON tags (lower(slug));`

#### 8. جدول الربط بين المقالات والوسوم (`post_tags`)

#### 9. جدول التقنيات (`technologies`)

- **المؤشرات**: `CREATE UNIQUE INDEX idx_technologies_lower_slug ON technologies (lower(slug));`

#### 10. جدول المشاريع (`projects`)

| اسم العمود             | النوع          | إلزامي؟ | القيود                                                                                             | الوصف                 |
| ---------------------- | -------------- | ------- | -------------------------------------------------------------------------------------------------- | --------------------- |
| `id`                   | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                                         | المعرف الفريد للمشروع |
| `title`                | `varchar(200)` | نعم     | `NOT NULL`                                                                                         | عنوان المشروع         |
| `slug`                 | `varchar(220)` | نعم     | `UNIQUE`, `NOT NULL`                                                                               | الرابط اللطيف         |
| `summary`              | `text`         | نعم     | `NOT NULL`                                                                                         | ملخص موجز             |
| `description_markdown` | `text`         | نعم     | `NOT NULL`                                                                                         | تفاصيل المشروع        |
| `project_type`         | `varchar(30)`  | نعم     | `NOT NULL`, `CHECK (project_type IN ('MOBILE_APP', 'WEB_SYSTEM', 'API', 'ADMIN_SYSTEM', 'OTHER'))` | تصنيف نوع المشروع     |
| `live_url`             | `varchar(500)` | لا      | -                                                                                                  | رابط المعاينة         |
| `github_url`           | `varchar(500)` | لا      | -                                                                                                  | رابط المستودع         |
| `is_featured`          | `boolean`      | نعم     | `NOT NULL`, `DEFAULT false`                                                                        | هل المشروع مميز؟      |
| `status`               | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))`                                 | حالة المشروع          |
| `published_at`         | `timestamptz`  | لا      | -                                                                                                  | تاريخ النشر           |
| `archived_at`          | `timestamptz`  | لا      | -                                                                                                  | تاريخ الأرشفة         |
| `archived_by_user_id`  | `uuid`         | لا      | `FOREIGN KEY (user.id) ON DELETE RESTRICT`                                                         | من أرشف المشروع       |
| `created_at`           | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                                            | تاريخ الإنشاء         |
| `updated_at`           | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                                            | تاريخ التحديث         |

- **المؤشرات**: `CREATE UNIQUE INDEX idx_projects_lower_slug ON projects (lower(slug));`

#### 11. جدول الربط بين المشاريع والتقنيات (`project_technologies`)

#### 12. جدول الوسائط والملفات (`media_assets`)

| اسم العمود            | النوع          | إلزامي؟ | القيود                                                                   | الوصف                    |
| --------------------- | -------------- | ------- | ------------------------------------------------------------------------ | ------------------------ |
| `id`                  | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                               | المعرف الفريد للأصل      |
| `filename`            | `varchar(255)` | نعم     | `NOT NULL`                                                               | الاسم الأصلي للملف       |
| `storage_key`         | `varchar(500)` | نعم     | `UNIQUE`, `NOT NULL`                                                     | مفتاح الكائن في R2       |
| `public_url`          | `varchar(500)` | لا      | -                                                                        | الرابط العام للعرض       |
| `mime_type`           | `varchar(100)` | نعم     | `NOT NULL`                                                               | نوع الوسيط               |
| `file_size_bytes`     | `bigint`       | نعم     | `NOT NULL`, `CHECK (file_size_bytes > 0)`                                | حجم الملف بالبايت الموجب |
| `alt_text`            | `varchar(255)` | لا      | -                                                                        | النص البديل للإتاحة      |
| `width`               | `integer`      | لا      | `CHECK (width IS NULL OR width > 0)`                                     | العرض بالبكسل الموجب     |
| `height`              | `integer`      | لا      | `CHECK (height IS NULL OR height > 0)`                                   | الارتفاع بالبكسل الموجب  |
| `checksum`            | `varchar(64)`  | لا      | -                                                                        | Hash السلامة (SHA-256)   |
| `status`              | `varchar(20)`  | نعم     | `NOT NULL`, `CHECK (status IN ('PENDING_UPLOAD', 'ACTIVE', 'ARCHIVED'))` | حالة الأصل               |
| `uploaded_by_user_id` | `uuid`         | نعم     | `FOREIGN KEY (user.id) ON DELETE RESTRICT`                               | الأدمن الطالب للرفع      |
| `upload_expires_at`   | `timestamptz`  | نعم     | `NOT NULL`                                                               | تاريخ انتهاء الصلاحية    |
| `uploaded_at`         | `timestamptz`  | لا      | -                                                                        | تاريخ اكتمال الرفع       |
| `archived_at`         | `timestamptz`  | لا      | -                                                                        | تاريخ الأرشفة            |
| `archived_by_user_id` | `uuid`         | لا      | `FOREIGN KEY (user.id) ON DELETE RESTRICT`                               | الأدمن الأرشيفي          |
| `created_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                  | تاريخ الإنشاء            |
| `updated_at`          | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                  | تاريخ التحديث            |

#### 13. جدول الربط بين المقالات والوسائط (`post_media_assets`)

- **قيود إضافية**: `CHECK (display_order >= 0)`.
- **غلاف واحد فريد**: `CREATE UNIQUE INDEX idx_post_media_single_cover ON post_media_assets (post_id) WHERE is_cover = true;`

#### 14. جدول الربط بين المشاريع والوسائط (`project_media_assets`)

- **قيود إضافية**: `CHECK (display_order >= 0)`.
- **غلاف واحد فريد**: `CREATE UNIQUE INDEX idx_project_media_single_cover ON project_media_assets (project_id) WHERE is_cover = true;`

#### 15. جدول رسائل التواصل (`contact_messages`)

#### 16. جدول سجلات التدقيق الإداري (`audit_logs`)

- **حماية غير قابلة للاختراق**: مشغل صفوف لـ `UPDATE` و `DELETE` ومشغل عبارات لـ `TRUNCATE` يمنعان العمليات الثلاث تماماً في PostgreSQL.
