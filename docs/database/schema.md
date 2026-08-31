# مواصفة مخطط قاعدة البيانات (Database Schema Specification)

| البند                           | التفاصيل                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| **المعرف**                      | `SCHEMA-001-PORTFOLIO-PLATFORM`                                           |
| **الإصدار**                     | `1.3.0`                                                                   |
| **الحالة**                      | **DRAFT — Awaiting COO Verification (Better Auth 1.7.2 Foundation)**      |
| **التاريخ**                     | 31 أغسطس 2026                                                             |
| **قاعدة البيانات المقترحة**     | PostgreSQL 16+ (مع تفعيل إضافة `pgcrypto`)                                |
| **مكافئ التوثيق (Better Auth)** | Better Auth Drizzle Adapter (الإصدار المثبت `1.7.2` - 16 جدولاً)          |
| **الوثائق المكملة**             | [مخطط العلاقات ERD](./ERD.md) · [دورة حياة البيانات](./DATA-LIFECYCLE.md) |

---

## 1. مبادئ نموذج البيانات وتوسيعات النظام (Data Model Principles & Extensions)

1. **إضافة pgcrypto**: تتطلب دالة `gen_random_uuid()` تفعيل إضافة `pgcrypto` في ملف الهجرة المخصص (`drizzle/0001_audit-immutability.sql`): `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`.
2. **اعتماد Better Auth 1.7.2**: اعتماد جداول مصادقة Better Auth القياسية للإصدار `1.7.2` (`user`, `session`, `account`, `verification`) بأسماء الأعمدة المعتمدة رسمياً دون تخزين كلمة المرور في `user`.
3. **مرجع كلمة المرور الموحد (Single Credential Authority)**: تخزين كلمة المرور المشفرة يتم حصرًا في `account.password` (مع `provider_id = 'credential'`). تم حذف `user.password_hash` نهائياً لتفادي ازدواجية مصدر الحقيقة.
4. **نموذج هوية الحساب الموحد (Account Identity Model)**: يتضمن `account` حقول `issuer`, `account_id`, `provider_id`, `id_token` وفهرس فرادة صريح على `(issuer, account_id)`.
5. **تسميات موحدة (snake_case)**: استخدام نمط `snake_case` لجميع أسماء الجداول والأعمدة والمؤشرات في قاعدة البيانات.
6. **المفاتيح الرئيسية (UUID Primary Keys)**: استخدام `uuid` فريد يولد عبر `gen_random_uuid()` كمفتاح رئيسي لكافة الجداول الـ 16.
7. **التوقيع الزمني المشترك (Timestamps)**: استخدام نوع البيانات `timestamptz` لكافة التواريخ، مع ضمان وجود `updated_at` في كافة الكائنات ذات الحالات المتغيرة.
8. **سياسة الأرشفة فقط ومنع الحذف (Archive-Only Policy)**: لا يوجد حذف نهائي (Hard Delete) لأي كيان محتوى (`posts`, `projects`, `media_assets`, `contact_messages`).
9. **تقييد الحساب الإداري الموحد (Single-Admin Project Extension)**: عمود `role` في `user` هو توسعة مشروع محكومة بقيد فرادة وخيار افتراضي `'ADMIN'` مع `CHECK (role = 'ADMIN')`.
10. **سلامة رفع الوسائط بدون ثنائيات (Metadata-Only Media Lifecycle)**: تزويد `media_assets` بالحقول الوصفية `alt_text`, `width`, `height`, `checksum` وقيد الأبعاد الموجبة `width > 0 AND height > 0` مع جعل `public_url` قابلاً لـ `NULL` لحين تأكيد الرفع التام.
11. **ترتيب الوسائط والفرادة بالوالد (Per-Parent Display Order Uniqueness)**: جداول `post_media_assets` و `project_media_assets` تتضمن القيود `CHECK (display_order >= 0)` بالإضافة إلى الفرادة الصريحة `UNIQUE(post_id, display_order)` و `UNIQUE(project_id, display_order)`.
12. **تصنيف المشاريع (`project_type`)**: إضافة العمود المحكوم `project_type` بالقيم المعتمدة: `MOBILE_APP`, `WEB_SYSTEM`, `API`, `ADMIN_SYSTEM`, `OTHER`.
13. **فهارس Slug غير الحساسة لحالة الأحرف**: إنشاء فهارس فريدة صريحة باستعمال `lower(slug)` على جميع جداول الرابط اللطيف.
14. **سجلات تدقيق حصينة تماماً (Append-Only Audit Logs)**: جدول `audit_logs` محمي بمشغلات DB في ملف هجرة مخصص (`0001_audit-immutability.sql`) يمنع التعديل (`UPDATE`) والحذف (`DELETE`) والتفريغ (`TRUNCATE`).

