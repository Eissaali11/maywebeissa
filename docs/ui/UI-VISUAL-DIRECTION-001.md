# UI-VISUAL-DIRECTION-001

## Premium Visual Identity & Hero Art Direction Specification

**Phase:** UI-VISUAL-DIRECTION-001  
**Governance State:** SPECIFICATION ONLY — NO CODE IMPLEMENTATION AUTHORIZED  
**Authoritative main:** `f082797db22fd14bf70bf3536895a4e153aa3423`  
**Governing Motion Base:** `docs/ui/UI-MOTION-SPEC-001.md`  
**Proven Motion Baseline:** `UI-MOTION-POC-001` (`PROVEN / MERGED`)  
**Date:** 2026-09-01  
**Status:** DRAFT — FOR OWNER / COO REVIEW & SELECTION

---

> [!IMPORTANT]
> **GOVERNANCE CONSTRAINT:** This document defines the **Visual Strategy, Design System Architecture, Color/Typography Direction, and Art Direction Rules** for the portfolio platform. **ZERO APPLICATION SOURCE CODE, STYLES, OR FRAME ASSETS ARE MODIFIED IN THIS TASK.** Implementation is strictly forbidden until the Owner / COO reviews the proposed directions and selects the preferred visual path.

---

## 1. EXECUTIVE VISUAL VISION

The `maywebeissa` portfolio is a **cinematic, engineered technology showcase** designed to represent a senior software engineer, technical architect, and AI systems builder.

Where typical developer websites default to static cards or template themes, `maywebeissa` integrates:

- **RTL-First Arabic Editorial Typography** paired with technical Latin elements.
- **Controlled Dark Materiality** with high-contrast, non-glaring surface hierarchy.
- **Cinematic Canvas Frame Sequences** seamlessly locked to scroll interaction.
- **Engineered Technical Precision** where code, system architecture, and AI automation look like real, working, state-of-the-art products.

---

## 2. PRODUCT CHARACTER

The brand identity must evoke **engineering authority, visual polish, and technical depth**.

### Desired Perception:

- **PREMIUM:** High visual density without clutter; meticulous alignment, typography, and spacing.
- **TECHNICAL:** Real architecture, authentic code structures, and explicit engineering metaphors.
- **CINEMATIC:** Immersive visual framing, controlled depth of field, and fluid scroll narrative.
- **CONFIDENT & MODEST:** Clear presentation of capabilities, metrics, and case studies without noisy hyperbole.

### Prohibited Aesthetic Tropes:

- ❌ Generic developer portfolio (plain white/gray grid of cards).
- ❌ SaaS landing page template (purple gradients, generic illustration blobs).
- ❌ Neon cyberpunk / retro-synthwave cliché (over-saturated cyan/magenta glows).
- ❌ Excessive Glassmorphism (unreadable translucent blurred panels covering content).
- ❌ Unreadable AI visual chaos (hallucinated text or floating random holograms).
- ❌ Crypto / Web3 landing page aesthetic.

---

## 3. REFERENCE VIDEO INTERPRETATION

The reference video was analyzed exclusively as an **INTERACTION MECHANISM BASELINE**, not a visual style guide.

| Mechanism Retained                       | Visual Identity Replaced                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Central pinned display composition       | Replaced reference device with customized engineered display framing         |
| Scroll scrub controlling scene evolution | Replaced reference graphics with programming, project & AI art direction     |
| Staged section transitions               | Replaced reference colors and typography with curated Arabic-first palette   |
| Semantic DOM coexisting with canvas      | Replaced reference brand identity with senior technology leader presentation |

---

## 4. DESIGN PRINCIPLES

1. **Content Over Decoration:** Motion and visual effects illuminate technical depth; they never obfuscate text or code.
2. **RTL-First Symmetry:** The visual grid, typography hierarchy, and reading flow are built natively for Arabic, with LTR islands for code and technical terms.
3. **Engineered Materiality:** Surfaces possess weight, tactile borders, and micro-texture rather than flat plastic color blocks.
4. **Cinematic Continuity:** Frame sequences evolve smoothly across keyframes without jarring cuts or uncoordinated color jumps.
5. **Accessibility as Elegance:** Contrast ratios and crisp focus states enhance visual luxury rather than compromising it. Contrast compliance is verified role-by-role during Design System implementation.

---

## 5. THREE DISTINCT VISUAL DIRECTIONS

To allow the Owner to select the exact visual character of the platform, three distinct, fully fleshed-out design directions have been produced.

