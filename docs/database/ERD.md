# مخطط كيانات وعلاقات قاعدة البيانات (Entity Relationship Diagram - ERD)

## 1. نظرة عامة

يقدم هذا المستند المخطط البصري الهيكلي لجميع الجداول الـ 13 المعتمدة في منصة الموقع الشخصي، موضحاً المفاتيح الرئيسية (PK)، المفاتيح الأجنبية (FK)، ودرجات العلاقات (Cardinality) بين الجداول.

---

## 2. مخطط العلاقات الإجمالي (Mermaid ER Diagram)

```mermaid
erDiagram

    users ||--o{ posts : "author_id (يكتب)"
    users ||--o{ posts : "archived_by_user_id (يؤرشف)"
    users ||--o{ projects : "archived_by_user_id (يؤرشف)"
    users ||--o{ media_assets : "uploaded_by_user_id (يرفع)"
    users ||--o{ media_assets : "archived_by_user_id (يؤرشف)"
    users ||--o{ contact_messages : "archived_by_user_id (يؤرشف)"
    users ||--o{ audit_logs : "actor_user_id (ينفذ)"

    categories ||--o{ posts : "category_id (يحتوي)"

    posts ||--o{ post_tags : "post_id"
    tags ||--o{ post_tags : "tag_id"

    projects ||--o{ project_technologies : "project_id"
    technologies ||--o{ project_technologies : "technology_id"

    posts ||--o{ post_media_assets : "post_id"
    media_assets ||--o{ post_media_assets : "media_asset_id"

    projects ||--o{ project_media_assets : "project_id"
    media_assets ||--o{ project_media_assets : "media_asset_id"

    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        timestamptz created_at
        timestamptz updated_at
    }

    categories {
        uuid id PK
        varchar name UK
        varchar slug UK
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    posts {
        uuid id PK
        varchar title
        varchar slug UK
        text summary
        text content_markdown
        varchar status
        uuid category_id FK
        uuid author_id FK
        timestamptz published_at
        timestamptz archived_at
        uuid archived_by_user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    tags {
        uuid id PK
        varchar name UK
        varchar slug UK
        timestamptz created_at
    }

    post_tags {
        uuid post_id PK, FK
        uuid tag_id PK, FK
    }

    technologies {
        uuid id PK
        varchar name UK
        varchar slug UK
        varchar icon_name
        timestamptz created_at
    }

    projects {
        uuid id PK
        varchar title
        varchar slug UK
        text summary
        text description_markdown
        varchar live_url
        varchar github_url
        boolean is_featured
        varchar status
        timestamptz published_at
        timestamptz archived_at
        uuid archived_by_user_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    project_technologies {
        uuid project_id PK, FK
        uuid technology_id PK, FK
    }

    media_assets {
        uuid id PK
        varchar filename
        varchar storage_key UK
        varchar public_url
        varchar mime_type
        bigint file_size_bytes
        varchar status
        uuid uploaded_by_user_id FK
        timestamptz archived_at
        uuid archived_by_user_id FK
        timestamptz created_at
    }

    post_media_assets {
        uuid post_id PK, FK
        uuid media_asset_id PK, FK
        boolean is_cover
        integer display_order
    }

    project_media_assets {
        uuid project_id PK, FK
        uuid media_asset_id PK, FK
        boolean is_cover
        integer display_order
    }

    contact_messages {
        uuid id PK
        varchar sender_name
        varchar sender_email
        varchar subject
        text message_body
        varchar status
        varchar ip_address_hash
        timestamptz archived_at
        uuid archived_by_user_id FK
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid actor_user_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        jsonb metadata_json
        timestamptz created_at
    }
```

---

## 3. ملخص العلاقات ودرجات التعدد (Relationships & Cardinalities Summary)

1. **`users` -> `posts`**: علاقة واحد إلى متعدد (`1:N`). مدير النظام يمكنه كتابة عدة مقالات، وأرشفة عدة مقالات.
2. **`categories` -> `posts`**: علاقة واحد إلى متعدد (`1:N`). التصنيف يحتوي مقالاً واحداً أو أكثر.
3. **`posts` <-> `tags`**: علاقة متعدد إلى متعدد (`N:M`) يتم تمثيلها عبر جدول الوسيط الصريح `post_tags`.
4. **`projects` <-> `technologies`**: علاقة متعدد إلى متعدد (`N:M`) تمثل عبر جدول الوسيط الصريح `project_technologies`.
5. **`posts` <-> `media_assets`**: علاقة متعدد إلى متعدد (`N:M`) تمثل عبر جدول الوسيط الصريح `post_media_assets` لحظر البوليمورفية.
6. **`projects` <-> `media_assets`**: علاقة متعدد إلى متعدد (`N:M`) تمثل عبر جدول الوسيط الصريح `project_media_assets` لحظر البوليمورفية.
7. **`users` -> `audit_logs`**: علاقة واحد إلى متعدد (`1:N`). كل سجل تدقيق يرتبط صراحة بالمستخدم الذي نفذ العملية.
