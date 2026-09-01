# سجل حوكمة المستودع واتفاقية خط الأساس (`REMOTE-BASELINE-001`)

## 1. التوثيق وقرار الحوكمة

| البند              | التفاصيل                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **المعرف**         | `REMOTE-BASELINE-001`                                                                         |
| **الإصدار**        | `1.1.0`                                                                                       |
| **الحالة**         | **PROVEN — Process & Technical Protection Enforced**                                          |
| **تاريخ الاعتماد** | 30 أغسطس 2026                                                                                 |
| **التوجيه**        | قرار COO التشغيلي الخاص بحظر الدفع المباشر وقفل تدفق المستودع وتطبيق الحماية التقنية المباشرة |

---

## 2. تثبيت خط الأساس للفرع الرئيسي (`main Baseline`)

1. **الالتزام المعتمَد كخط أساس**:
   - `d9645e2a4043baec48c9944368934d050b5f75b1` (`d9645e2`)
   - **عنوان الالتزام**: `chore(ops): establish repository foundation and governance framework`
2. **قرار الاعتماد**:
   - تم قبول الالتزام `d9645e2` أثرياً (`retroactively`) كخط أساس وحيد للفرع الرئيسي (`origin/main`) بموجب قرار COO المعماري والتشغيلي.

---

## 3. التمييز بين حوكمة العمليات والحماية التقنية (`Process Policy vs Technical Protection`)

### أ. سياسة حوكمة العمليات (`Process Governance Policy`)

توثق سياسة العمل الملزمة للأنشطة والتطوير:

1. **دورة العمل الإلزامية**: `feature branch → Draft PR → CI → COO review → Owner approval → merge`.
2. **حظر الدفع المباشر والفرض**: يُحظر الدفع المباشر أو `git push --force` على `main`.
3. **حظر الدمج الذاتي**: يُحظر على وكيل التنفيذ دمج أي PR مباشرة دون اعتماد صريح من المالك وCOO.

### ب. الحماية التقنية البرمجية على GitHub (`Technical GitHub Branch Protection`)

تأكيد الحماية البرمجية التقنية المطبقة فعلياً ومثبتة عبر GitHub REST API (`GET /repos/Eissaali11/maywebeissa/branches/main/protection`):

1. **اشتراط طلب السحب (`Required Pull Request Reviews`)**:
   - يلزم وجود Pull Request مراجَع وموافق عليه من مراجع واحد على الأقل (`required_approving_review_count: 1`).
   - إلغاء الموافقات القديمة عند دفع التزامات جديدة (`dismiss_stale_reviews: true`).
2. **اشتراط الفحوصات الإلزامية (`Required Status Checks`)**:
   - اشتراط اجتياز فحص `Run Quality Gates` في CI قبل السماح بالدمج (`strict: true`, `contexts: ["Run Quality Gates"]`).
3. **سلامة وقفل الفرع (`Branch Safety & Admin Enforcement`)**:
   - حظر Force Push تماماً (`allow_force_pushes: false`).
   - حظر حذف الفرع `main` تماماً (`allow_deletions: false`).
   - إلزام حل المحادثات والتعليقات قبل الدمج (`required_conversation_resolution: true`).
   - شمول وتطبيق الحماية التقنية على مديري المستودع (`enforce_admins: true`).
