# UI-MOTION-SPEC-001

## Cinematic Scroll-Driven Portfolio Motion Architecture

**Phase:** UI-MOTION-DISCOVERY-001
**Governance State:** SPECIFICATION ONLY — NO IMPLEMENTATION AUTHORIZED
**Authoritative main:** `c79709ac989b4383485f91073818353fa372217b`
**Date:** 2026-09-01
**Status:** DRAFT — REVISED (REMEDIATION-001)

---

## 1. EXECUTIVE VISION

The `maywebeissa` portfolio must transcend conventional developer portfolios. It will function as a **premium cinematic scroll-driven technology showcase** where:

- Scroll progress is the primary interaction narrative.
- A central screen/device composition anchors visual storytelling.
- AI-generated cinematic frame sequences communicate programming, projects, technologies, and AI workflows.
- Real semantic HTML content remains the structural backbone.
- The experience feels premium on every device while respecting performance and accessibility constraints.

The website is Arabic-first. The motion system must be RTL-aware by design.

---

## 2. REFERENCE VIDEO INTERPRETATION

**Mechanism extracted (not visual style):**

1. A screen/device/display becomes a dominant visual anchor in the scene.
2. Scroll progress directly controls what is displayed inside or around that anchor.
3. The display transitions through visually distinct thematic stages.
4. Sections feel pinned — the scene holds while narrative progresses.
5. Transitions between stages feel like cuts in a film, not ordinary scroll.
6. Real content (titles, metadata, CTAs) coexists with the cinematic layer.

**What we do NOT copy:** colors, typography, exact device model, brand identity, layout proportions, specific content.

**What we build instead:** the same interaction grammar applied to programming, projects, technologies, and AI tooling themes.

---

## 3. MOTION PHILOSOPHY

### Hierarchy

```
CINEMATIC (Hero, Projects, Tech, AI)  ← deep scroll-driven sequences
EXPRESSIVE (section entries, reveals)  ← purposeful animation
INTERFACE (hover, focus, micro)        ← subtle feedback
STATIC (Blog article body, Contact)    ← no scroll animation
```

Motion must serve content. Every animated element must justify its motion cost.

### Principles

- **Motion tells a story** — not decorating a static layout.
- **Scroll = time** — progress through scroll maps to narrative progress.
- **Content is real** — semantic HTML is never replaced by canvas pixels.
- **Performance is non-negotiable** — premium ≠ unlimited payload.
- **Accessibility is mandatory** — `prefers-reduced-motion` is a hard requirement.
- **RTL is first-class** — direction assumptions must be abstracted.

---

## 4. PAGE MOTION MAP

| Page           | Motion Level | Primary Technique                  |
| -------------- | ------------ | ---------------------------------- |
| Home / Hero    | HIGH         | Frame sequence + ScrollTrigger pin |
| Projects Index | HIGH         | Pinned sequence per project        |
| Project Detail | MEDIUM–HIGH  | Entry reveals + interface showcase |
| Technologies   | HIGH         | Progressive tech pipeline sequence |
| AI Workflow    | HIGH         | Pipeline narrative sequence        |
| About          | LOW–MEDIUM   | Text reveal + subtle parallax      |
| Blog Index     | LOW          | Entry stagger only                 |
| Blog Article   | LOW          | Reading progress indicator         |
| Contact        | LOW–MEDIUM   | Form reveal                        |
| Admin          | FUNCTIONAL   | Zero cinematic motion              |
| Auth / Login   | FUNCTIONAL   | Zero cinematic motion              |

---

## 5. HERO STORYBOARD

**Scroll distance:** approximately 300–500vh pinned scroll space (configurable via token).
**Structure:** 9 storyboard states (H0 through H8) spanning 8 state-to-state transitions.

