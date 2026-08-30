# دليل دورة حياة البيانات والانتقالات (Data Lifecycle Specification)

## 1. نظرة عامة

يحدد هذا المستند الآلات الحالية للحالة (State Machines)، والقيود الصارمة للانتقالات، ومسؤولي الانتقالات لجميع الكيانات الـ 16 في قاعدة البيانات (4 جداول Better Auth + 12 جدول بيانات).

---

## 2. آلات الحالة ودورة الحياة لكل كيان (Entity State Machines)

### 2.1 دورة حياة المقال (`Post Lifecycle`)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : إنشاء مقال كمسودة
    DRAFT --> PUBLISHED : نشر المقال (يتطلب published_at IS NOT NULL)
    PUBLISHED --> DRAFT : إلغاء النشر (Unpublish to Draft)
    PUBLISHED --> ARCHIVED : أرشفة المقال (يتطلب archived_at & archived_by IS NOT NULL)
    DRAFT --> ARCHIVED : أرشفة المسودة
    ARCHIVED --> [*] : حفظ مؤرشف دون إظهار في الاستعلامات العامة
```

---

### 2.2 دورة حياة المشروع (`Project Lifecycle`)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : إنشاء مشروع مسودة
    DRAFT --> PUBLISHED : نشر المشروع (يتطلب published_at IS NOT NULL)
    PUBLISHED --> DRAFT : إرجاع لمسودة
    PUBLISHED --> ARCHIVED : أرشفة المشروع (يتطلب archived_at & archived_by IS NOT NULL)
    DRAFT --> ARCHIVED : أرشفة المسودة
    ARCHIVED --> [*] : أرشفة دائمة
```

---

### 2.3 دورة حياة الوسائط والأصول (`Media Asset Lifecycle`)

```mermaid
stateDiagram-v2
    [*] --> PENDING_UPLOAD : إنشاء سجل معلق (public_url = NULL, upload_expires_at محدد)
    PENDING_UPLOAD --> ACTIVE : تأكيد الرفع بنجاح (تعيين public_url و uploaded_at)
    PENDING_UPLOAD --> ARCHIVED : انتهاء upload_expires_at دون تأكيد الرفع
    ACTIVE --> ARCHIVED : أرشفة الأصل (تعيين archived_at & archived_by)
    ARCHIVED --> [*] : حفظ كأصل مؤرشف
```

---

### 2.4 دورة حياة رسالة التواصل (`Contact Message Lifecycle`)

```mermaid
stateDiagram-v2
    [*] --> UNREAD : وصول رسالة من زائر (توليد ip_address_hash بـ HMAC-SHA256)
    UNREAD --> READ : فتح وقراءة الرسالة (تعيين read_at & updated_at)
    READ --> ARCHIVED : أرشفة الرسالة (تعيين archived_at & archived_by)
    UNREAD --> ARCHIVED : أرشفة مباشرة
    ARCHIVED --> [*] : أرشفة دائمة
```

---

### 2.5 دورة حياة سجل التدقيق (`Audit Log Lifecycle`)

```mermaid
stateDiagram-v2
    [*] --> APPEND_ONLY : كتابة السجل ذرياً عند حدوث العملية
    APPEND_ONLY --> APPEND_ONLY : ممنوع التعديل أو الحذف أو التفريغ (UPDATE / DELETE / TRUNCATE Immutable)
```

- **الحالة المسموحة**: `APPEND_ONLY`
- **السياسة الصارمة في PostgreSQL**:
  - **يُسمح فقط بـ**: `INSERT`
  - **يُحظر تماماً**: `UPDATE`, `DELETE`, `TRUNCATE` (مرفوضة بحرص عبر مشغلي DB على مستوى الصف للصفوف ومستوى العبارة للتفريغ).
