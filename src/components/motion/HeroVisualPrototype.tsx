'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useRef, useState } from 'react';
import styles from './HeroVisualPrototype.module.css';

// Register ScrollTrigger safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const STAGES = [
  { id: 0, label: 'H0 — Identity', title: 'الهوية والمعمارية' },
  { id: 1, label: 'H1 — Display Reveal', title: 'منصة العرض' },
  { id: 2, label: 'H2 — Engineering Env', title: 'البيئة الهندسيّة' },
  { id: 3, label: 'H3 — Programming', title: 'البرمجة والمعمارية' },
  { id: 4, label: 'H4 — Projects', title: 'المشاريع والتطبيقات' },
  { id: 5, label: 'H5 — Tech Stack', title: 'طبقات التقنية' },
  { id: 6, label: 'H6 — AI Workflow', title: 'مسار الذكاء الاصطناعي' },
  { id: 7, label: 'H7 — Consolidation', title: 'تكامل المنظومة' },
  { id: 8, label: 'H8 — Release Exit', title: 'خروج وانتقال' },
] as const;

export function HeroVisualPrototype() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedSceneRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  // Active stage for UI feedback & control bar
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // High-frequency timeline & scroll refs
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !pinnedSceneRef.current) return;

      const mm = gsap.matchMedia();

      // Check reduced motion
      mm.add('(prefers-reduced-motion: reduce)', () => {
        setIsReducedMotion(true);
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        setIsReducedMotion(false);

        // Timeline for 8 transitions (H0 -> H8)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=450%',
            pin: pinnedSceneRef.current,
            scrub: 0.5,
            onUpdate: (self) => {
              const progress = self.progress;
              const stageIndex = Math.min(Math.floor(progress * 8.99), 8);
              setActiveStage(stageIndex);
            },
          },
        });

        timelineRef.current = tl;

        // Visual display reveal animation on H1
        tl.to(displayRef.current, {
          scale: 1,
          borderColor: 'rgba(14, 165, 233, 0.4)',
          duration: 1,
          ease: 'power2.out',
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: containerRef }
  );

  /**
   * Jump to a specific stage (Prototype Review Utility)
   */
  const jumpToStage = (stageId: number) => {
    setActiveStage(stageId);
    if (timelineRef.current && timelineRef.current.scrollTrigger) {
      const targetProgress = stageId / 8;
      timelineRef.current.scrollTrigger.scroll(
        timelineRef.current.scrollTrigger.start +
          targetProgress *
            (timelineRef.current.scrollTrigger.end - timelineRef.current.scrollTrigger.start)
      );
    }
  };

  return (
    <div dir="rtl" lang="ar" className={styles.prototypeRoot} ref={containerRef}>
      {/* Background Decorative Grid */}
      <div className={styles.gridBackground} aria-hidden="true" />

      {/* Main Pinned Stage Container */}
      <div
        ref={pinnedSceneRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10"
      >
        {/* Header Branding Badge */}
        <div className="mb-6 flex items-center gap-3">
          <span className={styles.statusBadge}>
            <span className={styles.statusIndicator} />
            <span className="font-mono text-xs tracking-wider">
              ENGINEERED CINEMATIC // PROTOTYPE
            </span>
          </span>
          <span className="text-xs font-mono text-slate-500">{STAGES[activeStage]?.label}</span>
        </div>

        {/* H0 — Identity Hero Title (DOM Copy) */}
        <header className="text-center max-w-3xl mb-8 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            عيسى علي <span className="text-cyan-400 font-normal">|</span> معمارية البرمجيات والذكاء
            الاصطناعي
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            بناء أنظمة عالية الأداء بالاعتماد على معمارية البرمجيات النظيفة ومسارات الذكاء الاصطناعي
            المستقلة.
          </p>
        </header>

        {/* Hybrid Engineered Display Anchor */}
        <div ref={displayRef} className={styles.displayContainer}>
          {/* Display Top Bar */}
          <div className={styles.displayHeader}>
            <div className={styles.windowControls}>
              <div className={styles.windowDot} />
              <div className={styles.windowDot} />
              <div className={styles.windowDot} />
              <span className="ms-2 dir-ltr text-slate-400 font-mono text-xs">
                maywebeissa.system
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="text-cyan-400">STATE: {STAGES[activeStage]?.label}</span>
              <span>FPS: ADAPTIVE</span>
            </div>
          </div>

          {/* Viewport Surface Layers (H0 - H8) */}
          <div className={styles.viewportSurface}>
            {/* H0 — Identity Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 0 ? styles.stageLayerActive : ''}`}
            >
              <div className="text-center space-y-4 my-auto">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
                  H00 // INITIAL COMPOSITION
                </div>
                <h2 className="text-2xl font-bold text-slate-100">نظام هندسي متكامل</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  تكامل الهوية البصرية الهندسيّة مع بيئة العمل البرمجيّة التفاعليّة.
                </p>
              </div>
            </div>

            {/* H1 — Display Emergence Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 1 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-4 my-auto text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-xs font-mono text-cyan-300">
                  H01 // DISPLAY EMERGENCE
                </div>
                <h2 className="text-2xl font-bold text-slate-100">إطار العرض الهندسي المزدوج</h2>
                <p className="text-sm text-slate-400 max-w-lg mx-auto">
                  تصميم حواف المنصة بدقة عالية مع نسبة 16:9 للحواسيب وإعادة الترتيب التلقائي للهواتف
                  المحمولة.
                </p>
              </div>
            </div>

            {/* H2 — Engineering Environment Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 2 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-4 my-auto">
                <div className="text-xs font-mono text-cyan-400">
                  H02 // SYSTEM GRID & COORDINATES
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div className="text-slate-500">// ENGINE STATE</div>
                    <div>SCROLL_SCRUB: ACTIVE</div>
                    <div>MEMORY_BOUND: SAFE</div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                    <div className="text-slate-500">// ARCHITECTURE</div>
                    <div>BOUNDARY: STRICT</div>
                    <div>CLEAN_ISLAND: ISOLATED</div>
                  </div>
                </div>
              </div>
            </div>

            {/* H3 — Programming Sequence Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 3 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto dir-ltr text-left">
                <div className="text-xs font-mono text-cyan-400">
                  H03 // PROGRAMMING LANGUAGE & CODE
                </div>
                <div className={styles.codeCard}>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>01</span>
                    <span>
                      <span className="text-purple-400">export class</span>{' '}
                      <span className="text-cyan-300">AIPipelineEngine</span> &#123;
                    </span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>02</span>
                    <span className="ps-4 text-slate-400">
                      <span className="text-purple-400">private readonly</span> boundary ={' '}
                      <span className="text-emerald-400">&apos;CLEAN_ARCHITECTURE&apos;</span>;
                    </span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>03</span>
                    <span className="ps-4 text-slate-400">
                      <span className="text-purple-400">async</span> executeScrub(
                      <span className="text-amber-300">progress: number</span>) &#123;
                    </span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>04</span>
                    <span className="ps-8 text-cyan-400">
                      return await this.renderNextFrame(progress);
                    </span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>05</span>
                    <span className="ps-4 text-slate-400">&#125;</span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>06</span>
                    <span>&#125;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* H4 — Projects Sequence Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 4 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto">
                <div className="text-xs font-mono text-cyan-400">H04 // PROJECTS SHOWCASE</div>
                <div className={styles.projectGrid}>
                  <div className={styles.projectCard}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">منظومة إدارة المخزون</span>
                      <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        DEMO_SURFACE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      نظام متكامل لتتبع وإدارة المخزون والعمليات الميدانية.
                    </p>
                  </div>
                  <div className={styles.projectCard}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">منصة التحليل والتكامل</span>
                      <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        SYSTEM_ARCH
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      معمارية مايكروسيرفس موحدة للذكاء الاصطناعي والبيانات.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* H5 — Technology Sequence Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 5 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto">
                <div className="text-xs font-mono text-cyan-400">
                  H05 // TECHNOLOGY STACK LAYERS
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-cyan-400 font-bold mb-1">01. Languages & Runtime</div>
                    <div className="text-slate-400">TypeScript, Python, Node.js, Go</div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-cyan-400 font-bold mb-1">02. Frontend & Motion</div>
                    <div className="text-slate-400">Next.js, React, Tailwind CSS, GSAP</div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-cyan-400 font-bold mb-1">03. Data & Persistence</div>
                    <div className="text-slate-400">PostgreSQL, Drizzle ORM, Redis</div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-cyan-400 font-bold mb-1">04. AI & Workflows</div>
                    <div className="text-slate-400">Gemini API, PyTorch, Custom Agents</div>
                  </div>
                </div>
              </div>
            </div>

            {/* H6 — AI Workflow Sequence Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 6 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-4 my-auto">
                <div className="text-xs font-mono text-amber-400">H06 // AI WORKFLOW PIPELINE</div>
                <div className={styles.pipelineFlow}>
                  <div className={styles.pipelineNode}>
                    <div className="text-slate-400 text-xs">PROMPT</div>
                    <div className="font-bold text-slate-200 text-xs">الفكرة والتوجيه</div>
                  </div>
                  <div className="text-slate-600 font-mono">➔</div>
                  <div className={`${styles.pipelineNode} ${styles.pipelineNodeAi}`}>
                    <div className="text-amber-400 text-xs">AGENT</div>
                    <div className="font-bold text-amber-300 text-xs">وكيل التنفيذ</div>
                  </div>
                  <div className="text-slate-600 font-mono">➔</div>
                  <div className={styles.pipelineNode}>
                    <div className="text-slate-400 text-xs">CODE</div>
                    <div className="font-bold text-slate-200 text-xs">التوليد البرمجي</div>
                  </div>
                  <div className="text-slate-600 font-mono">➔</div>
                  <div className={styles.pipelineNode}>
                    <div className="text-slate-400 text-xs">DEPLOY</div>
                    <div className="font-bold text-slate-200 text-xs">النشر التلقائي</div>
                  </div>
                </div>
              </div>
            </div>

            {/* H7 — Consolidation Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 7 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-4 my-auto text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs font-mono text-cyan-300">
                  H07 // CAPABILITY CONSOLIDATION
                </div>
                <h2 className="text-2xl font-bold text-slate-100">منظومة عمل متكاملة</h2>
                <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                  توحيد المعمارية البرمجية، الأداء البصري العالي، ومسارات الذكاء الاصطناعي في واجهة
                  موحدة.
                </p>
              </div>
            </div>

            {/* H8 — Release Exit Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 8 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-4 my-auto text-center">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
                  H08 // RELEASE EXIT
                </div>
                <h2 className="text-xl font-bold text-slate-200">
                  الانتقال السلس للمحتوى التفصيلي
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تحرر المنصة التفاعلية بسلاسة نحو باقي أجزاء الصفحة.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center gap-4">
          <button className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-950/50">
            استكشف المعمارية
          </button>
          <button className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition-all">
            المشاريع والحلول
          </button>
        </div>
      </div>

      {/* Prototype Review Stage Jump Bar */}
      <nav aria-label="Prototype Stage Jump Selector" className={styles.stageControlBar}>
        <span className="text-[10px] font-mono text-slate-400 pe-2 border-e border-slate-800">
          PROTOTYPE STAGES:
        </span>
        {STAGES.map((stg) => (
          <button
            key={stg.id}
            onClick={() => jumpToStage(stg.id)}
            className={`${styles.stageBtn} ${activeStage === stg.id ? styles.stageBtnActive : ''}`}
            title={stg.title}
          >
            H{stg.id}
          </button>
        ))}
      </nav>
    </div>
  );
}