```
STATE H0 — INITIAL COMPOSITION (scroll: 0%)
  - Premium dark background established
  - Name / identity text fades in
  - No device visible yet
  - Atmosphere: anticipation

STATE H1 — DEVICE EMERGENCE (scroll: 5–15%)
  - Central screen/display composition rises or scales into view
  - Subtle depth / pseudo-3D perspective establishes anchor
  - First cinematic frame loads (poster frame)

STATE H2 — SCROLL TAKES CONTROL (scroll: 15–20%)
  - Pin engages
  - Frame sequence begins responding to scroll progress
  - Smooth scrub: 1 scroll unit = controlled frame advance

STATE H3 — PROGRAMMING SEQUENCE (scroll: 20–40%)
  - Frame sequence shows: code environments, terminal, dev concepts
  - Real text overlay: "Full-Stack Development" or equivalent
  - Semantic heading remains in DOM

STATE H4 — PROJECTS TRANSITION (scroll: 40–55%)
  - Frame sequence transitions to: actual product interfaces
  - Real project name overlay appears
  - CTA: "View Projects" becomes visible

STATE H5 — TECHNOLOGIES SEQUENCE (scroll: 55–70%)
  - Frame sequence shows: framework logos, infrastructure concepts
  - Real technology labels in DOM

STATE H6 — AI WORKFLOW SEQUENCE (scroll: 70–85%)
  - Frame sequence shows: AI tooling, agent pipelines, generation
  - Real labels: "AI-Assisted Development"

STATE H7 — RELEASE (scroll: 85–95%)
  - Pin begins releasing
  - Device/composition scales down or transitions out
  - Scene opens to normal page flow

STATE H8 — TRANSITION TO CONTENT (scroll: 95–100%)
  - Natural flow into Projects section below
  - Visual continuity preserved
```

**Reduced-motion fallback:** Pin is disabled. One representative static frame displayed per state as background. Text content fully readable. Full narrative preserved through headings and body copy.

---

## 6. PROJECTS STORYBOARD

```
User scrolls into Projects section

→ Visual scene pins

→ Frame sequence begins: product interface visual #1
→ Real project title fades in (DOM heading)
→ Real technology tags appear
→ Real description is readable
→ CTA button appears

→ Scroll advances → interface visual transitions to project #2
→ Project title cross-fades
→ Tags update

→ Continues per project count

→ Pin releases
→ Natural transition to grid/card navigation (fallback + secondary browse)
```

Cards exist as fallback navigation — they are not the primary showcase.

---

## 7. TECH STACK STORYBOARD

```
Pin engages

→ Frame 1: Raw code environment
→ Frame 2: Next.js / React layer
→ Frame 3: Backend / Node layer
→ Frame 4: Database / PostgreSQL
→ Frame 5: Infrastructure concept
→ Frame 6: AI tooling layer

Each stage:
  real technology name in DOM
  brief description in DOM
  logo/icon (SVG, not frame pixel)

Pin releases
```

Technology labels are semantic HTML — never embedded only in frames.

---

## 8. AI WORKFLOW STORYBOARD

```
Pin engages

→ Frame: Idea / prompt input
→ Frame: Agent / automation
→ Frame: Generation output (image/video/code)
→ Frame: Integration into product
→ Frame: Finished automated pipeline

Real copy:
  "AI-Assisted Development"
  tool names
  workflow description

Pin releases
```

---

## 9. FRAME SEQUENCE ARCHITECTURE

### Conceptual Component: `FrameSequence`

```typescript
// NOT IMPLEMENTED YET — SPECIFICATION ONLY

interface FrameSequenceProps {
  sequenceId: string; // e.g. 'hero-programming'
  frameCount: number;
  desktopBasePath: string; // /motion/hero/desktop/
  mobileBasePath: string; // /motion/hero/mobile/
  posterSrc: string; // first frame, loads immediately
  scrollProgress: number; // 0..1 from ScrollTrigger
  reducedMotion: boolean;
}
```

### Rendering Strategy

**Canvas 2D** is preferred over `<img>` DOM nodes.

Rationale:

- Avoids mounting hundreds of DOM elements.
- Single canvas draw call per frame change.
- Lower memory pressure vs multiple decoded images in DOM.
- `requestAnimationFrame` batching possible.

```
ScrollTrigger progress (0..1)
        ↓
normalize → frame index (Math.floor(progress * frameCount))
        ↓
if frame !== currentFrame:
  requestAnimationFrame(() => ctx.drawImage(frames[index], 0, 0))
        ↓
canvas displays current frame
```

### Frame Pre-decode

Use `createImageBitmap()` for off-main-thread decoding where supported. Fall back to `Image` objects where not.

---

## 10. FRAME PRODUCTION PIPELINE

**Offline process (not part of web build):**

```
AI video generation (external tooling)
        ↓
Master export (ProRes / high-quality MP4)
        ↓
FFmpeg frame extraction
  ffmpeg -i input.mp4 -vf fps=24 frame-%04d.png
        ↓
Frame count normalization (planning range: 120–240 frames per sequence)
        ↓
Resize variants:
  Desktop: 1920×1080 or sequence-native
  Mobile: 750×1334 or lower
        ↓
Compression (WebP primary, JPEG fallback):
  cwebp -q 82 frame-0001.png -o frame-0001.webp
        ↓
Output structure:
  /public/motion/{sequence}/{variant}/frame-{NNNN}.webp
        ↓
Manifest JSON per sequence:
  { frameCount, desktopPath, mobilePath, poster }
```

