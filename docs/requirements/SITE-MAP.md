# خريطة الموقع الهيكلية (Site Map Specification)

## 1. نظرة عامة

توضح هذه الوثيقة الهيكل الكامل لمسارات منصة الموقع الشخصي المتقدم، مقسمة إلى منطقة الزوار العامة (Public Area) والمنطقة الإدارية المحمية (Protected Admin Area).

---

## 2. مخطط خريطة الموقع (Site Map Mermaid Diagram)

```mermaid
graph TD
    Root["/ (الصفحة الرئيسية Home)"]

    %% Public Routes
    subgraph Public_Area ["المنطقة العامة (Public Area)"]
        Root --> About["/about (عن المطور)"]
        Root --> Services["/services (الخدمات)"]
        Root --> Projects["/projects (المشاريع)"]
        Projects --> ProjectDetail["/projects/[slug] (تفاصيل المشروع)"]
        Root --> Blog["/blog (المدونة التقنية)"]
        Blog --> PostDetail["/blog/[slug] (تفاصيل المقال)"]
        Root --> Contact["/contact (التواصل)"]
    end

    %% Framework-level Not Found State
    subgraph Framework_State ["حالة عدم الوجود (System State)"]
        NotFoundState["app/not-found.tsx (حالة 404 — مسار أو مورد غير موجود)"]
    end

    %% Authentication Entry Route
    AdminLogin["/admin/login (بوابة المصادقة الإدارية)"]

    %% Protected Admin Routes
    subgraph Admin_Area ["المنطقة الإدارية المحمية (Protected Admin Area)"]
        AdminDashboard["/admin (لوحة التحكم الرئيسية)"]

        subgraph Posts_Mgmt ["إدارة المقالات"]
            AdminPosts["/admin/posts (قائمة المقالات)"]
            AdminPostsNew["/admin/posts/new (إنشاء مقال جديد)"]
            AdminPostsEdit["/admin/posts/[id]/edit (تعديل مقال)"]
        end

        subgraph Projects_Mgmt ["إدارة المشاريع"]
            AdminProjects["/admin/projects (قائمة المشاريع)"]
            AdminProjectsNew["/admin/projects/new (إنشاء مشروع جديد)"]
            AdminProjectsEdit["/admin/projects/[id]/edit (تعديل مشروع)"]
        end

        AdminMedia["/admin/media (إدارة الوسائط والأصول)"]
        AdminMessages["/admin/messages (رسائل التواصل الواردة)"]
        AdminAudit["/admin/audit (سجلات التدقيق الإداري)"]

        AdminDashboard --> Posts_Mgmt
        AdminDashboard --> Projects_Mgmt
        AdminDashboard --> AdminMedia
        AdminDashboard --> AdminMessages
        AdminDashboard --> AdminAudit
    end

    %% Auth flow
    AdminLogin --> AdminDashboard

    %% Public triggers Not-Found
    Public_Area -. "مسار أو مورد غير موجود" .-> NotFoundState

    %% Styles
    classDef publicStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef adminStyle fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef rootStyle fill:#0f172a,stroke:#f59e0b,stroke-width:3px,color:#fff;
    classDef stateStyle fill:#450a0a,stroke:#f87171,stroke-width:2px,color:#fff;
    classDef authStyle fill:#1c1917,stroke:#fbbf24,stroke-width:2px,color:#fff;

    class Root rootStyle;
    class About,Services,Projects,ProjectDetail,Blog,PostDetail,Contact publicStyle;
    class AdminDashboard,AdminPosts,AdminPostsNew,AdminPostsEdit,AdminProjects,AdminProjectsNew,AdminProjectsEdit,AdminMedia,AdminMessages,AdminAudit adminStyle;
    class NotFoundState stateStyle;
    class AdminLogin authStyle;
```

---

## 3. وصف المسارات وقواعد الصلاحية

| المسار (Route) | نوع الوصول (Access) | الغرض والوصف |
| --- | --- | --- |
| `/` | عام (Public) | الصفحة الرئيسية وتتضمن الـ Hero (3D خفيف) وملخص الخدمات والمشاريع المميزة. |
| `/about` | عام (Public) | السيرة الذاتية البرمجية، المهارات التقنية، والخبرات. |
| `/services` | عام (Public) | تفاصيل الخدمات البرمجية والهندسية المقدمة. |
| `/projects` | عام (Public) | معرض كافة المشاريع مع إمكانية التصفية حسب التقنية المستعملة. |
| `/projects/[slug]` | عام (Public) | الصفحة التفصيلية لمشروع محدد مع عرض المعرض والروابط الحية. |
| `/blog` | عام (Public) | قائمة المقالات التقنية المنشورة مع تصفية حسب التصنيفات والوسوم. |
| `/blog/[slug]` | عام (Public) | قراءة مقال تقني مخصص مع جدول المحتويات وتظليل الأكواد البرمجية. |
| `/contact` | عام (Public) | نموذج تواصل آمن مع حماية ضد السبام والـ Rate Limiting. |
| `app/not-found.tsx` | حالة نظام (Framework State) | واجهة 404 مخصصة تُطلق تلقائياً عند طلب مسار غير موجود أو مورد محذوف. |
| `/admin/login` | بوابة مصادقة (Auth Entry) | نقطة دخول المصادقة الإدارية؛ لا تُعرض في قوائم التنقل العامة. |
| `/admin` | محمي (Admin Only) | لوحة القيادة الإدارية مع العدادات والإحصائيات. |
| `/admin/posts` | محمي (Admin Only) | قائمة المقالات مع خيارات الحالة (مسودة/منشور/مؤرشف). |
| `/admin/posts/new` | محمي (Admin Only) | نموذج إنشاء مقال تقني جديد. |
| `/admin/posts/[id]/edit` | محمي (Admin Only) | نموذج تعديل مقال قائم. |
| `/admin/projects` | محمي (Admin Only) | قائمة المشاريع مع خيارات التصفية والتعديل. |
| `/admin/projects/new` | محمي (Admin Only) | نموذج إنشاء مشروع جديد. |
| `/admin/projects/[id]/edit` | محمي (Admin Only) | نموذج تعديل مشروع قائم. |
| `/admin/media` | محمي (Admin Only) | طلب روابط رفع Presigned URLs وإدارة مكتبة الأصول. |
| `/admin/messages` | محمي (Admin Only) | استعراض رسائل الوارد وتغيير حالتها (مقروءة/مؤرشفة). |
| `/admin/audit` | محمي (Admin Only) | استعراض سجلات التدقيق الإداري غير القابلة للتعديل. |