---

## 2. المواصفة التفصيلية للجداول (Table-by-Table Specification - 16 Tables)

### 2.1 جداول المصادقة (Better Auth 1.7.2 Schema Tables)

#### 1. جدول المستخدمين (`user`)

يخزن حساب مدير النظام، مع فرض قيد الفرادة على دور `'ADMIN'` لضمان حساب واحد فقط في المرحلة الأولى.

| اسم العمود       | النوع          | إلزامي؟ | القيود                                                                  | الوصف                      |
| ---------------- | -------------- | ------- | ----------------------------------------------------------------------- | -------------------------- |
| `id`             | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                              | المعرف الفريد للحساب       |
| `name`           | `varchar(100)` | نعم     | `NOT NULL`                                                              | الاسم الكامل للمستخدم      |
| `email`          | `varchar(255)` | نعم     | `UNIQUE`, `NOT NULL`                                                    | البريد الإلكتروني للمدير   |
| `email_verified` | `boolean`      | نعم     | `NOT NULL`, `DEFAULT false`                                             | تأكيد البريد الإلكتروني    |
| `image`          | `text`         | لا      | -                                                                       | صورة الحساب                |
| `role`           | `varchar(20)`  | نعم     | `NOT NULL`, `DEFAULT 'ADMIN'`, `CHECK (role = 'ADMIN')`, `UNIQUE(role)` | دور المستخدم (توسعة مشروع) |
| `created_at`     | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                 | تاريخ الإنشاء              |
| `updated_at`     | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`                                 | تاريخ آخر تحديث            |

#### 2. جدول الجلسات (`session`)

| اسم العمود   | Tipo           | إلزامي؟ | القيود                                     | الوصف               |
| ------------ | -------------- | ------- | ------------------------------------------ | ------------------- |
| `id`         | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | معرف الجلسة         |
| `user_id`    | `uuid`         | نعم     | `FOREIGN KEY (user.id) ON DELETE CASCADE`  | معرف المستخدم       |
| `token`      | `varchar(255)` | نعم     | `UNIQUE`, `NOT NULL`                       | رمُز الجلسة الفريد  |
| `expires_at` | `timestamptz`  | نعم     | `NOT NULL`                                 | تاريخ انتهاء الجلسة |
| `ip_address` | `varchar(64)`  | لا      | -                                          | عنوان IP للأمن      |
| `user_agent` | `text`         | لا      | -                                          | متصفح ورأس الطلب    |
| `created_at` | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء       |
| `updated_at` | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث       |

#### 3. جدول الحسابات والمرتبطات (`account`)

| اسم العمود                 | النوع          | إلزامي؟ | القيود                                     | الوصف                      |
| -------------------------- | -------------- | ------- | ------------------------------------------ | -------------------------- |
| `id`                       | `uuid`         | نعم     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | معرف السجل                 |
| `user_id`                  | `uuid`         | نعم     | `FOREIGN KEY (user.id) ON DELETE CASCADE`  | معرف المستخدم              |
| `issuer`                   | `varchar(255)` | نعم     | `NOT NULL`                                 | مزود الهوية المصدق         |
| `account_id`               | `varchar(255)` | نعم     | `NOT NULL`                                 | معرف الحساب لدى المزود     |
| `provider_id`              | `varchar(255)` | نعم     | `NOT NULL`                                 | معرف مزود الخدمة           |
| `access_token`             | `text`         | لا      | -                                          | رمُز الوصول                |
| `refresh_token`            | `text`         | لا      | -                                          | رمُز التحديث               |
| `id_token`                 | `text`         | لا      | -                                          | رمُز الهوية (OpenID)       |
| `access_token_expires_at`  | `timestamptz`  | لا      | -                                          | انتهاء رمز الوصول          |
| `refresh_token_expires_at` | `timestamptz`  | لا      | -                                          | انتهاء رمز التحديث         |
| `scope`                    | `text`         | لا      | -                                          | الصلاحيات المطلوبة         |
| `password`                 | `text`         | لا      | -                                          | كلمة المرور المشفرة للمزود |
| `created_at`               | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ الإنشاء              |
| `updated_at`               | `timestamptz`  | نعم     | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`    | تاريخ التحديث              |