**Deterministic naming:**

```
/public/motion/hero-programming/desktop/frame-0001.webp
/public/motion/hero-programming/mobile/frame-0001.webp
/public/motion/projects-showcase/desktop/frame-0001.webp
```

### 10.1 Frame Density Rationale

SOURCE VIDEO FPS IS NOT WEB FRAME-SEQUENCE FRAME COUNT.

Do NOT automatically preserve all 24/30/60fps source frames. Web frame count must be determined by:

- Scroll distance (pinned vh length)
- Visual delta between adjacent frames
- Viewport target size (mobile vs desktop)
- Network transfer budget
- Decode latency and GPU memory limits

The 120–240 frame range is an initial planning range for desktop sequences. Mobile variants must use substantially fewer frames (e.g. 60–120) to satisfy memory and network constraints.

---

## 11. ASSET MANIFEST CONCEPT

```json
{
  "sequences": {
    "hero-programming": {
      "frameCount": 180,
      "desktop": "/motion/hero-programming/desktop/frame-{NNNN}.webp",
      "mobile": "/motion/hero-programming/mobile/frame-{NNNN}.webp",
      "poster": "/motion/hero-programming/poster.webp"
    },
    "hero-projects": { ... },
    "hero-technologies": { ... },
    "hero-ai-workflow": { ... },
    "projects-showcase": { ... },
    "tech-stack": { ... },
    "ai-pipeline": { ... }
  }
}
```

Manifest is loaded once at section init. Frames are loaded per stage.

---

## 12. LOADING, LIFECYCLE & MEMORY STRATEGY

### 12.1 Staged Loading

```
STAGE 1 — Immediate (page load)
  Poster frame for Hero sequence only
  Critical CSS / fonts

STAGE 2 — After LCP
  First frame window of Hero sequence #1 (programming)
  Allows scrub to begin immediately

STAGE 3 — During idle / after first interaction
  Remaining frames for current pinned sequence

STAGE 4 — Before next sequence enters viewport
  Preload next sequence poster + first window
  (Use IntersectionObserver on section boundary)

STAGE 5 — On demand
  Project-specific sequences load only when user approaches that project
```

Forbidden: Eagerly preloading all animation sequences at application startup. Initial route LCP must never wait for non-Hero sequences.

### 12.2 Motion Lifecycle & Cleanup Policy

All React motion islands MUST enforce deterministic cleanup.

A. **GSAP Responsive Context:**
All animations and ScrollTriggers created for responsive conditions must be managed via:

```typescript
const mm = gsap.matchMedia();
```

On component unmount, call `mm.revert()`. Do not nest `gsap.context()` unnecessarily inside `matchMedia` callbacks because `matchMedia` manages its own internal context lifecycle.

B. **Custom Cleanup Callbacks:**
Each `matchMedia` callback must return a cleanup function releasing non-GSAP resources:

- Event listeners (`window.removeEventListener`)
- Observers (`observer.disconnect()`)
- Active timers / RAF loops

C. **requestAnimationFrame Cleanup:**
Store the current RAF handle. On unmount, breakpoint change, or reduced-motion transition:

```typescript
cancelAnimationFrame(rafId);
```

No orphan render loop may run after unmount.

D. **ScrollTrigger Lifecycle:**
All triggers created by the motion island must be reverted/killed through their owning `mm.revert()` lifecycle. Global `ScrollTrigger.killAll()` is forbidden for routine component cleanup.

E. **Observer Lifecycle:**
All ResizeObservers or IntersectionObservers attached to sequence elements must be disconnected on cleanup.

F. **Route Transition Lifecycle:**
No motion resource (GSAP timeline, RAF loop, or canvas context) may survive after its owning React motion island is unmounted during Next.js route transitions.

### 12.3 Decoded Frame Memory Policy

FrameSequence components must use a bounded decoded-frame window (`currentFrame ± preloadWindow`). Do NOT keep all decoded frames resident in memory indefinitely.

Distinguish between:

- **Encoded network cache:** HTTP / browser response cache (disk/RAM)
- **Decoded image memory:** `ImageBitmap` or uncompressed canvas surface memory in GPU/RAM

**Mandatory Resource Release:**
Deleting a Map entry or setting a JS reference to `null` is NOT the explicit resource-release mechanism for decoded bitmaps.

When `createImageBitmap()` is used:
EVERY `ImageBitmap` evicted from the decoded-frame cache MUST call:

```typescript
bitmap.close();
```

before its final application reference is dropped.

`bitmap.close()` must also be called during:

