# SRS-001 — مصفوفة التتبع الكاملة (Traceability Matrix)

**إجمالي: 44 صف (43 متطلب + صف واحد لـ AC-FR-SEO-002-b)**

| Requirement ID | Requirement Summary | Target Module | Acceptance Criterion ID | Test Type | Planned Test Location |
| --- | --- | --- | --- | --- | --- |
| FR-AUTH-001 | آلية دخول مدير واحد مع جلسة محمية | `src/modules/auth` | AC-FR-AUTH-001 | Integration | `src/modules/auth/__tests__/login.integration.test.ts` |
| FR-AUTH-002 | توجيه تلقائي لـ `/admin/login` عند غياب جلسة | `src/modules/auth` | AC-FR-AUTH-002 | Integration | `src/modules/auth/__tests__/admin-route-guard.integration.test.ts` |
| FR-AUTH-003 | رسالة خطأ موحدة لا تكشف وجود الحساب | `src/modules/auth` | AC-FR-AUTH-003 | Integration | `src/modules/auth/__tests__/login-error-message.integration.test.ts` |
| FR-AUTH-004 | حصر معدل المحاولات الفاشلة | `src/modules/auth` | AC-FR-AUTH-004 | Integration | `src/modules/auth/__tests__/rate-limit.integration.test.ts` |
| FR-AUTH-005 | فحص الجلسة قبل أي عملية تعديل | `src/modules/auth` | AC-FR-AUTH-005 | Integration | `src/modules/auth/__tests__/mutation-guard.integration.test.ts` |
| FR-POSTS-001 | إنشاء وتعديل وأرشفة المقالات Markdown | `src/modules/posts` | AC-FR-POSTS-001 | Integration | `src/modules/posts/__tests__/create-post.integration.test.ts` |
| FR-POSTS-002 | تصنيفات ووسوم مع تصفية عامة | `src/modules/posts` | AC-FR-POSTS-002 | E2E | `src/modules/posts/__tests__/filter-posts.e2e.test.ts` |
| FR-POSTS-003 | جدول محتويات تلقائي (TOC) وSyntax Highlighting | `src/modules/posts` | AC-FR-POSTS-003 | E2E | `src/modules/posts/__tests__/post-detail-ui.e2e.test.ts` |
| FR-POSTS-004 | سجل تدقيق + Cache Revalidation فور النشر | `src/modules/posts` | AC-FR-POSTS-004 | Integration | `src/modules/posts/__tests__/publish-revalidation.integration.test.ts` |
| FR-PROJECTS-001 | إنشاء وتعديل وأرشفة المشاريع | `src/modules/projects` | AC-FR-PROJECTS-001 | Integration | `src/modules/projects/__tests__/create-project.integration.test.ts` |
| FR-PROJECTS-002 | تصفية المشاريع بوسوم التقنيات | `src/modules/projects` | AC-FR-PROJECTS-002 | E2E | `src/modules/projects/__tests__/filter-projects.e2e.test.ts` |
| FR-PROJECTS-003 | ربط غلاف المشروع بأصل Presigned | `src/modules/projects` | AC-FR-PROJECTS-003 | Integration | `src/modules/projects/__tests__/link-media-cover.integration.test.ts` |
| FR-MEDIA-001 | رفع مباشر للمخزن عبر Presigned URL | `src/modules/media` | AC-FR-MEDIA-001 | Architecture + Integration | `src/modules/media/__tests__/presigned-upload-flow.integration.test.ts` |
| FR-MEDIA-002 | حظر تدفق الثنائيات عبر خادم التطبيق | `src/modules/media` | AC-FR-MEDIA-002 | Integration | `src/modules/media/__tests__/no-binary-in-server.integration.test.ts` |
| FR-MEDIA-003 | فحص MIME وحجم وامتداد الملف قبل Presigned | `src/modules/media` | AC-FR-MEDIA-003 | Integration | `src/modules/media/__tests__/mime-validation.integration.test.ts` |
| FR-MEDIA-004 | معالجة حالات فشل الرفع | `src/modules/media` | AC-FR-MEDIA-004 | Integration | `src/modules/media/__tests__/expired-presigned-url.integration.test.ts` |
| FR-MEDIA-005 | تسجيل الأصل في DB + سجل تدقيق | `src/modules/media` | AC-FR-MEDIA-005 | Integration | `src/modules/media/__tests__/confirm-upload.integration.test.ts` |
| FR-CONTACT-001 | نموذج تواصل مع Honeypot + Rate Limiting | `src/modules/contact` | AC-FR-CONTACT-001 | Integration | `src/modules/contact/__tests__/submit-contact.integration.test.ts` |
| FR-CONTACT-002 | عرض الرسائل في لوحة التحكم مع إمكانية الأرشفة | `src/modules/contact` | AC-FR-CONTACT-002 | Integration | `src/modules/contact/__tests__/admin-inbox.integration.test.ts` |
| FR-ADMIN-001 | لوحة ملخص تنفيذي بالإحصائيات | `src/app/admin` | AC-FR-ADMIN-001 | E2E | `src/app/admin/__tests__/dashboard.e2e.test.ts` |
| FR-ADMIN-002 | سجل تدقيق ذري لكل عملية إدارية | `src/modules/audit` | AC-FR-ADMIN-002 | Integration | `src/modules/audit/__tests__/audit-log-publish.integration.test.ts` |
| FR-SEO-001 | OpenGraph وMeta Tags ديناميكية | `src/app` (Metadata API) | AC-FR-SEO-001 | E2E | `src/app/__tests__/seo-meta.e2e.test.ts` |
| FR-SEO-002 | `sitemap.xml` و`robots.txt` وJSON-LD | `src/app` (Metadata API) | AC-FR-SEO-002-a / AC-FR-SEO-002-b | E2E | `src/app/__tests__/sitemap.e2e.test.ts` · `src/app/__tests__/robots-txt.e2e.test.ts` |
| NFR-PERF-001 | Lighthouse Performance ≥ 90 | — (CI Pipeline) | AC-NFR-PERF-001 | Performance (CI) | `.github/workflows/lighthouse.yml` |
| NFR-PERF-002 | LCP ≤ 2.5 ثانية | — (CI Pipeline) | AC-NFR-PERF-002 | Performance (CI) | `.github/workflows/lighthouse.yml` |
| NFR-PERF-003 | CLS ≤ 0.1 | — (CI Pipeline) | AC-NFR-PERF-003 | Performance (CI) | `.github/workflows/lighthouse.yml` |
| NFR-SEC-001 | حماية من XSS, CSRF, SQLi | `src/lib/security` | AC-NFR-SEC-001 | Security | `src/lib/security/__tests__/xss-sanitization.security.test.ts` |
| NFR-SEC-002 | ترويسات أمان صارمة | `src/app` (middleware) | AC-NFR-SEC-002 | Security | `src/app/__tests__/security-headers.security.test.ts` |
| NFR-SEC-003 | تشفير آمن لكلمات المرور | `src/modules/auth` | AC-NFR-SEC-003 | Security | `src/modules/auth/__tests__/password-storage.security.test.ts` |
| NFR-SEC-004 | مستودع خالٍ من الأسرار | — (CI Secretlint) | AC-NFR-SEC-004 | Security (CI) | `.github/workflows/ci.yml` |
| NFR-UX-001 | دعم RTL وArabic Native | `src/app` (layout) | AC-NFR-UX-001 | Accessibility (E2E) | `src/app/__tests__/rtl-layout.e2e.test.ts` |
| NFR-UX-002 | تصميم متجاوب 320px–4K | `src/components` | AC-NFR-UX-002 | E2E (Responsive) | `src/app/__tests__/responsive-layout.e2e.test.ts` |
| NFR-UX-003 | WCAG 2.2 AA (تباين ≥ 4.5:1، تنقل بوحة) | `src/components` | AC-NFR-UX-003 | Accessibility (Axe) | `src/app/__tests__/wcag-contrast.accessibility.test.ts` |
| NFR-OPS-001 | سجلات تدقيق غير قابلة للتعديل | `src/modules/audit` | AC-NFR-OPS-001 | Integration | `src/modules/audit/__tests__/immutable-audit-log.integration.test.ts` |
| NFR-OPS-002 | معمارية قابلة للنسخ الاحتياطي | — (Operational) | AC-NFR-OPS-002 | Operational (Manual) | `docs/operations/BACKUP-PROCEDURE.md` |
| NFR-3D-001 | 3D محدود بـ Hero والمشاريع فقط | `src/components/three` | AC-NFR-3D-001 | Unit + E2E | `src/components/three/__tests__/no-3d-on-posts.unit.test.ts` |
| NFR-3D-002 | تحميل كسول لأصول 3D | `src/components/three` | AC-NFR-3D-002 | Performance (E2E) | `src/components/three/__tests__/lazy-load-timing.e2e.test.ts` |
| NFR-3D-003 | بديل 2D عند غياب WebGL | `src/components/three` | AC-NFR-3D-003 | Browser Compatibility (E2E) | `src/components/three/__tests__/fallback-2d.e2e.test.ts` |
| NFR-3D-004 | تعطيل الحركة مع `prefers-reduced-motion` | `src/components/three` | AC-NFR-3D-004 | Accessibility (E2E) | `src/components/three/__tests__/reduced-motion.e2e.test.ts` |
| NFR-3D-005 | 3D لا يعيق الإتاحة أو SEO | `src/components/three` | AC-NFR-3D-005 | Accessibility (Axe) | `src/components/three/__tests__/3d-accessibility-tree.accessibility.test.ts` |