```
+-----------------------------------------------------------------------------------+
| THREE VISUAL DIRECTIONS                                                            |
+------------------------------------+----------------------------------------------+
| DIRECTION A: ENGINEERED CINEMATIC  | Deep obsidian, architectural grids, graphite |
| DIRECTION B: LUXURY TECH EDITORIAL | Pure monochrome, large serif, high whitespace|
| DIRECTION C: FUTURE SYSTEMS AI LAB | Slate blue, glowing nodes, data pipelines    |
+------------------------------------+----------------------------------------------+
```

---

### DIRECTION A: ENGINEERED CINEMATIC (PRIMARY RECOMMENDATION)

#### Visual Philosophy:

A dark, high-precision visual system inspired by architectural blueprints, darkroom studio lighting, and high-end workstation hardware. It emphasizes structural grids, fine technical borders (1px hairline), and subtle metallic/graphite surfaces with targeted warm-gold and cyan accents.

#### Palette & Materiality:

- **Canvas:** Deep Obsidian `#090A0F`
- **Surfaces:** Graphite Slate `#12141D`, `#1A1D28`
- **Text:** Crisp Warm-White `#F4F5F7` (Primary), Muted Silver `#94A3B8` (Secondary)
- **Accents:** Cyan `#0EA5E9` (Primary Technical Accent), Solar Gold `#F59E0B` (Secondary / Selective AI Accent)
- **Borders:** Hairline Slate `#1E293B` (0.5px - 1px)

#### Accent Hierarchy Policy:

Cyan (`#0EA5E9`) is the primary engineering and system accent. Amber/Solar Gold (`#F59E0B`) is strictly a secondary, selective highlight reserved for AI workflows and key status badges. Amber must NOT compete equally with Cyan across the UI to avoid a generic blue/gold template appearance.

#### Typography Character:

- **Arabic:** Kufic-inspired geometric precision with editorial warmth (e.g. _IBM Plex Sans Arabic_ or _Tajawal_).
- **Latin:** Clean technical sans-serif (_Inter_ / _Outfit_).
- **Monospace:** Crisp code font (_JetBrains Mono_ / _Fira Code_).

#### Frame & Device Treatment:

- Custom 16:9 obsidian framed display with subtle 1px border glow and dark chamfered bevels. Floating on subtle technical grid lines (`rgba(255,255,255,0.03)`).

---

### DIRECTION B: LUXURY TECHNOLOGY EDITORIAL

#### Visual Philosophy:

An ultra-refined, high-contrast editorial system drawing inspiration from luxury architectural monographs and high-end hardware editorial publications. Focuses on dramatic typography scale, generous negative space, pure dark obsidian backdrop, and champagne-silver accent details.

#### Palette & Materiality:

- **Canvas:** Pure OLED Black `#050505`
- **Surfaces:** Matte Charcoal `#0F0F10`, Liquid Platinum `#1C1C1E`
- **Text:** Stark Pure White `#FFFFFF` (Primary), Champagne Muted `#A1A1AA` (Secondary)
- **Accents:** Platinum Gold `#E2E8F0` (Engineering), Warm Bronze `#D97706` (AI)
- **Borders:** Ultra-subtle `#27272A`

#### Typography Character:

- **Arabic:** High-contrast Naskh/Editorial typeface (e.g. _Noto Serif Arabic_ / _Amiri_ for display titles).
- **Latin:** High-fashion geometric sans (_Plus Jakarta Sans_ / _Space Grotesk_).
- **Monospace:** Minimalist mono (_Geist Mono_).

#### Frame & Device Treatment:

- Frameless floating display surface with soft ambient light falloff behind the canvas. Zero visible bezels; floating seamlessly over pure black.

---

### DIRECTION C: FUTURE SYSTEMS / AI LAB

#### Visual Philosophy:

An immersive, data-dense technical environment inspired by advanced AI research labs, telemetry consoles, and system architecture diagnostics. It utilizes deep midnight-blue backdrops, active pipeline nodes, micro-grid markers, and subtle luminescent indicators.

#### Palette & Materiality:

- **Canvas:** Midnight Void `#030712`
- **Surfaces:** Dark Navy `#0F172A`, Cobalt Layer `#1E293B`
- **Text:** Cool White `#F8FAFC` (Primary), Ice Slate `#64748B` (Secondary)
- **Accents:** Electric Cyan `#06B6D4` (Logic), Neural Purple `#8B5CF6` (AI Generation)
- **Borders:** Translucent Cyan `#0891B2` (1px 15% opacity)