- Component unmount
- Sequence replacement
- Variant switch (desktop ↔ mobile)
- Breakpoint change
- Reduced-motion transition
- Error recovery when frame decoding is aborted

Do NOT call `close()` on a bitmap currently scheduled for active rendering in the current RAF frame.

### 12.4 Frame Cache States & Model

Decoded frame cache elements progress through explicit states:

```
NOT_REQUESTED → FETCHING → ENCODED_READY → DECODED_RESIDENT → EVICTABLE → RELEASED
```

Cache rules:

- **Preload Window:** Configurable via motion tokens (e.g. `±15` frames on desktop, `±8` frames on mobile).
- **Forward Bias:** Prefetch favors forward scroll direction when scrolling down.
- **Eviction Threshold:** When a section exits the viewport by > 2x viewport height, all decoded `ImageBitmap` objects for that section are evicted and closed (`bitmap.close()`).
- **Unmount Purge:** Component unmount purges 100% of resident decoded bitmaps.

---

## 13. DESKTOP STRATEGY

| Parameter                     | Value                                          |
| ----------------------------- | ---------------------------------------------- |
| Frame resolution              | 1920×1080 preferred, 1280×720 minimum          |
| Frame count per sequence      | 120–240 (planning range)                       |
| Scrub smoothness              | `scrub: 1` (ScrollTrigger)                     |
| Pin distance                  | 200–400vh per major sequence                   |
| Simultaneous loaded sequences | max 2                                          |
| Format                        | WebP (AVIF optional, evaluate browser support) |

---

## 14. MOBILE STRATEGY

| Parameter                            | Value                            |
| ------------------------------------ | -------------------------------- |
| Frame resolution                     | 750×1334 or 390×844              |
| Frame count per sequence             | 60–120 (approx 50% of desktop)   |
| Pin distance                         | 100–200vh (shorter than desktop) |
| Simultaneous loaded sequences        | max 1                            |
| Format                               | WebP at lower quality (q: 70–75) |
| Separate `gsap.matchMedia()` context | YES                              |

Mobile preserves the **same narrative identity** — same states, same story — with optimized asset weight, reduced frame counts, and shorter pin durations.

---

## 15. REDUCED MOTION & ACCESSIBILITY

```css
@media (prefers-reduced-motion: reduce) {
  /* Applied globally */
}
```

In JavaScript / GSAP:

```typescript
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  // Show representative static poster frames
  // Disable ScrollTrigger pin
  // Disable scrub timeline
  // Show all state content simultaneously (no stagger)
  // Retain all semantic headings / CTAs
}
```

Rules:

- No blank canvas placeholders in reduced-motion mode.
- No inaccessible text-in-frames only.
- All CTAs remain reachable.
- Navigation is never blocked by animation state.

### 15.1 Persistent & Ambient Motion Policy

Scroll-driven animation controlled directly by user scroll is distinct from autonomous looping animation.

For any decorative ambient motion that:

- Starts automatically
- Continues independently without user interaction
- Persists longer than 5 seconds (per WCAG 2.2 SC 2.2.2)

The system MUST provide a clear control to **pause, stop, or hide** the motion, unless the animation is proven essential to the core functionality.

In `prefers-reduced-motion` mode, all non-essential ambient loops must be automatically disabled or paused at initial render. Autonomous decorative loops are forbidden in the initial POC unless explicitly requested.

---

## 16. SEMANTIC / SEO STRATEGY

| Content type        | Delivery method                                 |
| ------------------- | ----------------------------------------------- |
| Page title          | `<h1>` — real DOM                               |
| Project name        | `<h2>` or `<h3>` — real DOM                     |
| Project description | `<p>` — real DOM                                |
| Technology name     | `<span>` with `aria-label` — real DOM           |
| CTA buttons         | `<a>` or `<button>` — real DOM                  |
| Navigation          | `<nav>` — real DOM                              |
| Blog content        | full semantic HTML                              |
| Frame sequences     | `<canvas aria-hidden="true">` — decorative only |

Frame canvas elements carry `aria-hidden="true"` and `role="presentation"`. They are never the sole source of informational content.

---

## 17. RTL STRATEGY

- `<html dir="rtl" lang="ar">` as default.
- Layout built using CSS logical properties (`margin-inline-start`, `padding-inline-end`).
- Avoid `left`/`right` in motion coordinates where semantic direction matters.
- GSAP `xPercent` / `x` transforms are directionless — safe for RTL.
- Entry animations that imply direction (slide from left/right) must use logical direction tokens.
- English (`lang="en"`, `dir="ltr"`) must be switchable without breaking motion.

### Motion Direction Tokens

