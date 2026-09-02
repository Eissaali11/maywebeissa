'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useEffect, useRef, useState } from 'react';
import {
  AsyncTokenManager,
  DecodedFrame,
  drawCoverFrame,
  EissaLabsFrameCache,
  lookupFrameIndexByProgress,
  ManifestFrameEntry,
  releaseDecodedFrame,
  validateManifest,
} from '../../lib/motion/eissa-labs-frame-engine';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active stage for UI feedback & control bar
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [manifestLoaded, setManifestLoaded] = useState<boolean>(false);

  // High-frequency timeline & frame engine refs
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const manifestRef = useRef<ManifestFrameEntry[]>([]);
  const tokenManagerRef = useRef<AsyncTokenManager>(new AsyncTokenManager());
  const cacheRef = useRef<EissaLabsFrameCache | null>(null);
  const currentFrameIndexRef = useRef<number>(0);

  // Initialize frame cache with token manager (Bounded capacity = 20)
  if (!cacheRef.current) {
    cacheRef.current = new EissaLabsFrameCache(tokenManagerRef.current, {
      maxCacheSize: 20,
      forwardPreloadWindow: 8,
      backwardPreloadWindow: 4,
    });
  }

  // Expose telemetry getter to window for development/testing
  useEffect(() => {
    if (typeof window !== 'undefined' && cacheRef.current) {
      const win = window as unknown as {
        __FRAME_ENGINE_TELEMETRY__?: () => unknown;
        __FRAME_ENGINE_SET_MAX_CACHE__?: (cap: number) => void;
      };
      win.__FRAME_ENGINE_TELEMETRY__ = () => cacheRef.current?.getTelemetry();
      win.__FRAME_ENGINE_SET_MAX_CACHE__ = (cap: number) => cacheRef.current?.setMaxCacheSize(cap);
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __FRAME_ENGINE_TELEMETRY__?: unknown })
          .__FRAME_ENGINE_TELEMETRY__;
        delete (window as unknown as { __FRAME_ENGINE_SET_MAX_CACHE__?: unknown })
          .__FRAME_ENGINE_SET_MAX_CACHE__;
      }
    };
  }, []);

  /**
   * Async Frame Loader with Stale Generation Token Hardening
   */
  const loadFrame = async (
    entry: ManifestFrameEntry,
    token: number
  ): Promise<DecodedFrame | null> => {
    if (!tokenManagerRef.current.isValidToken(token)) {
      return null;
    }

    try {
      if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
        const response = await fetch(entry.file);
        if (!response.ok) return null;

        // Check token again after async network fetch
        if (!tokenManagerRef.current.isValidToken(token)) {
          return null;
        }

        const blob = await response.blob();
        if (!tokenManagerRef.current.isValidToken(token)) {
          return null;
        }

        return await createImageBitmap(blob);
      } else {
        return new Promise<DecodedFrame | null>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (tokenManagerRef.current.isValidToken(token)) {
              resolve(img);
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = entry.file;
        });
      }
    } catch {
      return null;
    }
  };

  /**
   * Render frame onto Canvas 2D buffer
   */
  const renderFrameAtIndex = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !cacheRef.current || manifestRef.current.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    currentFrameIndexRef.current = index;

    // Trigger frame window preload & cache update
    cacheRef.current.updateWindow(index, manifestRef.current, loadFrame);

    // Perform explicit cache lookup
    const decodedFrame = cacheRef.current.getFrame(index);
    if (decodedFrame) {
      drawCoverFrame(ctx, decodedFrame, canvas.width, canvas.height);
    } else {
      // Fallback: if targeted frame is still loading, draw nearest available frame
      for (let offset = 1; offset <= 5; offset++) {
        const fallbackFrame =
          cacheRef.current.getFrame(index - offset) || cacheRef.current.getFrame(index + offset);
        if (fallbackFrame) {
          drawCoverFrame(ctx, fallbackFrame, canvas.width, canvas.height);
          break;
        }
      }
    }
  };

  /**
   * Resize Canvas drawing buffer to physical CSS display dimensions
   */
  const syncCanvasDimensions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    const newWidth = Math.round(rect.width * dpr);
    const newHeight = Math.round(rect.height * dpr);

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      renderFrameAtIndex(currentFrameIndexRef.current);
    }
  };

  // Load sequence manifest on mount
  useEffect(() => {
    let isMounted = true;
    const activeToken = tokenManagerRef.current.nextToken();

    fetch('/media/eissa-labs-hero/manifest.json')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !tokenManagerRef.current.isValidToken(activeToken)) return;

        if (validateManifest(data)) {
          manifestRef.current = data;
          setManifestLoaded(true);

          // Initial render of first frame (H0)
          setTimeout(() => {
            syncCanvasDimensions();
            renderFrameAtIndex(0);
          }, 50);
        }
      })
      .catch((err) => {
        console.error('Failed to load Eissa Labs Hero frame sequence manifest:', err);
      });

    const handleResize = () => {
      // Invalidate old pending loads on window resize
      tokenManagerRef.current.nextToken();
      syncCanvasDimensions();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      tokenManagerRef.current.invalidate();
      if (cacheRef.current) {
        cacheRef.current.clear();
      }
    };
  }, []);

  // Set up GSAP ScrollTrigger scrubbing animation
  useGSAP(
    () => {
      if (!containerRef.current || !pinnedSceneRef.current) return;

      const mm = gsap.matchMedia();

      // Reduced motion preference
      mm.add('(prefers-reduced-motion: reduce)', () => {
        setIsReducedMotion(true);
        tokenManagerRef.current.nextToken();
        renderFrameAtIndex(0);
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        setIsReducedMotion(false);

        // Timeline mapping scroll progress to sequence progress & UI stages
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=450%',
            pin: pinnedSceneRef.current,
            scrub: 0.3,
            onUpdate: (self) => {
              const progress = self.progress;
              const stageIndex = Math.min(Math.floor(progress * 8.99), 8);
              setActiveStage(stageIndex);

              // Map scroll progress to adaptive WebP frame index
              if (manifestRef.current.length > 0) {
                const frameIndex = lookupFrameIndexByProgress(manifestRef.current, progress);
                renderFrameAtIndex(frameIndex);
              }
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
    { scope: containerRef, dependencies: [manifestLoaded] }
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

      if (manifestRef.current.length > 0) {
        const frameIndex = lookupFrameIndexByProgress(manifestRef.current, targetProgress);
        renderFrameAtIndex(frameIndex);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.prototypeRoot}
      dir="rtl"
      lang="ar"
      data-testid="hero-visual-prototype"
    >
      {/* Background Atmospheric Grid */}
      <div className={styles.gridBackground} aria-hidden="true" />

      {/* Pinned Viewport Container */}
      <div
        ref={pinnedSceneRef}
        className="min-h-screen w-full flex items-center justify-center p-4 md:p-8"
      >
        {/* Hybrid Engineered Display Frame */}
        <div ref={displayRef} className={styles.displayContainer}>
          {/* Display Header / Telemetry Bar */}
          <div className={styles.displayHeader}>
            <div className={styles.windowControls}>
              <span className={styles.windowDot} />
              <span className={styles.windowDot} />
              <span className={styles.windowDot} />
              <span className="mr-2 text-slate-400 font-semibold">
                EISSA LABS // CINEMATIC ENGINE
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-slate-400">
                FRAME: {String(currentFrameIndexRef.current + 1).padStart(4, '0')} /{' '}
                {manifestRef.current.length || 52}
              </span>
              <div className={styles.statusBadge}>
                <span className={styles.statusIndicator} />
                <span>{STAGES[activeStage]?.label || 'H00 // CINEMATIC PROTOTYPE'}</span>
              </div>
            </div>
          </div>

          {/* Main Viewport Content Surface */}
          <div className={styles.viewportSurface}>
            {/* Background Frame Sequence Canvas */}
            <canvas ref={canvasRef} className={styles.sequenceCanvas} aria-hidden="true" />

            {/* H0 — Identity Stage Overlay */}
            <div
              className={`${styles.stageLayer} ${activeStage === 0 ? styles.stageLayerActive : ''}`}
            >
              <div className="max-w-2xl mx-auto text-center space-y-4 my-auto relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono">
                  <span>EISSA LABS // CINEMATIC TECHNICAL PROTOTYPE</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  عيسى مبيوع
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200 text-2xl md:text-4xl mt-1">
                    مهندس برمجيات ومعماري أنظمة ذكية
                  </span>
                </h1>
                <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                  تطوير الميكروسيرفس، معمارية البيانات، وأنظمة الذكاء الاصطناعي المستقلة بجودة
                  إنتاجية عالية.
                </p>
                <div className="pt-2 flex items-center justify-center gap-4">
                  <button className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-cyan-500/20">
                    استكشف المعمارية
                  </button>
                  <button className="px-5 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm transition-colors">
                    معرض المشاريع
                  </button>
                </div>
              </div>
            </div>

            {/* H1 — Display Reveal Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 1 ? styles.stageLayerActive : ''}`}
            >
              <div className="max-w-xl space-y-2 relative z-10">
                <div className="text-xs font-mono text-cyan-400">
                  H01 // DISPLAY REVEAL & SYSTEM ENTRY
                </div>
                <h2 className="text-2xl font-bold text-white">منظومة العرض الهندسي البصري</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  رحلة سينمائية تقنية من بيئة العمل إلى قلب الكود وأنظمة الذكاء الاصطناعي.
                </p>
              </div>
            </div>

            {/* H2 — Engineering Environment Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 2 ? styles.stageLayerActive : ''}`}
            >
              <div className="max-w-xl space-y-2 relative z-10">
                <div className="text-xs font-mono text-cyan-400">
                  H02 // ENGINEERING ENVIRONMENT
                </div>
                <h2 className="text-2xl font-bold text-white">بيئة التطوير والهندسة البرمجية</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  أنظمة قياس حية وتتبع دقيق لمراحل بناء البرمجيات والأنظمة.
                </p>
              </div>
            </div>

            {/* H3 — Programming Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 3 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto dir-ltr text-left relative z-10">
                <div className="text-xs font-mono text-cyan-400">
                  H03 // PROGRAMMING & CORE SYSTEM
                </div>
                <div className={styles.codeCard}>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>01</span>
                    <span className="text-purple-400">export async function</span>{' '}
                    <span className="text-blue-400">executeAgentWorkflow</span>
                    <span className="text-slate-300">(task: AgentTask)</span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>02</span>
                    <span className="text-slate-300">
                      {'  '}
                      <span className="text-purple-400">const</span> result ={' '}
                      <span className="text-purple-400">await</span> pipeline.
                      <span className="text-yellow-400">process</span>(task);
                    </span>
                  </div>
                  <div className={styles.codeLine}>
                    <span className={styles.lineNumber}>03</span>
                    <span className="text-slate-300">
                      {'  '}
                      <span className="text-purple-400">return</span> auditLogger.
                      <span className="text-cyan-400">recordImmutable</span>(result);
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* H4 — Projects Sequence Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 4 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto relative z-10">
                <div className="text-xs font-mono text-cyan-400">H04 // PROJECTS SHOWCASE</div>
                <div className={styles.projectGrid}>
                  <div className={styles.projectCard}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">منظومة إدارة المخزون</span>
                      <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        DEMO_SURFACE
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
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
                    <p className="text-xs text-slate-300">
                      معمارية مايكروسيرفس موحدة للذكاء الاصطناعي والبيانات.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* H5 — Technologies / Architecture Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 5 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto relative z-10">
                <div className="text-xs font-mono text-cyan-400">H05 // ARCHITECTURE STACK</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-cyan-400 block font-bold">01 // CORE</span>
                    <span className="text-slate-200">Next.js / TypeScript</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-cyan-400 block font-bold">02 // DATA</span>
                    <span className="text-slate-200">PostgreSQL / Drizzle</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-cyan-400 block font-bold">03 // AUTH</span>
                    <span className="text-slate-200">Better Auth Runtime</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-cyan-400 block font-bold">04 // MOTION</span>
                    <span className="text-slate-200">GSAP / Adaptive Canvas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* H6 — AI Workflow Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 6 ? styles.stageLayerActive : ''}`}
            >
              <div className="space-y-3 my-auto relative z-10">
                <div className="text-xs font-mono text-amber-400">H06 // AI WORKFLOW PIPELINE</div>
                <div className={styles.pipelineFlow}>
                  <div className={styles.pipelineNode}>
                    <span className="block text-slate-400 text-[10px]">01 INPUT</span>
                    Prompt / Spec
                  </div>
                  <div className="text-amber-400 text-xs font-bold">➔</div>
                  <div className={`${styles.pipelineNode} ${styles.pipelineNodeAi}`}>
                    <span className="block text-amber-400/70 text-[10px]">02 AGENT</span>
                    Synthesis
                  </div>
                  <div className="text-amber-400 text-xs font-bold">➔</div>
                  <div className={styles.pipelineNode}>
                    <span className="block text-slate-400 text-[10px]">03 CODE</span>
                    AST & Verify
                  </div>
                  <div className="text-amber-400 text-xs font-bold">➔</div>
                  <div className={styles.pipelineNode}>
                    <span className="block text-slate-400 text-[10px]">04 DEPLOY</span>
                    Production
                  </div>
                </div>
              </div>
            </div>

            {/* H7 — Capability Consolidation Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 7 ? styles.stageLayerActive : ''}`}
            >
              <div className="max-w-xl space-y-2 relative z-10">
                <div className="text-xs font-mono text-cyan-400">
                  H07 // CAPABILITY CONSOLIDATION
                </div>
                <h2 className="text-2xl font-bold text-white">تكامل الحلول والمعمارية الشاملة</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ربط هندسة البرمجيات بالذكاء الاصطناعي وبنية البيانات الموثوقة.
                </p>
              </div>
            </div>

            {/* H8 — Release Exit Stage */}
            <div
              className={`${styles.stageLayer} ${activeStage === 8 ? styles.stageLayerActive : ''}`}
            >
              <div className="max-w-xl space-y-2 relative z-10">
                <div className="text-xs font-mono text-cyan-400">H08 // RELEASE & REVERSE EXIT</div>
                <h2 className="text-2xl font-bold text-white">جاهزية الإطلاق والعودة السلسة</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  نهاية العرض السينمائي والعودة إلى الشاشة الرئيسية التفاعلية.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Jump Control Bar (Prototype Review Utility Only) */}
      <div className={styles.stageControlBar} data-testid="stage-control-bar">
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
      </div>
    </div>
  );
}
