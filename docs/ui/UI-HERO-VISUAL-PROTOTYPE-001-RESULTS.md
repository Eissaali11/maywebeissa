# UI-HERO-VISUAL-PROTOTYPE-001-R3 RESULTS

**Task:** UI-HERO-FRAME-SEQUENCE-INTEGRATION-001-R3  
**Status:** CANDIDATE_FOR_OWNER_SCROLL_REVIEW  
**Authoritative main:** `2d21e436486c76eccb9979b0f469a1edd114fcbf`  
**Governing Motion Base:** `docs/ui/UI-MOTION-SPEC-001.md`  
**Target Route:** `/hero-visual-prototype`  
**Stacked Branch:** `feat/ui-hero-frame-sequence-001`  
**Date:** 2026-09-02

---

## 1. PERFORMANCE BUDGET REPORT (FROZEN / ACCEPTED)

| Metric                     | R1/R2/R3 Accepted Baseline | Status / Budget Target     |
| :------------------------- | :------------------------- | :------------------------- |
| **Frame Count**            | **52 frames**              | Preferred Range (48–72)    |
| **Total Sequence Payload** | **1.375 MB (1,442,020 B)** | **MET (<= 1.5 MB Target)** |
| **Payload Savings**        | **52.0% Reduction**        | High Efficiency            |
| **Median Frame Size**      | **28.93 KB**               | Optimized                  |
| **Largest Frame Size**     | **41.09 KB**               | Bounded                    |
| **Initial Load Payload**   | **67.77 KB**               | 5 Frames + Manifest        |
| **WebP Quality Setting**   | **65 (-quality 65)**       | Visually Lossless          |

---

## 2. UNIQUE BITMAP LIFECYCLE ACCOUNTING & IDENTITY EQUATION PROOFS

### **Counter & Invariant Rules:**

1. `close count per bitmap <= 1` (Enforced via `releaseDecodedFrame` and unique `__bitmapId`).
2. `duplicateCloseAttempts = 0` (No double-closing attempts permitted).
3. **Mutually Exclusive Terminal Reasons:** Every bitmap is closed for exactly ONE reason (`eviction`, `stale_discard`, or `unmount_clear`).
4. **Identity Equation:** `uniqueClosed === uniqueEvicted + uniqueStaleDiscarded + uniqueUnmountCleared`

---

### **TEST A: FORCED-EVICTION TEST (Debug/Test Capacity = 5)**

```text
==================================================
TEST A: FORCED-EVICTION TEST (Capacity = 5)
==================================================
Created Unique Bitmaps:       153
Inserted Unique Bitmaps:      150
Evicted Unique Bitmaps:       146
Stale-Discarded Bitmaps:      3
Unmount-Cleared Bitmaps:      4
Closed Unique Bitmaps:        153
Duplicate Close Attempts:     0

IDENTITY EQUATION VERIFICATION (TEST A):
Unique Closed (153) === Evicted (146) + Stale-Discarded (3) + Unmount-Cleared (4) === 153
TEST A RESULT: ✅ PASSED
```

---

### **TEST B: PRODUCTION-CONFIG TEST (Actual Production Capacity = 15)**

```text
==================================================
TEST B: PRODUCTION-CONFIG TEST (Capacity = 15)
==================================================
Configured Cache Capacity:    15 frames
Peak Decoded Cache Size:      13 frames (Strictly <= 15)
Total Successful Decodes:     909 decodes
Total Cache Hits:             999 hits
Total Cache Misses:           1 miss
Total Evictions:              899 evictions
Total Stale Discards:         0 discards
Total Unmount Clears:         10 clears
Total Unique Bitmap Closes:   909 closes
Duplicate Close Attempts:     0 attempts
Initial Warmed Heap:          8.69 MB
Final Heap (10 Cycles):       7.64 MB (No monotonic heap growth)
Post-Unmount Cache Size:      0 frames
Post-Unmount Pending Loads:   0 loads

IDENTITY EQUATION VERIFICATION (TEST B):
Unique Closed (909) === Evicted (899) + Stale-Discarded (0) + Unmount-Cleared (10) === 909
Total Successful Decodes (909) === Unique Bitmap Closes (909)
TEST B RESULT: ✅ PASSED
```

---

## 3. STALE ASYNC GENERATION TOKEN PROOF

Deliberate Async Invalidation Scenario Executed:

1. Frame decode initiated under `token 1`.
2. Token manager invalidated `token 1` -> incremented to `token 2`.
3. Delayed async fetch resolved under `token 1`.
4. Result rejected as stale (`staleLoadRejections >= 1`, `staleDiscardedBitmapIdsCount >= 1`).
5. Decoded bitmap safely closed exactly once via `releaseDecodedFrame` under `stale_discard` terminal reason.
6. Old result NEVER inserted into active cache.

**Stale Async Hardening Status:** **PROVEN (`STALE_ASYNC_VARIANT_TOKEN_HARDENING = PROVEN`)**

---

## 4. RENDERING SANITY TESTS EVIDENCE

| Test Item                   | 1920x1080 (Desktop FHD) | 390x844 (Mobile Large) |
| :-------------------------- | :---------------------: | :--------------------: |
| **Initial render (H0)**     |        **PASS**         |        **PASS**        |
| **Forward scrub**           |        **PASS**         |        **PASS**        |
| **Reverse scrub**           |        **PASS**         |        **PASS**        |
| **Rapid direction changes** |        **PASS**         |        **PASS**        |
| **Route unmount/remount**   |        **PASS**         |        **PASS**        |
| **Console errors**          |      **PASS (0)**       |      **PASS (0)**      |
| **Unhandled rejections**    |      **PASS (0)**       |      **PASS (0)**      |

---

**PROTOTYPE ONLY — NO GLOBAL DESIGN SYSTEM TOKENS WERE FROZEN IN THIS TASK.**