```
--motion-enter-x: -40px     /* logical: "from start" */
--motion-exit-x: 40px       /* logical: "to end" */
```

Override in LTR context:

```css
[dir='ltr'] {
  --motion-enter-x: 40px;
  --motion-exit-x: -40px;
}
```

---

## 18. TECHNOLOGY DECISION MATRIX

| Technology            | Purpose                    | Benefit                           | Cost                                                    | Need Now         | Decision                         |
| --------------------- | -------------------------- | --------------------------------- | ------------------------------------------------------- | ---------------- | -------------------------------- |
| **GSAP**              | Animation engine           | Mature, precise, timeline control | License (free for non-commercial; check for commercial) | YES              | **RECOMMENDED**                  |
| **ScrollTrigger**     | Scroll-linked animation    | pin, scrub, progress mapping      | Part of GSAP                                            | YES              | **RECOMMENDED**                  |
| **gsap.matchMedia()** | Responsive motion          | Clean breakpoint separation       | Minimal                                                 | YES              | **RECOMMENDED**                  |
| **Native scroll**     | Base scroll behavior       | Zero cost, accessible             | Less smooth on some platforms                           | YES              | **DEFAULT**                      |
| **Lenis**             | Smooth scroll override     | Cinematic feel                    | Touch/keyboard risk, integration complexity             | NO               | **DEFER — OPTIONAL**             |
| **Canvas 2D**         | Frame sequence rendering   | Efficient, no DOM bloat           | Learning curve                                          | YES (prototype)  | **RECOMMENDED**                  |
| **Frame sequences**   | Cinematic visual narrative | Matches reference, controllable   | Asset pipeline required                                 | YES              | **CORE TECHNIQUE**               |
| **CSS animations**    | Light interface motion     | Zero JS, GPU-accelerated          | Limited scroll control                                  | YES              | **USE FOR INTERFACE LAYER**      |
| **Three.js / R3F**    | True 3D scene              | Impressive depth                  | Heavy, significant complexity                           | NO               | **DEFER**                        |
| **Motion (Framer)**   | React animation            | Easy API                          | Overlaps with GSAP, bundle weight                       | EVALUATE         | **OPTIONAL for interface layer** |
| **Video `<video>`**   | Playback                   | Easy                              | No scroll scrub control                                 | NO for sequences | **NOT for frame sequences**      |
| **next/image**        | Static image optimization  | Automatic optimization            | Not designed for sequence playback                      | YES for static   | **FOR STATIC IMAGES ONLY**       |

---

## 19. GSAP / SCROLLTRIGGER DECISION

**Decision: RECOMMEND — install in POC phase**

Rationale:

- `ScrollTrigger.pin()` satisfies the "scene holds while narrative advances" requirement.
- `scrub: true` maps scroll position to timeline progress exactly as needed.
- `gsap.timeline()` allows sequencing all state transitions with precise easing.
- `gsap.matchMedia()` enables clean desktop/mobile/reduced-motion separation.
- Battle-tested in production scroll-heavy sites.
- No equivalent alternative provides the same pin+scrub+matchMedia combination at this maturity level.

**Do not install until POC branch is opened.**

---

## 20. LENIS DECISION

**Decision: DEFER — OPTIONAL**

Rationale:

- Native scroll + ScrollTrigger is sufficient to prove the POC.
- Lenis introduces risk to touch scrolling and keyboard navigation.
- Lenis + ScrollTrigger integration requires careful configuration.
- Introduce only if native scroll creates a measurable quality gap in prototype review.
- If introduced: must pass keyboard scroll test + touch momentum test + `prefers-reduced-motion` test.

---

## 21. R3F / THREE.JS DECISION

**Decision: DEFER — NOT REQUIRED FOR CURRENT MOTION MODEL**

Rationale:

- The reference interaction mechanism does not require true WebGL 3D.
- Frame sequences + CSS pseudo-3D can achieve the visual target.
- R3F adds significant bundle weight and complexity.
- Defer to a later phase if a specific interaction proves to require true 3D.
- Re-evaluate if the device composition requires live 3D rotation/lighting.

---

## 22. CANVAS DECISION

**Decision: RECOMMEND Canvas 2D for frame sequences**

Rationale:

- Single DOM node for entire sequence playback.
- No layout reflow from image array changes.
- `drawImage()` is efficient for sequential frame rendering.
- `createImageBitmap()` provides off-main-thread decode path (`bitmap.close()` mandatory on eviction).
- Canvas element carries `aria-hidden="true"` — no accessibility concern.

---

## 23. MOTION TOKEN PROPOSAL