#### Typography Character:

- **Arabic:** Modern technical Naskh (e.g. _Readex Pro_ / _Almarai_).
- **Latin:** Technical mono/sans hybrid (_Space Grotesk_ / _Inter_).
- **Monospace:** _JetBrains Mono_ with active line highlighting.

#### Frame & Device Treatment:

- Technical telemetry frame featuring corner bracket marks (`[ ]`), coordinate ticks, and status indicators around the canvas.

---

## 6. COMPARISON MATRIX

| Dimension | Direction A: Engineered Cinematic | Direction B: Luxury Tech Editorial | Direction C: Future Systems AI Lab |
|-----------|-----------------------------------|------------------------------------|------------------------------------+
| **Visual Character** | High-precision architectural workstation | Ultra-clean luxury monograph | Active telemetry AI lab |
| **Primary Audience Perception** | Senior Architect / Technical Lead | High-End Product Designer & Executive | AI Systems Researcher & Innovator |
| **Arabic RTL Elegance** | Extremely High (Kufic-Geometric) | High (Naskh Editorial) | High (Modern Technical) |
| **Code Presentation** | High Contrast & Line Highlighted | Minimalist & Clean | Active Diagnostic Terminal |
| **Maintainability** | High (Robust token system) | Very High (Simple palette) | Medium (Requires glow management) |
| **Performance Cost** | **LOW-MEDIUM** | **LOW** | **MEDIUM** |
| **Owner Recommendation** | **PRIMARY RECOMMENDATION** | Secondary Option | Tertiary Option |

---

## 7. RECOMMENDED DIRECTION & RATIONALE

### Selection: **DIRECTION A — ENGINEERED CINEMATIC** (with Editorial Restraint from B & Controlled AI Visuals from C)

#### Rationale for Recommendation:

1. **Perfect Balance of Tech & Luxury:** It conveys engineering discipline without looking like a generic dark dashboard or an over-stylized cyberpunk site.
2. **Arabic RTL Harmony:** Geometric Kufic-inspired typography (like IBM Plex Sans Arabic) bridges technical precision and Arabic calligraphic structure naturally.
3. **Optimal Frame Sequence Backdrop:** The obsidian/graphite palette provides an ideal neutral background for rendering Canvas frame sequences without distracting color clashes.
4. **Performance Efficiency:** Uses sharp 1px borders and subtle CSS gradients rather than heavy multi-layer Gaussian backdrop blurs.

---

## 8. HERO ART DIRECTION & CONCEPTUAL STORYBOARD

The Hero section functions as a 9-state (H0 through H8) pinned scroll narrative matching `docs/ui/UI-MOTION-SPEC-001.md`:

```
[H0: IDENTITY] → [H1: DEVICE REVEAL] → [H2: PIN ENGAGE] → [H3: CODE ENGINE]
      ↓
[H4: PROJECTS] → [H5: TECH PIPELINE] → [H6: AI WORKFLOW] → [H7: RELEASE] → [H8: EXIT]
```

### Detailed State Specifications:

- **H0 — Identity & Atmosphere (0% - 10% scroll):**
  - Dark obsidian canvas. Name and title in high-contrast Arabic typography fade in.
  - Subtitle: _مهندس أنظمة برمجة وذكاء اصطناعي_ (Software Systems & AI Engineer).

- **H1 — Display Emergence (10% - 20% scroll):**
  - Central display frame scales smoothly into view (0.9 → 1.0) with subtle depth.
  - Initial poster frame is active.

- **H2 — Pin Engagement (20% - 25% scroll):**
  - ScrollTrigger locks viewport position.
  - Canvas frame engine engages scrub mapping.

- **H3 — Programming & Engineering Sequence (25% - 40% scroll):**
  - Canvas sequence displays high-resolution code architecture evolution.
  - Real DOM Text Overlay: _"معمارية البرمجيات والأنظمة"_ (Software Architecture & Systems).

- **H4 — Product & Project Showcase (40% - 55% scroll):**
  - Canvas transitions into real product interface views.
  - Real DOM Overlay: Title of featured project, tech badges, and "عرض المشاريع" CTA.

- **H5 — Technology Pipeline (55% - 70% scroll):**
  - Canvas displays interconnected system layers (Frontend → Backend → Database → Cloud).
  - Real DOM badges fade in with semantic HTML tags.

