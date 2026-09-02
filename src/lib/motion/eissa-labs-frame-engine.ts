/**
 * UI-HERO-FRAME-SEQUENCE-INTEGRATION-001 Frame Engine
 * Adaptive WebP Manifest Loader, Stale Async Generation Token Manager,
 * Bounded Decoded Frame Cache, and Canvas 2D Cover Renderer for Eissa Labs Hero.
 */

export interface ManifestFrameEntry {
  index: number;
  file: string;
  sourceFrame: number;
  sourceTime: number;
  normalizedProgress: number;
}

export type DecodedFrame = ImageBitmap | HTMLImageElement;

export interface FrameCacheConfig {
  maxCacheSize: number;
  forwardPreloadWindow: number;
  backwardPreloadWindow: number;
}

/**
 * Validates sequence manifest integrity.
 */
export function validateManifest(manifest: unknown): manifest is ManifestFrameEntry[] {
  if (!Array.isArray(manifest) || manifest.length === 0) return false;

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof entry.index !== 'number' ||
      typeof entry.file !== 'string' ||
      typeof entry.sourceFrame !== 'number' ||
      typeof entry.sourceTime !== 'number' ||
      typeof entry.normalizedProgress !== 'number'
    ) {
      return false;
    }
  }

  // Ensure sorted normalizedProgress
  for (let i = 1; i < manifest.length; i++) {
    if (manifest[i].normalizedProgress < manifest[i - 1].normalizedProgress) {
      return false;
    }
  }

  // Ensure boundaries 0 and 1
  if (manifest[0].normalizedProgress !== 0) return false;
  if (manifest[manifest.length - 1].normalizedProgress !== 1) return false;

  return true;
}

/**
 * Binary search lookup for the manifest entry corresponding to scroll progress (0..1).
 */