```css
:root {
  /* Duration */
  --motion-duration-fast: 150ms;
  --motion-duration-normal: 300ms;
  --motion-duration-slow: 600ms;
  --motion-duration-cinematic: 1200ms;

  /* Easing */
  --motion-ease-interface: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-reveal: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-cinematic: cubic-bezier(0.76, 0, 0.24, 1);
  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Distance */
  --motion-distance-xs: 8px;
  --motion-distance-sm: 16px;
  --motion-distance-md: 32px;
  --motion-distance-lg: 64px;
  --motion-distance-xl: 120px;

  /* Scale */
  --motion-scale-enter: 0.96;
  --motion-scale-pop: 1.04;

  /* Blur */
  --motion-blur-reveal: 4px;

  /* Scroll distances (pin) */
  --motion-pin-hero: 350vh; /* configurable */
  --motion-pin-projects: 250vh;
  --motion-pin-tech: 200vh;
  --motion-pin-ai: 200vh;
  --motion-pin-hero-mobile: 180vh;
  --motion-pin-projects-mobile: 150vh;
}
```

GSAP tokens (JS):

```typescript
export const motionTokens = {
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.6,
    cinematic: 1.2,
  },
  ease: {
    interface: 'power2.inOut',
    reveal: 'power3.out',
    cinematic: 'expo.inOut',
  },
} as const;
```

---

## 24. PERFORMANCE BUDGET & MEASUREMENT POLICY

### 24.1 Performance Targets

Production Core Web Vitals targets are evaluated at the **75th percentile** and considered **separately for mobile and desktop**:

| Metric                            | Target (75th Percentile)         | Scope & Measurement                                                                 |
| --------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| **LCP**                           | ≤ 2.5 seconds                    | Mobile & Desktop evaluated separately                                               |
| **INP**                           | ≤ 200 milliseconds               | Mobile & Desktop evaluated separately                                               |
| **CLS**                           | ≤ 0.1                            | Mobile & Desktop evaluated separately                                               |
| **Incremental Motion JS**         | < 80KB gzipped                   | Motion-attributed JS only (GSAP + motion islands), excluding core Next.js framework |
| **Initial Motion Asset Transfer** | < 200KB compressed transfer      | Pre-LCP motion network transfer per route (Hero poster frame only)                  |
| **First Sequence Full Load**      | < 1.5MB transfer                 | Loaded post-LCP during initial interaction window                                   |
| **Full Page Motion Assets**       | < 15MB total transfer            | All sequences combined across full page scroll                                      |
| **Peak Canvas Memory (Desktop)**  | < 256MB GPU/RAM                  | Lab target for resident decoded frame cache                                         |
| **Peak Canvas Memory (Mobile)**   | < 96MB GPU/RAM                   | Lab target for resident decoded frame cache                                         |
| **Desktop Frame Resolution**      | 1280×720 min / 1920×1080 pref    | Desktop asset variant                                                               |
| **Mobile Frame Resolution**       | 390×844 or lower                 | Mobile asset variant                                                                |
| **Frame Format**                  | WebP (q:80 desktop, q:72 mobile) | Primary web image sequence format                                                   |

**Lab vs. Field Performance:**

- **Lab Performance (POC Phase):** Evaluated via Chrome DevTools, Lighthouse, and automated Vitest/browser instrumentation.
- **Field Performance (Production Phase):** Evaluated via real-user monitoring (RUM) at the 75th percentile across actual mobile/desktop devices.

### 24.2 Scoped Initial Motion Asset Budget

The `< 200KB` pre-LCP initial motion asset budget is strictly scoped as follows:

- **Included:** Hero poster / first visual image state required before/around LCP.
- **Excluded:** HTML document, CSS stylesheets, web fonts, content images, JavaScript bundles (these carry separate system budgets).
- **First Frame Window:** The first 15–30 frames of Hero Sequence #1 MUST NOT load pre-LCP unless lab measurements prove zero LCP degradation. Staged loading (Stage 2) begins immediately after LCP.

### 24.3 POC Performance & Hardware Measurement Policy

Visual frame rate targets are hardware-class dependent:

- **60 FPS** is a visual smoothness TARGET on capable desktop hardware, NOT an absolute cross-device guarantee.
- **30 FPS** visual update rate is the acceptable baseline for mid-range mobile devices under scrub interaction.
- 30 FPS on desktop hardware must NOT be accepted automatically without profiling main-thread bottlenecks.

**Evaluation Classes for POC:**