- **المؤشرات (Indexes)**: `CREATE UNIQUE INDEX account_issuer_account_id_unique ON account (issuer, account_id);`

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

#### 6. جدول المقالات (`posts`)

#### 7. جدول الوسوم (`tags`)

#### 8. جدول الربط بين المقالات والوسوم (`post_tags`)

#### 9. جدول التقنيات (`technologies`)

#### 10. جدول المشاريع (`projects`)

#### 11. جدول الربط بين المشاريع والتقنيات (`project_technologies`)

#### 12. جدول الوسائط والملفات (`media_assets`)

#### 13. جدول الربط بين المقالات والوسائط (`post_media_assets`)

| اسم العمود       | النوع     | إلزامي؟ | القيود                                             | الوصف            |
| ---------------- | --------- | ------- | -------------------------------------------------- | ---------------- |
| `post_id`        | `uuid`    | نعم     | `FOREIGN KEY (posts.id) ON DELETE CASCADE`         | معرف المقال      |
| `media_asset_id` | `uuid`    | نعم     | `FOREIGN KEY (media_assets.id) ON DELETE RESTRICT` | معرف الأصل       |
| `is_cover`       | `boolean` | نعم     | `DEFAULT false`                                    | هل هي صورة غلاف؟ |
| `display_order`  | `integer` | نعم     | `DEFAULT 0`, `CHECK (display_order >= 0)`          | ترتيب العرض      |

- **قيود الفرادة الإضافية**:
  - `PRIMARY KEY (post_id, media_asset_id)`
  - `UNIQUE (post_id, display_order)`
  - `CREATE UNIQUE INDEX idx_post_media_single_cover ON post_media_assets (post_id) WHERE is_cover = true;`

#### 14. جدول الربط بين المشاريع والوسائط (`project_media_assets`)

| اسم العمود       | النوع     | إلزامي؟ | القيود                                             | الوصف            |
| ---------------- | --------- | ------- | -------------------------------------------------- | ---------------- |
| `project_id`     | `uuid`    | نعم     | `FOREIGN KEY (projects.id) ON DELETE CASCADE`      | معرف المشروع     |
| `media_asset_id` | `uuid`    | نعم     | `FOREIGN KEY (media_assets.id) ON DELETE RESTRICT` | معرف الأصل       |
| `is_cover`       | `boolean` | نعم     | `DEFAULT false`                                    | هل هي صورة غلاف؟ |
| `display_order`  | `integer` | نعم     | `DEFAULT 0`, `CHECK (display_order >= 0)`          | ترتيب العرض      |

- **قيود الفرادة الإضافية**:
  - `PRIMARY KEY (project_id, media_asset_id)`
  - `UNIQUE (project_id, display_order)`
  - `CREATE UNIQUE INDEX idx_project_media_single_cover ON project_media_assets (project_id) WHERE is_cover = true;`

#### 15. جدول رسائل التواصل (`contact_messages`)

#### 16. جدول سجلات التدقيق الإداري (`audit_logs`)

- **حماية غير قابلة للاختراق**: مشغل صفوف لـ `UPDATE` و `DELETE` ومشغل عبارات لـ `TRUNCATE` في `drizzle/0001_audit-immutability.sql` يمنع العمليات الثلاث تماماً في PostgreSQL.
