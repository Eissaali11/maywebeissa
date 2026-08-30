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
        Root --> NotFound["/404 (صفحة غير موجود)"]
    end

    %% Protected Admin Routes
    subgraph Admin_Area ["المنطقة الإدارية المحمية (Protected Admin Area)"]
        Root --> AdminLogin["/admin/login (تسجيل الدخول الإداري)"]
        AdminLogin --> AdminDashboard["/admin (لوحة التحكم الرئيسية)"]
        AdminDashboard --> AdminPosts["/admin/posts (إدارة المقالات)"]
        AdminDashboard --> AdminProjects["/admin/projects (إدارة المشاريع)"]
        AdminDashboard --> AdminMedia["/admin/media (إدارة الوسائط والأصول)"]
        AdminDashboard --> AdminMessages["/admin/messages (رسائل التواصل الواردة)"]
        AdminDashboard --> AdminAudit["/admin/audit (سجلات التدقيق الإداري)"]
    end

    %% Styles
    classDef publicStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef adminStyle fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef rootStyle fill:#0f172a,stroke:#f59e0b,stroke-width:3px,color:#fff;

    class Root rootStyle;
    class About,Services,Projects,ProjectDetail,Blog,PostDetail,Contact,NotFound publicStyle;
    class AdminLogin,AdminDashboard,AdminPosts,AdminProjects,AdminMedia,AdminMessages,AdminAudit adminStyle;
```

---

## 3. وصف المسارات وقواعد الصلاحية

| المسار (Route)     | نوع الوصول (Access) | الغرض والوصف                                                               |
| ------------------ | ------------------- | -------------------------------------------------------------------------- |
| `/`                | عام (Public)        | الصفحة الرئيسية وتتضمن الـ Hero (3D خفيف) وملخص الخدمات والمشاريع المميزة. |
| `/about`           | عام (Public)        | السيرة الذاتية البرمجية، المهارات التقنية، والخبرات.                       |
| `/services`        | عام (Public)        | تفاصيل الخدمات البرمجية والهندسية المقدمة.                                 |
| `/projects`        | عام (Public)        | معرض كافة المشاريع مع إمكانية التصفية حسب التقنية.                         |
| `/projects/[slug]` | عام (Public)        | الصفحة التفصيلية لمشروع محدد مع عرض المعرض والروابط الحية.                 |
| `/blog`            | عام (Public)        | قائمة المقالات التقنية المنشورة مع تصفية حسب التصنيفات والوسوم.            |
| `/blog/[slug]`     | عام (Public)        | قراءة مقال تقني مخصص مع جدول المحتويات وتظليل الأكواد البرمجية.            |
| `/contact`         | عام (Public)        | نموذج تواصل آمن مع حماية ضد السبام والـ Rate Limiting.                     |
| `/admin/login`     | عام (Public)        | بوابة الدخول المحمية الخاصة بالأدمن فقط.                                   |
| `/admin`           | محمي (Admin Only)   | لوحة القيادة الإدارية مع العدادات والإحصائيات وتدفق العمليات.              |
| `/admin/posts`     | محمي (Admin Only)   | إنشاء وتعديل وحذف ونشر المقالات التقنية.                                   |
| `/admin/projects`  | محمي (Admin Only)   | إدارة معرض المشاريع وبياناتها والوسوم والروابط.                            |
| `/admin/media`     | محمي (Admin Only)   | رفع وتصفية وحذف الأصول والصور والمجسمات (.glb).                            |
| `/admin/messages`  | محمي (Admin Only)   | استعراض ورسائل الوارد وتغيير حالتها أو حذفها.                              |
| `/admin/audit`     | محمي (Admin Only)   | استعراض سجلات التدقيق للأفعال الإدارية المتخذة داخل النظام.                |
