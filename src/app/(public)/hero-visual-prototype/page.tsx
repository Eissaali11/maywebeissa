import type { Metadata } from 'next';
import { HeroVisualPrototype } from '@/components/motion/HeroVisualPrototype';

export const metadata: Metadata = {
  title: 'Engineered Cinematic Hero Visual Prototype | maywebeissa',
  description:
    'High-fidelity visual prototype for the Hero component implementing Direction A (Engineered Cinematic) design language.',
};

/**
 * Isolated Server Component Route Page Shell for UI-HERO-VISUAL-PROTOTYPE-001.
 * This route is dedicated visual validation infrastructure for reviewing the Hero visual identity.
 */
export default function HeroVisualPrototypePage() {
  return (
    <main className="w-full min-h-screen bg-[#090A0F] text-[#F4F5F7]">
      {/* 1. Hero Visual Prototype Island */}
      <section aria-label="Hero Visual Prototype Showcase">
        <HeroVisualPrototype />
      </section>

      {/* 2. Visual Direction Review Summary (Semantic DOM Content) */}
      <section
        aria-label="Prototype Governance Summary"
        className="max-w-5xl mx-auto px-6 py-24 space-y-12 border-t border-slate-900"
      >
        <div className="p-8 rounded-2xl bg-[#12141D] border border-slate-800 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-mono">
            UI-HERO-VISUAL-PROTOTYPE-001 — Visual Governance Review
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            الاتجاه البصري التجريبي: Engineered Cinematic (Direction A)
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            تم بناء هذا البروفايل التجريبي لعرض الهوية البصرية المقترحة لعنصر الـ Hero مع المحافظة
            التامة على معمارية الحركة التي تم إثباتها في مرحلة POC دون تعديل ملفات النواتية أو الكود
            الداخلي للمشروع.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#12141D]/60 border border-slate-800/80 space-y-2">
            <h3 className="text-sm font-semibold text-cyan-400 font-mono">01. Scoped Tokens</h3>
            <p className="text-xs text-slate-400">
              استخدام متغيرات CSS معزولة محلياً بدون تجميد النهائي لنظام التصميم العالمي.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#12141D]/60 border border-slate-800/80 space-y-2">
            <h3 className="text-sm font-semibold text-cyan-400 font-mono">02. Accent Hierarchy</h3>
            <p className="text-xs text-slate-400">
              اللون السماوي (Cyan) كلون تقني رئيسي غالي، والذهبي (Amber) كلون انتقائي لمراحل الذكاء
              الاصطناعي.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-[#12141D]/60 border border-slate-800/80 space-y-2">
            <h3 className="text-sm font-semibold text-cyan-400 font-mono">
              03. RTL & Accessibility
            </h3>
            <p className="text-xs text-slate-400">
              دعم شامل للغة العربية RTL وتخصيص الجزر البرمجية بـ LTR ومعايير التباين ودعم التباعد
              المنطقي.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
