import type { Metadata } from 'next';
import { HeroMotionPoc } from '@/components/motion/HeroMotionPoc';

export const metadata: Metadata = {
  title: 'UI Motion Architecture POC | maywebeissa',
  description:
    'Proof of Concept for GSAP ScrollTrigger Canvas 2D frame sequence engine adhering to Clean Architecture boundaries.',
};

/**
 * Isolated Server Component Route Page Shell for UI-MOTION-POC-001.
 * This route is dedicated engineering infrastructure for validating motion architecture.
 */
export default function MotionPocPage() {
  return (
    <main className="w-full bg-slate-950 text-slate-100 min-h-screen">
      {/* 1. Motion Island Hero Section */}
      <section aria-label="Hero Motion Showcase">
        <HeroMotionPoc />
      </section>

      {/* 2. Semantic DOM Sections (Untouched by Canvas) */}
      <section
        aria-label="POC Narrative Content"
        className="max-w-5xl mx-auto px-6 py-24 space-y-16"
      >
        <article className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono">
            Architecture Boundary Verification
          </div>
          <h2 className="text-3xl font-bold text-slate-100">
            Clean Architecture & Isolated Motion Islands
          </h2>
          <p className="text-slate-300 leading-relaxed">
            The frame sequence rendering engine is completely isolated within a presentation Client
            Component island. No database adapters, ORM schemas, or core application use cases are
            imported or executed inside the motion pipeline.
          </p>
        </article>

        <article className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <h3 className="text-lg font-semibold text-cyan-400 font-mono">01. Native Scroll</h3>
            <p className="text-sm text-slate-400">
              Uses native browser scrolling without wheel hijacking or heavy custom smooth scroll
              wrappers.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <h3 className="text-lg font-semibold text-cyan-400 font-mono">02. Bounded Cache</h3>
            <p className="text-sm text-slate-400">
              Decoded ImageBitmaps are bounded in memory and explicitly released via bitmap.close()
              on eviction.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <h3 className="text-lg font-semibold text-cyan-400 font-mono">03. Local-First State</h3>
            <p className="text-sm text-slate-400">
              High-frequency scroll progress and frame indices live in local refs without polluting
              React global state.
            </p>
          </div>
        </article>

        <div className="text-center pt-8 border-t border-slate-800/60 text-xs text-slate-500 font-mono">
          UI-MOTION-POC-001 — Engineering Baseline Validation
        </div>
      </section>
    </main>
  );
}