- **H6 — AI Workflow & Automation (70% - 85% scroll):**
  - Canvas displays AI agent automation flows (Prompt → Pipeline → Output).
  - Real DOM Text: _"تكامل الذكاء الاصطناعي والأتمتة"_ (AI Integration & Automation).

- **H7 — Consolidation & Scale-Down (85% - 95% scroll):**
  - Frame sequence completes. Display frame scales down smoothly.
  - Pin releases naturally.

- **H8 — Transition to Content (95% - 100% scroll):**
  - Smooth unpin transition into static page flow.

---

## 9. DISPLAY ANCHOR STRATEGY

### Recommended Display Style: **Hybrid Engineered Display Frame**

- **Desktop:** A sleek 16:9 floating viewport with thin graphite chamfered edges, dark glass tint, and subtle 1px ambient border stroke (`rgba(255,255,255,0.08)`).
- **Mobile:** A 19.5:9 portrait screen enclosure tailored to smartphone aspect ratios.
- **Why Not 3D WebGL Device?** WebGL models add 2–5MB of 3D geometry payloads and GPU shading overhead. The 2D Canvas frame sequence with CSS material borders delivers 100% of the visual depth at a fraction of the performance cost. Real-time 3D (WebGL/Three.js) is deferred and non-mandatory.

---

## 10. DOMAIN VISUAL LANGUAGES

### 1. Programming Visual Language:

- **Concept:** Code as architecture, not messy screenshots.
- **Presentation:** High-contrast editor layout featuring syntax-highlighted code blocks with line numbers, active line indicators, and subtle execution telemetry.
- **DOM Integration:** Code snippets remain selectable and copyable semantic `<pre><code>` blocks, positioned over decorative canvas frame backgrounds.

### 2. Projects Visual Language:

- **Concept:** Real products, verified outcomes.
- **Presentation:** Product interfaces presented inside clean browser viewports with live status indicators ("PRODUCTION", "STAGING").
- **Metadata Layout:** Project title (`<h2>`), category badge, key metrics (e.g. "99.9% Uptime", "10x Throughput"), and direct links.

### 3. Technology Visual Language:

- **Concept:** Architectural pipeline rather than a static logo wall.
- **Presentation:** Categorized interactive layers:
  - _Languages & Runtime:_ TypeScript, Python, Node.js, Go.
  - _Frontend & UI:_ Next.js, React, Tailwind CSS, GSAP.
  - _Data & Backend:_ PostgreSQL, Drizzle ORM, Redis, Docker.
  - _AI & Agents:_ Gemini API, PyTorch, LangChain, Custom Workflows.

### 4. AI Workflow Visual Language:

- **Concept:** Demystifying AI through structured pipeline visual narratives:
  `Idea / Prompt` → `Agent Execution` → `Code Generation` → `Automated Deployment`.

---

## 11. AI VIDEO & FRAME ART DIRECTION RULES

Future AI-generated visual sequences MUST adhere to strict production constraints:

1. **Aspect Ratio:** 16:9 (Desktop - 1920×1080), 9:16 or 390×844 (Mobile).
2. **Camera Motion:** Slow, steady linear dolly or tracking shots. **NO chaotic camera spins, whip-pans, or sudden zoom cuts.**
3. **Lighting & Material Continuity:** Intra-sequence visual continuity (consistent key-light direction, white balance, material response, and stable environment lighting). A cool-neutral studio treatment (around 6000K) serves as a starting reference for Direction A, but future scenes may use another controlled color temperature when creatively justified.
4. **Scrub Suitability:** Visual changes must be continuous, predictable, and reversible; scenes must look coherent when scrubbed backward across arbitrary frames.
5. **No Baked-in Text:** AI video generators MUST NOT bake critical text or logos into images. All typography is rendered by semantic DOM elements over the canvas.

---

## 12. TYPOGRAPHY DIRECTION & PERFORMANCE STRATEGY

### Primary Language: Arabic (RTL) | Secondary Language: English (LTR)

```
+-----------------------------------------------------------------------------------+
| TYPOGRAPHY CANDIDATES (ALTERNATIVES — NOT ALL LOADED SIMULTANEOUSLY)              |
+---------------------+-------------------------------+-----------------------------+
| ROLE                | ARABIC CANDIDATES             | LATIN CANDIDATE OPTIONS     |
+---------------------+-------------------------------+-----------------------------+
| Display Headings    | IBM Plex Sans Arabic (Bold)   | Outfit / Inter (Bold)       |
| Body Text           | Tajawal / Readex Pro          | Inter / Plus Jakarta Sans   |
| Code / Monospace    | JetBrains Mono (RTL safe)     | JetBrains Mono / Fira Code  |
+---------------------+-------------------------------+-----------------------------+
```

