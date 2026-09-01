'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useRef, useState } from 'react';
import {
  BoundedFrameCache,
  calculateFrameIndex,
  DecodedFrame,
  getFrameUrl,
  HERO_POC_MANIFEST,
  SequenceManifest,
} from '@/lib/motion/poc-frame-engine';

// Register ScrollTrigger plugin with GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STAGE_LABELS: Record<number, string> = {
  0: 'H0 — Initial Composition',
  1: 'H1 — Display Emergence',
  2: 'H2 — Scroll Control Active',
  3: 'H3 — Programming Sequence',
  4: 'H4 — Projects Sequence',
  5: 'H5 — Technologies Sequence',
  6: 'H6 — AI Workflow Sequence',
  7: 'H7 — Release State',
  8: 'H8 — Exit Transition',
};

export interface HeroMotionPocProps {
  manifest?: SequenceManifest;
}

export const HeroMotionPoc: React.FC<HeroMotionPocProps> = ({ manifest = HERO_POC_MANIFEST }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedSceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Low-frequency UI state only
  const [isLoaded, setIsLoaded] = useState(false);
  const [stageText, setStageText] = useState('H0 — Initial Composition');
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // High-frequency animation refs (local-first state, NO React render loop)
  const currentFrameRef = useRef<number>(0);
  const renderedFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);
  const cacheRef = useRef<BoundedFrameCache>(
    new BoundedFrameCache({ forwardPreload: 6, backwardWindow: 3 })
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !pinnedSceneRef.current || !canvasRef.current) return;

      const mm = gsap.matchMedia();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Abort controller for current variant
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      /**
       * Draws a decoded frame onto the Canvas 2D context using cover scaling.
       */
      const drawFrame = (frame: DecodedFrame) => {
        if (!canvas || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const imgWidth = frame.width;
        const imgHeight = frame.height;
        const scale = Math.max(canvas.width / imgWidth, canvas.height / imgHeight);
        const x = (canvas.width - imgWidth * scale) / 2;
        const y = (canvas.height - imgHeight * scale) / 2;

        ctx.drawImage(frame, x, y, imgWidth * scale, imgHeight * scale);
      };

      /**
       * Fetches and decodes frame image via createImageBitmap or Image fallback.
       */
      const loadFrame = async (
        basePath: string,
        pattern: string,
        index: number
      ): Promise<DecodedFrame | null> => {
        if (signal.aborted) return null;
        const url = getFrameUrl(basePath, pattern, index);

        try {
          const res = await fetch(url, { signal });
          if (!res.ok) return null;
          const blob = await res.blob();
          if (signal.aborted) return null;

          if (typeof createImageBitmap === 'function') {
            return await createImageBitmap(blob);
          } else {
            return new Promise<HTMLImageElement>((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => resolve(img);
              img.src = URL.createObjectURL(blob);
            });
          }
        } catch {
          return null;
        }
      };

      /**
       * Schedules frame render loop using RequestAnimationFrame.
       */
      const requestRender = (
        targetIndex: number,
        variantConfig: { frameCount: number; basePath: string; pattern: string }
      ) => {
        currentFrameRef.current = targetIndex;

        if (rafIdRef.current !== null) return;

        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          const idx = currentFrameRef.current;
          const cache = cacheRef.current;

          // Update window preloading
          cache.updateWindow(idx, variantConfig.frameCount, (i) =>
            loadFrame(variantConfig.basePath, variantConfig.pattern, i)
          );

          const frame = cache.getFrame(idx);
          if (frame && idx !== renderedFrameRef.current) {
            drawFrame(frame);
            renderedFrameRef.current = idx;

            // Low frequency stage label update
            const stageIndex = Math.min(8, Math.floor((idx / (variantConfig.frameCount - 1)) * 9));
            const newLabel = STAGE_LABELS[stageIndex] || STAGE_LABELS[0];
            setStageText(newLabel);
          }
        });
      };

      // 1. Reduced Motion Setup
      mm.add('(prefers-reduced-motion: reduce)', () => {
        setIsReducedMotion(true);
        setIsLoaded(true);

        // Load static poster / initial frame without pin
        const config = manifest.desktop;
        loadFrame(config.basePath, config.pattern, 0).then((frame) => {
          if (frame) drawFrame(frame);
        });

        return () => {
          setIsReducedMotion(false);
        };
      });

      // 2. Desktop Responsive Context (>= 1024px)
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        setIsReducedMotion(false);
        const config = manifest.desktop;

        // Preload first frame
        loadFrame(config.basePath, config.pattern, 0).then((frame) => {
          if (frame) {
            cacheRef.current.setFrame(0, frame);
            drawFrame(frame);
            renderedFrameRef.current = 0;
            setIsLoaded(true);
          }
        });

        const trigger = ScrollTrigger.create({
          trigger: containerRef.current,
          pin: pinnedSceneRef.current,
          start: 'top top',
          end: '+=300vh',
          scrub: true,
          onUpdate: (self) => {
            const idx = calculateFrameIndex(self.progress, config.frameCount);
            requestRender(idx, config);
          },
        });

        return () => {
          trigger.kill();
        };
      });

      // 3. Mobile Responsive Context (< 1024px)
      mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
        setIsReducedMotion(false);
        const config = manifest.mobile;

        loadFrame(config.basePath, config.pattern, 0).then((frame) => {
          if (frame) {
            cacheRef.current.setFrame(0, frame);
            drawFrame(frame);
            renderedFrameRef.current = 0;
            setIsLoaded(true);
          }
        });

        const trigger = ScrollTrigger.create({
          trigger: containerRef.current,
          pin: pinnedSceneRef.current,
          start: 'top top',
          end: '+=200vh',
          scrub: true,
          onUpdate: (self) => {
            const idx = calculateFrameIndex(self.progress, config.frameCount);
            requestRender(idx, config);
          },
        });

        return () => {
          trigger.kill();
        };
      });

      return () => {
        // Complete lifecycle cleanup
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        cacheRef.current.clear();
        mm.revert();
      };
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-slate-950 text-slate-100 overflow-hidden"
      data-testid="hero-motion-container"
    >
      {/* Pinned Scene Container */}
      <div
        ref={pinnedSceneRef}
        className="w-full h-screen relative flex flex-col items-center justify-center p-6"
        data-testid="hero-pinned-scene"
      >
        {/* Presentation Canvas (aria-hidden) */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
          data-testid="hero-canvas"
        />

        {/* Semantic Content Overlay */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-cyan-400">
            <span>{stageText}</span>
            {isReducedMotion && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Reduced Motion Active
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
            Cinematic Motion Architecture
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Scroll-driven frame sequence engine powered by GSAP, Canvas 2D, and Clean Architecture
            principles.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <span className="px-3 py-1 rounded bg-slate-900/60 border border-slate-800">
              Desktop Range: 300vh
            </span>
            <span className="px-3 py-1 rounded bg-slate-900/60 border border-slate-800">
              Mobile Range: 200vh
            </span>
            <span className="px-3 py-1 rounded bg-slate-900/60 border border-slate-800">
              {isLoaded ? 'Engine Status: READY' : 'Engine Status: INITIALIZING'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
