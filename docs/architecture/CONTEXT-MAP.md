# خريطة سياق المعمارية (Architecture Context Map)

## 1. مخطط سياق النظام الخارجي (System Context Diagram)

يوضح هذا المخطط العلاقة بين العناصر والجهات الخارجية (الزائر، الأدمن، خادم المنصة، قاعدة البيانات PostgreSQL، مخزن R2، ومزود البريد الخياري Resend).

```mermaid
graph TD
    subgraph External_Actors ["الفاعلون الخارجيون (External Actors)"]
        Visitor["الزائر (Visitor / Public User)"]
        Admin["مدير النظام (Admin User)"]
    end

    subgraph Core_Platform ["منصة الموقع الشخصي (Portfolio Platform)"]
        AppServer["خادم التطبيق الأحادي المجزأ (Next.js Application Server)"]
    end

    subgraph External_Services ["الخدمات والبنية التحتية (Infrastructure Services)"]
        PostgresDB[("قاعدة البيانات الرئيسية (PostgreSQL DB)")]
        R2Storage[("مخزن الأصول المباشر (Cloudflare R2 Storage)")]
        EmailProvider["مقدم خدمة البريد (Resend Email Service - Optional)"]
    end

    %% Interactions
    Visitor -->|"1. تصفح الخدمات/المشاريع/المدونة والتواصل"| AppServer
    Admin -->|"2. إدار المصادقة، المحتوى، وطلب Presigned URLs"| AppServer

    AppServer -->|"3. الاستعلام والتخزين الذري للبيانات والسجلات"| PostgresDB
    AppServer -->|"4. إصدار روابط الرفع المباشرة (Presigned URLs)"| Admin

    Admin -->|"5. رفع أصول الميديا مباشرة (Direct Binary Upload)"| R2Storage
    Visitor -->|"6. استعراض وقراءة صور وأصول الميديا العامة"| R2Storage

    AppServer -.->"7. إرسال إشعارات الرسائل الواردة (اختياري)"| EmailProvider

    %% Styling
    classDef actorStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef appStyle fill:#0f172a,stroke:#f59e0b,stroke-width:3px,color:#fff;
    classDef storageStyle fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff;

    class Visitor,Admin actorStyle;
    class AppServer appStyle;
    class PostgresDB,R2Storage,EmailProvider storageStyle;
```

---

## 2. خريطة الوحدات والطبقات الداخلية (Internal Module Map)

توضح هذه الخريطة الهيكلية تقسيم الوحدات الوظيفية الست (`auth`, `posts`, `projects`, `media`, `contact`, `audit`) وطبقات كل موديول (`domain`, `application`, `infrastructure`, `presentation`).