#### Candidate Selection Rationale:

- **IBM Plex Sans Arabic:** Engineered, crisp, highly readable at large scale, matching technical architecture themes.
- **Inter / Outfit:** Exceptionally legible UI fonts with variable font support.

#### Font Performance & Loading Strategy:

1. **Candidate Alternatives:** The listed font families represent candidate options for evaluation; they do NOT constitute an instruction to download all candidate fonts simultaneously.
2. **Single Primary Pair:** Only the final approved font combination will be loaded in production (e.g. 1 primary Arabic family, 1 primary Latin family if separate Latin loading is justified, and 1 monospace family).
3. **Font Subsetting & Variable Fonts:** Use framework font optimization (`next/font`), preloading only critical above-the-fold display subsets and minimizing font weight variations.
4. **Latin Fallback Evaluation:** During prototype testing, evaluate whether the primary Arabic variable font (e.g., IBM Plex Sans Arabic) provides adequate Latin character coverage before adding an independent Latin font file.

---

## 13. COLOR SYSTEM PROPOSAL (DIRECTION A)

```css
/* DESIGN TOKENS (PROPOSAL ONLY — UNIMPLEMENTED) */
:root {
  /* Canvas & Backgrounds */
  --bg-canvas: #090a0f;
  --bg-surface-base: #12141d;
  --bg-surface-elevated: #1a1d28;
  --bg-surface-overlay: rgba(18, 20, 29, 0.85);

  /* Primary Typography */
  --text-primary: #f4f5f7;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-inverse: #090a0f;

  /* Engineering & System Accents */
  --accent-tech: #0ea5e9; /* Cyan (Primary Technical Accent) */
  --accent-tech-glow: rgba(14, 165, 233, 0.15);
  --accent-ai: #f59e0b; /* Solar Gold (Secondary Selective AI Accent) */
  --accent-ai-glow: rgba(245, 158, 11, 0.15);

  /* Borders & Dividers */
  --border-subtle: #1e293b;
  --border-medium: #334155;
  --border-focus: #0ea5e9;

  /* Feedback States */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
}
```

---

## 14. EFFECTS & MATERIALITY POLICY

### Allowed Visual Effects:

- ✅ Hairline 1px borders with subtle linear gradients.
- ✅ Soft radial glow highlights (`blur(40px)`, max opacity `0.12`).
- ✅ Subtle dark noise textures (`3%` opacity) for surface depth.
- ✅ Micro hover transforms (`scale(1.02)`, `translateY(-2px)`).

### Forbidden Visual Effects:

- ❌ Heavy Gaussian blur on every card (`backdrop-filter: blur(20px)` everywhere destroys mobile scroll performance).
- ❌ Persistent neon glow on non-interactive text.
- ❌ Random particle background scripts.
- ❌ Heavy drop-shadows that reduce text legibility.

---

## 15. RTL-FIRST LAYOUT & SPACING SYSTEM

- **Root Direction:** `<html dir="rtl" lang="ar">`.
- **CSS Logical Properties:** All margins, paddings, and borders MUST use logical properties:
  - `margin-inline-start`, `margin-inline-end`, `padding-block-start`.
- **Code & Tech Islands:** Code blocks and technical identifiers remain LTR islands (`dir="ltr"`) within the RTL layout hierarchy:
  ```html
  <div dir="rtl">
    <h2>معمارية النظام</h2>
    <div dir="ltr" class="font-mono">const pipeline = new AIPipeline();</div>
  </div>
  ```

---

## 16. ACCESSIBILITY & REDUCED MOTION VISUAL STRATEGY

1. **Contrast Compliance Policy:** Accessibility contrast is an implementation requirement evaluated per token pair, not a blanket property of a color palette.
   - Every foreground/background token role must be validated during Design System implementation.
   - **WCAG AA** contrast (≥ 4.5:1 for normal text, ≥ 3.0:1 for large text and UI components) is the mandatory baseline.
   - **WCAG AAA** contrast (≥ 7:1) may be targeted for primary headlines where practical, but is not claimed universally across all tokens prior to token pair verification.