1. **Capable Desktop Class:** Target ~60Hz visual updates during scroll scrub without main-thread long tasks (> 50ms).
2. **Mid-Range Mobile Class:** Target smooth responsive interaction without sustained jank or frame dropping during touch scrub.
3. **Reduced-Motion Class:** Zero scrub performance requirement (scrub disabled; static poster frames rendered).

**Mandatory Tester Hardware Record:**
Every POC performance report MUST record the test environment metadata:

- Browser & version
- Operating System & OS version
- Hardware (CPU, GPU, RAM, device model)
- Viewport dimensions & Device Pixel Ratio (DPR)
- CPU/Network throttling state (if applied)
- Profiling tools used (e.g. Chrome Performance Panel, Memory Sampler)

### 24.4 Memory Acceptance Criteria

The POC implementation must explicitly verify:

1. Memory rises predictably as frame sequence windows are fetched and decoded.
2. Memory becomes reclaimable and materially drops following sequence eviction, section leave (> 2x viewport height), or component unmount.
3. **Zero Monotonic Memory Growth:** Repeated `enter → scrub → leave → re-enter` cycles must NOT exhibit unbounded memory growth.
4. All decoded `ImageBitmap` objects are explicitly closed (`bitmap.close()`) upon eviction or unmount.

---

## 25. COMPONENT ARCHITECTURE PROPOSAL

```
src/
  app/
    page.tsx                    ← Server Component (semantic content)
    (public)/
      home/                     ← future
  components/
    sections/
      HeroSection.tsx           ← Server outer shell
      HeroMotion.tsx            ← 'use client' motion island
      ProjectsSection.tsx       ← Server outer shell
      ProjectsMotion.tsx        ← 'use client' motion island
      TechSection.tsx
      TechMotion.tsx
      AIWorkflowSection.tsx
      AIWorkflowMotion.tsx
    motion/
      FrameSequence.tsx         ← 'use client' canvas renderer
      ScrollPin.tsx             ← 'use client' GSAP pin wrapper
      MotionProvider.tsx        ← 'use client' GSAP context
      useReducedMotion.ts       ← hook
      useScrollProgress.ts      ← hook
    ui/                         ← static/interface components (Server-safe)
  lib/
    motion/
      tokens.ts                 ← motion token constants
      sequences.ts              ← sequence manifest loader
```

**Server/Client boundary rule:**

> Only `motion/` and `*Motion.tsx` files require `'use client'`.
> Section shells, headings, text content, and navigation remain Server Components.

---

## 26. RISKS & MITIGATIONS

| Risk                                            | Severity   | Mitigation                                                                    |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| Frame asset payload too large                   | HIGH       | Staged loading + per-sequence preload window only.                            |
| Canvas memory leak on navigation                | HIGH       | Mandatory `bitmap.close()` + `mm.revert()` on component unmount.              |
| ScrollTrigger + Next.js App Router SSR conflict | MEDIUM     | Initialize GSAP in client-side `useEffect`/`useGSAP` only; never in render.   |
| Mobile performance regression                   | MEDIUM     | Separate `matchMedia` config; reduce frame count by ~50%.                     |
| RTL motion direction bugs                       | MEDIUM     | Use logical property tokens (`--motion-enter-x`); test every sequence in RTL. |
| `prefers-reduced-motion` non-compliance         | HIGH       | Reduced-motion branch is required and disables scrub/pin.                     |
| AI video generation delay                       | MEDIUM     | Prototype uses placeholder frames; unblocks technical work.                   |
| GSAP license for commercial use                 | LOW–MEDIUM | Review GSAP Club GreenSock license before commercial launch.                  |
| Lenis breaking keyboard nav                     | MEDIUM     | Default to native scroll; Lenis is deferred.                                  |
| R3F bundle weight if added later                | MEDIUM     | Keep deferred; re-evaluate per feature request.                               |

---

## 27. PROTOTYPE PLAN (UI-MOTION-POC-001)

**Scope:** Hero sequence only — NOT the full homepage.

### Prototype Goals

1. Prove `ScrollTrigger` pin + scrub at production fidelity.
2. Prove Canvas 2D frame sequence playback at 60fps target on desktop.
3. Prove responsive `matchMedia` desktop/mobile separation.
4. Prove `prefers-reduced-motion` static fallback.
5. Prove staged frame loading without initial LCP payload spike.
6. Prove cleanup on unmount (`mm.revert()` + `bitmap.close()`, zero memory leak).
7. Demonstrate complete Hero state transition sequence (H0 → H3).

### Prototype Scope

```
HeroMotion.tsx (client island)
  ├── FrameSequence.tsx (canvas renderer)
  ├── ScrollPin.tsx (GSAP ScrollTrigger wrapper)
  └── Placeholder frame set (20–30 temporary WebP frames)

Semantic shell:
  HeroSection.tsx (server component)
  ├── <h1> — name/identity
  ├── <p> — role description
  └── <a> — primary CTA
```