```mermaid
graph TB
    subgraph Modular_Monolith ["المنصة الأحادية المجزأة (src/modules/*)"]

        subgraph Auth_Module ["موديول المصادقة (auth)"]
            Auth_Pres["presentation (Auth Routes/Login UI)"]
            Auth_App["application (Session/Login Services)"]
            Auth_Dom["domain (Admin User Entity)"]
            Auth_Infra["infrastructure (Better Auth / Session Store)"]
        end

        subgraph Posts_Module ["موديول المقالات (posts)"]
            Posts_Pres["presentation (Blog UI / Posts Admin UI)"]
            Posts_App["application (Post Use Cases / Revalidation)"]
            Posts_Dom["domain (Post / Category Entities)"]
            Posts_Infra["infrastructure (Post Repository / Drizzle)"]
        end

        subgraph Projects_Module ["موديول المشاريع (projects)"]
            Proj_Pres["presentation (Portfolio UI / Projects Admin UI)"]
            Proj_App["application (Project Use Cases)"]
            Proj_Dom["domain (Project Entity)"]
            Proj_Infra["infrastructure (Project Repository / Drizzle)"]
        end

        subgraph Media_Module ["موديول الوسائط (media)"]
            Media_Pres["presentation (Media Admin UI / Presigned Handlers)"]
            Media_App["application (Presigned URL Service / Confirm Upload)"]
            Media_Dom["domain (Media Asset Entity)"]
            Media_Infra["infrastructure (S3/R2 Client / Drizzle Repository)"]
        end

        subgraph Contact_Module ["موديول التواصل (contact)"]
            Contact_Pres["presentation (Contact Form / Admin Inbox UI)"]
            Contact_App["application (Submit Contact / Archive Message)"]
            Contact_Dom["domain (Contact Message Entity)"]
            Contact_Infra["infrastructure (Contact Repository / Resend Client)"]
        end

        subgraph Audit_Module ["موديول التدقيق (audit)"]
            Audit_Pres["presentation (Audit Logs Admin UI)"]
            Audit_App["application (Record Audit Log Use Case)"]
            Audit_Dom["domain (Audit Log Entity)"]
            Audit_Infra["infrastructure (Immutable Audit Repository)"]
        end

    end

    %% Allowed Inter-Module Dependencies (Application Layer Contracts Only)
    Posts_App -. "تسجيل عملية نشر" .-> Audit_App
    Proj_App -. "تسجيل عملية إنشاء" .-> Audit_App
    Media_App -. "تسجيل رفع أصل" .-> Audit_App
    Posts_App -. "ربط أصل ميديا" .-> Media_App

    %% Styles
    classDef presStyle fill:#1e293b,stroke:#38bdf8,stroke-width:1px,color:#fff;
    classDef appLayerStyle fill:#0f172a,stroke:#f59e0b,stroke-width:1px,color:#fff;
    classDef domStyle fill:#312e81,stroke:#818cf8,stroke-width:1px,color:#fff;
    classDef infraStyle fill:#1c1917,stroke:#a855f7,stroke-width:1px,color:#fff;

    class Auth_Pres,Posts_Pres,Proj_Pres,Media_Pres,Contact_Pres,Audit_Pres presStyle;
    class Auth_App,Posts_App,Proj_App,Media_App,Contact_App,Audit_App appLayerStyle;
    class Auth_Dom,Posts_Dom,Proj_Dom,Media_Dom,Contact_Dom,Audit_Dom domStyle;
    class Auth_Infra,Posts_Infra,Proj_Infra,Media_Infra,Contact_Infra,Audit_Infra infraStyle;
```

---

## 3. تدفق البيانات ورفع الوسائط المباشر (Data & Direct Media Upload Flow)

يرسم هذا التخطيط التسلسلي نمط رفع أصول الوسائط عبر **Presigned URL**، مؤكداً عدم مرور الملفات الثنائية عبر خادم التطبيق إطلاقاً وحفظ البيانات الوصفية فقط في PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as مدير النظام (Admin)
    participant Browser as متصفح الأدمن (Browser UI)
    participant AppServer as خادم التطبيق (Next.js Application Server)
    participant R2Storage as مخزن الأصول (Cloudflare R2 Storage)
    participant PostgresDB as قاعدة البيانات (PostgreSQL DB)

    %% Step 1: Request Presigned URL
    Admin->>Browser: يختار ملف صورة/مجسم ويطلب الرفع
    Browser->>AppServer: 1. طلب رابط رفع (POST /api/media/presigned) مع البيانات الوصفية (Filename, MIME, Size)

    note over AppServer: فحص الجلسة، نوع MIME، الحجم، والامتداد (Validation Gate)

    AppServer->>AppServer: 2. توليد Presigned Upload URL قصير الأجل عبر S3 SDK

    AppServer-->>Browser: 3. إرجاع Presigned URL والمُعرِّف الفريد (Asset ID)

    %% Step 2: Direct Binary Upload
    Browser->>R2Storage: 4. رفع الملف الثنائي مباشرة (PUT Presigned URL)

    alt رفع فاشل أو منتهي الصلاحية
        R2Storage-->>Browser: 5a. خطأ 403 Forbidden / Expired
        Browser-->>Admin: عرض تنبيه الفشل وإمكانية إعادة المحاولة
    else رفع ناجح
        R2Storage-->>Browser: 5b. تأكيد 200 OK

        %% Step 3: Metadata Confirmation
        Browser->>AppServer: 6. تأكيد الرفع (POST /api/media/confirm) برقم الأصل
        AppServer->>PostgresDB: 7. تخزين البيانات الوصفية (Metadata) ورابط الأصل النهائي
        AppServer->>PostgresDB: 8. كتابة سجل تدقيق UPLOAD_MEDIA غير قابل للتعديل
        PostgresDB-->>AppServer: 9. تأكيد العملية الذرية
        AppServer-->>Browser: 10. إرجاع نجاح الرفع وإظهار الأصل في مكتبة الوسائط
    end
```