2. **Focus Visibility:** High-contrast focus indicators (e.g. 2px cyan ring `outline: 2px solid var(--border-focus)`) must remain clearly visible against all supported background surfaces.
3. **Reduced Motion Fallback (`prefers-reduced-motion: reduce`):**
   - Canvas scroll pin disabled.
   - Representative static visual frame displayed.
   - All text and CTAs rendered immediately in normal document flow.

---

## 17. DESIGN SYSTEM & COMPONENT STRATEGY

### Preferred Component Approach:

- **Primitives:** Use **Radix UI / shadcn primitives** strictly for accessible behavior (Dialog, Dropdown, Accordion, Tooltip).
- **Styling:** **100% Custom Visual Styling** using our design tokens. **NO default generic shadcn visual themes.**

---

## 18. MEDIA CLASSIFICATION & FRAME DENSITY SEMANTICS

```
+-----------------------------------------------------------------------------------+
| MEDIA ASSET CLASSIFICATION                                                        |
+-------------------------------+-------------------+-------------------------------+
| ASSET CATEGORY                | FORMAT            | USAGE RULES                   |
+-------------------------------+-------------------+-------------------------------+
| Hero Pinned Frame Sequences   | WebP              | Scroll scrub canvas only      |
| Project Showcase Images       | WebP / AVIF       | Real product screenshots      |
| Technical Architecture Icons  | Inline SVG        | Resolution-independent vector |
| Decorative Backgrounds        | Pure CSS Gradient | Zero network image payloads   |
+-------------------------------+-------------------+-------------------------------+
```

### Source Video FPS vs Web Frame-Sequence Density:

1. **Source Video Authoring Rate:** Cinematic temporal rates (e.g. 24fps) may be used as an offline source-video production and export guideline.
2. **Web Frame Density:** Source 24fps does NOT mean 24 web frames per second must be extracted or that every video frame becomes a web asset. Web frame extraction remains **adaptive, sequence-specific, visual-change-driven, and governed strictly by `docs/ui/UI-MOTION-SPEC-001.md`**.
3. **Performance Governance:** Web extraction selects only the minimal frame density necessary to preserve convincing scrub continuity within approved memory (`BoundedFrameCache`) and network budgets.

---

## 19. PERFORMANCE COST MATRIX

| Visual Feature                | Cost Rating | Mitigation / Constraint                             |
| ----------------------------- | ----------- | --------------------------------------------------- |
| CSS Color Tokens & Gradients  | **LOW**     | Instant execution                                   |
| WebP Frame Sequences (Staged) | **MEDIUM**  | Bounded cache window, `ImageBitmap.close()`         |
| Backdrop Blur Panels          | **HIGH**    | Restrict to fixed navbar; forbid on scrolling cards |
| Live Canvas Render Loop       | **MEDIUM**  | Render only on frame change in RAF                  |

---

## 20. RISKS & MITIGATIONS

1. **Risk:** WebP frame sequences impacting mobile data budgets.
   - **Mitigation:** Mobile variants use adaptively reduced frame counts and lower resolution targets tailored to mobile device viewports, governed by `docs/ui/UI-MOTION-SPEC-001.md`.
2. **Risk:** Web font loading causing layout shift (CLS).
   - **Mitigation:** Preload primary font subsets with `font-display: swap` and fallback metric overrides.

---

## 21. OWNER DECISIONS REQUIRED

The following key decisions are presented for Owner / COO selection:

1. **Selected Visual Direction:** Direction A (Engineered Cinematic - Recommended), Direction B (Luxury Tech Editorial), or Direction C (Future Systems AI Lab)?
2. **Primary Arabic Typography:** IBM Plex Sans Arabic (Recommended) vs Tajawal vs Readex Pro?
3. **Hero Display Anchor Style:** Hybrid Engineered Frame (Recommended) vs Frameless Floating Display vs Telemetry Console?

---

## 22. CARRIED TECHNICAL OBSERVATION

- **STALE_ASYNC_VARIANT_TOKEN_HARDENING:** Retained as a non-blocking `OBSERVATION`. This token cache race hardening point from POC testing will be reassessed during production Hero implementation.

---

## 23. NEXT RECOMMENDED PHASE

Upon Owner approval of this Visual Direction:

- **Recommended Next Phase:** **`UI-HERO-VISUAL-PROTOTYPE-001`** (Creating a high-fidelity visual prototype of the central Hero island to visually validate the design direction before freezing the full Design System tokens in `UI-DESIGN-SYSTEM-001`).

---

**DOCUMENTATION ONLY — ZERO APPLICATION SOURCE CODE WAS MUTATED IN THIS TASK.**