### Prototype Success Criteria

- [ ] Pin engages and holds correctly on scroll.
- [ ] Frame index advances smoothly with scroll progress.
- [ ] Canvas renders correct frame without flicker.
- [ ] Desktop and mobile behave independently via `matchMedia`.
- [ ] Reduced-motion: static frame shown, no broken layout.
- [ ] No memory leak after navigating away and back (`bitmap.close()` verified).
- [ ] LCP from poster frame: ≤ 2.5s on simulated 4G.
- [ ] Smooth scrub playback on test hardware with recorded hardware metadata.
- [ ] Semantic content readable at all scroll positions.
- [ ] RTL layout does not break motion coordinates.

**Prototype does NOT include:**

- Final design system
- Real brand colors
- Final typography
- Projects or Tech sequences
- Navigation
- Footer
- Any other page

---

## 28. ACCEPTANCE CRITERIA FOR SPEC APPROVAL

Before `UI-MOTION-POC-001` can begin:

- [ ] COO reviews this revised specification.
- [ ] Motion philosophy approved.
- [ ] Hero storyboard states approved.
- [ ] Frame sequence architecture & memory policy approved (`bitmap.close()`).
- [ ] Lifecycle & cleanup policy approved (`mm.revert()`, RAF cancel).
- [ ] Technology decisions confirmed (GSAP/Canvas/native scroll).
- [ ] Performance budget & Core Web Vitals targets accepted.
- [ ] RTL strategy accepted.
- [ ] Reduced-motion & persistent-loop requirements accepted.
- [ ] Prototype scope approved.

---

## 29. EXPLICITLY DEFERRED DECISIONS

| Decision                                  | Deferred Until                |
| ----------------------------------------- | ----------------------------- |
| Final color palette                       | Design System phase           |
| Final typography / fonts                  | Design System phase           |
| Exact device/screen model for composition | POC visual review             |
| Lenis adoption                            | Post-POC measurement          |
| R3F / Three.js                            | Only if POC proves limitation |
| Project-specific frame content            | Content phase (after POC)     |
| AI video prompt design                    | Content phase                 |
| Blog motion design                        | After Home is approved        |
| Admin / Auth motion                       | Not planned (functional only) |
| Page transitions                          | After Home POC                |
| Cursor customization                      | After core scroll system      |
| Magnetic buttons                          | After core scroll system      |
| GSAP license commercial review            | Before public launch          |

---

## 30. NEXT RECOMMENDED TASK

```
UI-MOTION-POC-001

Hero Motion Proof of Concept

Scope:
  - Install GSAP + ScrollTrigger
  - Implement HeroSection (Server shell)
  - Implement HeroMotion (Client island)
  - Implement FrameSequence (Canvas renderer)
  - Use 20-30 placeholder WebP frames
  - Prove pin + scrub + canvas playback
  - Prove responsive matchMedia
  - Prove reduced-motion fallback
  - Prove cleanup / no memory leak (bitmap.close(), mm.revert())

Authorization:
  AWAITING COO APPROVAL OF THIS REVISED SPECIFICATION
```

---

## REPOSITORY DISCOVERY SUMMARY

| Item                           | Finding                                                |
| ------------------------------ | ------------------------------------------------------ |
| Next.js version                | 16.3.3                                                 |
| React version                  | 19.2.8                                                 |
| Tailwind                       | v4 (`@tailwindcss/postcss`)                            |
| Current animation dependencies | **NONE**                                               |
| Current 3D dependencies        | **NONE**                                               |
| Current homepage               | Default Next.js scaffold — placeholder only            |
| `src/components/sections/`     | Empty (`.gitkeep`)                                     |
| `src/components/three/`        | Empty (`.gitkeep`) — placeholder for R3F               |
| `src/components/ui/`           | Empty (`.gitkeep`)                                     |
| `src/app/(public)/`            | Empty (`.gitkeep`)                                     |
| Existing fonts                 | Geist Sans + Geist Mono (Google Fonts via `next/font`) |
| DB / Auth / Bootstrap          | FROZEN — no changes authorized                         |
| Reusable UI foundation         | None yet — clean slate                                 |

**The repository is a clean canvas for the UI system.**
No migration or cleanup is required before building.
The `three/` directory placeholder suggests 3D was anticipated.

---

_Specification prepared during `UI-MOTION-DISCOVERY-001` (Revised per REMEDIATION-001)._
_All implementation is deferred pending COO review._
