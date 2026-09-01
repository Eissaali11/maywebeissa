/**
 * UI-MOTION-POC-001 Frame Engine
 * Pure helpers and bounded frame cache manager for Canvas 2D sequence rendering.
 */

export interface FrameVariantConfig {
  frameCount: number;
  basePath: string;
  pattern: string; // e.g. 'frame-{NNNN}.png'
  width: number;
  height: number;
}

export interface SequenceManifest {
  id: string;
  desktop: FrameVariantConfig;
  mobile: FrameVariantConfig;
  poster: string;
}

export const HERO_POC_MANIFEST: SequenceManifest = {
  id: 'hero-poc',
  desktop: {
    frameCount: 24,
    basePath: '/motion/poc/hero/desktop',
    pattern: 'frame-{NNNN}.png',
    width: 320,
    height: 180,
  },
  mobile: {
    frameCount: 16,
    basePath: '/motion/poc/hero/mobile',
    pattern: 'frame-{NNNN}.png',
    width: 180,
    height: 320,
  },
  poster: '/motion/poc/hero/poster.png',
};

/**
 * Calculates zero-based frame index from scroll progress (0..1).
 * Clamps safely for < 0 and > 1.
 */
export function calculateFrameIndex(progress: number, totalFrames: number): number {
  if (totalFrames <= 0 || Number.isNaN(progress)) return 0;
  if (progress <= 0) return 0;
  if (progress >= 1) return totalFrames - 1;
  const index = Math.floor(progress * totalFrames);
  return Math.min(Math.max(0, index), totalFrames - 1);
}

/**
 * Generates deterministic frame URL given a base path, pattern and zero-based index.
 */
export function getFrameUrl(basePath: string, pattern: string, index: number): string {
  const numStr = String(index + 1).padStart(4, '0');
  const filename = pattern.replace('{NNNN}', numStr);
  return `${basePath}/${filename}`;
}

export type DecodedFrame = ImageBitmap | HTMLImageElement;

export interface FrameCacheOptions {
  forwardPreload: number;
  backwardWindow: number;
}

export class BoundedFrameCache {
  private cache = new Map<number, DecodedFrame>();
  private pendingFetches = new Set<number>();
  private forwardPreload: number;
  private backwardWindow: number;

  constructor(options: FrameCacheOptions = { forwardPreload: 6, backwardWindow: 3 }) {
    this.forwardPreload = options.forwardPreload;
    this.backwardWindow = options.backwardWindow;
  }

  public getFrame(index: number): DecodedFrame | null {
    return this.cache.get(index) || null;
  }

  public hasFrame(index: number): boolean {
    return this.cache.has(index);
  }

  public setFrame(index: number, frame: DecodedFrame): void {
    this.cache.set(index, frame);
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Updates target index and fetches missing frames within the window
   * [targetIndex - backwardWindow, targetIndex + forwardPreload].
   * Evicts any frames outside this window.
   */
  public updateWindow(
    targetIndex: number,
    totalFrames: number,
    loadFrameFn: (index: number) => Promise<DecodedFrame | null>
  ): void {
    const minKeep = Math.max(0, targetIndex - this.backwardWindow);
    const maxKeep = Math.min(totalFrames - 1, targetIndex + this.forwardPreload);

    // Evict frames outside window
    this.evictOutsideWindow(minKeep, maxKeep);

    // Prioritize target frame first, then forward, then backward
    const loadOrder: number[] = [targetIndex];

    for (let offset = 1; offset <= this.forwardPreload; offset++) {
      const idx = targetIndex + offset;
      if (idx <= maxKeep && !loadOrder.includes(idx)) {
        loadOrder.push(idx);
      }
    }

    for (let offset = 1; offset <= this.backwardWindow; offset++) {
      const idx = targetIndex - offset;
      if (idx >= minKeep && !loadOrder.includes(idx)) {
        loadOrder.push(idx);
      }
    }

    for (const index of loadOrder) {
      if (!this.cache.has(index) && !this.pendingFetches.has(index)) {
        this.pendingFetches.add(index);
        loadFrameFn(index)
          .then((frame) => {
            this.pendingFetches.delete(index);
            if (frame) {
              // Re-check if index is still inside window before caching
              if (index >= minKeep && index <= maxKeep) {
                this.cache.set(index, frame);
              } else {
                this.releaseFrame(frame);
              }
            }
          })
          .catch(() => {
            this.pendingFetches.delete(index);
          });
      }
    }
  }

  /**
   * Evicts frames outside [minKeep, maxKeep] calling bitmap.close() where applicable.
   */
  public evictOutsideWindow(minKeep: number, maxKeep: number): void {
    for (const [index, frame] of this.cache.entries()) {
      if (index < minKeep || index > maxKeep) {
        this.releaseFrame(frame);
        this.cache.delete(index);
      }
    }
  }

  /**
   * Clears entire cache and releases all owned frames.
   */
  public clear(): void {
    for (const [, frame] of this.cache.entries()) {
      this.releaseFrame(frame);
    }
    this.cache.clear();
    this.pendingFetches.clear();
  }

  private releaseFrame(frame: DecodedFrame): void {
    if ('close' in frame && typeof frame.close === 'function') {
      frame.close();
    }
  }
}