export function lookupFrameIndexByProgress(
  manifest: ManifestFrameEntry[],
  progress: number
): number {
  if (!manifest || manifest.length === 0) return 0;
  if (Number.isNaN(progress) || progress <= 0) return 0;
  if (progress >= 1) return manifest.length - 1;

  let low = 0;
  let high = manifest.length - 1;
  let bestIndex = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midProgress = manifest[mid].normalizedProgress;

    if (midProgress === progress) {
      return mid;
    } else if (midProgress < progress) {
      bestIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestIndex;
}

/**
 * Closes and frees an ImageBitmap if supported.
 */
export function releaseDecodedFrame(frame: DecodedFrame): void {
  if (typeof ImageBitmap !== 'undefined' && frame instanceof ImageBitmap) {
    try {
      frame.close();
    } catch {
      // Ignore if already closed
    }
  }
}

/**
 * Generation/Variant Token Manager for Stale Async Hardening.
 * Guarantees stale async loads from previous tokens are rejected cleanly.
 */
export class AsyncTokenManager {
  private activeToken = 0;

  public nextToken(): number {
    this.activeToken += 1;
    return this.activeToken;
  }

  public getActiveToken(): number {
    return this.activeToken;
  }

  public isValidToken(token: number): boolean {
    return token === this.activeToken;
  }

  public invalidate(): void {
    this.activeToken += 1;
  }
}

/**
 * Bounded Frame Cache with explicit ImageBitmap eviction & Stale Async Hardening.
 */
export class EissaLabsFrameCache {
  private cache = new Map<number, DecodedFrame>();
  private pendingFetches = new Map<number, number>(); // index -> token
  private tokenManager: AsyncTokenManager;
  private config: FrameCacheConfig;

  constructor(tokenManager: AsyncTokenManager, config: Partial<FrameCacheConfig> = {}) {
    this.tokenManager = tokenManager;
    this.config = {
      maxCacheSize: config.maxCacheSize ?? 30,
      forwardPreloadWindow: config.forwardPreloadWindow ?? 8,
      backwardPreloadWindow: config.backwardPreloadWindow ?? 4,
    };
  }

  public getFrame(index: number): DecodedFrame | null {
    return this.cache.get(index) || null;
  }

  public hasFrame(index: number): boolean {
    return this.cache.has(index);
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public clear(): void {
    for (const frame of this.cache.values()) {
      releaseDecodedFrame(frame);
    }
    this.cache.clear();
    this.pendingFetches.clear();
  }

  public updateWindow(
    targetIndex: number,
    manifest: ManifestFrameEntry[],
    loadFrameFn: (entry: ManifestFrameEntry, token: number) => Promise<DecodedFrame | null>
  ): void {
    if (!manifest || manifest.length === 0) return;

    const currentToken = this.tokenManager.getActiveToken();
    const totalFrames = manifest.length;
    const minKeep = Math.max(0, targetIndex - this.config.backwardPreloadWindow);
    const maxKeep = Math.min(totalFrames - 1, targetIndex + this.config.forwardPreloadWindow);

    // Evict frames outside current window or when cache limit exceeded
    this.evictOutsideWindow(minKeep, maxKeep);

    // Build priority load order
    const loadOrder: number[] = [targetIndex];

    for (let offset = 1; offset <= this.config.forwardPreloadWindow; offset++) {
      const idx = targetIndex + offset;
      if (idx <= maxKeep && !loadOrder.includes(idx)) {
        loadOrder.push(idx);
      }
    }

    for (let offset = 1; offset <= this.config.backwardPreloadWindow; offset++) {
      const idx = targetIndex - offset;
      if (idx >= minKeep && !loadOrder.includes(idx)) {
        loadOrder.push(idx);
      }
    }

    for (const index of loadOrder) {
      if (!this.cache.has(index) && !this.pendingFetches.has(index)) {
        this.pendingFetches.set(index, currentToken);

        loadFrameFn(manifest[index], currentToken)
          .then((frame) => {
            this.pendingFetches.delete(index);
            // STALE ASYNC HARDENING: Verify token & active window before caching
            if (this.tokenManager.isValidToken(currentToken)) {
              if (frame && index >= minKeep && index <= maxKeep) {
                this.cache.set(index, frame);
                this.enforceMaxCapacity(targetIndex);
              } else if (frame) {
                releaseDecodedFrame(frame);
              }
            } else if (frame) {
              // Reject stale async load!
              releaseDecodedFrame(frame);
            }
          })
          .catch(() => {
            this.pendingFetches.delete(index);
          });
      }
    }
  }

  private evictOutsideWindow(minKeep: number, maxKeep: number): void {
    for (const [index, frame] of this.cache.entries()) {
      if (index < minKeep || index > maxKeep) {
        releaseDecodedFrame(frame);
        this.cache.delete(index);
      }
    }
  }

  private enforceMaxCapacity(targetIndex: number): void {
    if (this.cache.size <= this.config.maxCacheSize) return;

    // Find furthest frame from targetIndex and evict it
    let furthestIndex = targetIndex;
    let maxDistance = -1;

    for (const index of this.cache.keys()) {
      const distance = Math.abs(index - targetIndex);
      if (distance > maxDistance) {
        maxDistance = distance;
        furthestIndex = index;
      }
    }

    const frame = this.cache.get(furthestIndex);
    if (frame) {
      releaseDecodedFrame(frame);
      this.cache.delete(furthestIndex);
    }
  }
}

/**
 * Draws a decoded frame onto Canvas 2D with aspect-ratio preserving cover crop.
 */
export function drawCoverFrame(
  ctx: CanvasRenderingContext2D,
  frame: DecodedFrame,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!ctx || !frame || canvasWidth <= 0 || canvasHeight <= 0) return;

  const frameWidth = frame.width || 1280;
  const frameHeight = frame.height || 720;
  const frameRatio = frameWidth / frameHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (canvasRatio > frameRatio) {
    drawHeight = canvasWidth / frameRatio;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * frameRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight);
}
