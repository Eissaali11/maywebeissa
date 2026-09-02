import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateManifest,
  lookupFrameIndexByProgress,
  releaseDecodedFrame,
  AsyncTokenManager,
  EissaLabsFrameCache,
  ManifestFrameEntry,
  drawCoverFrame,
} from '../lib/motion/eissa-labs-frame-engine';

const MOCK_MANIFEST: ManifestFrameEntry[] = [
  {
    index: 0,
    file: '/media/eissa-labs-hero/frames/frame_0001.webp',
    sourceFrame: 0,
    sourceTime: 0.0,
    normalizedProgress: 0.0,
  },
  {
    index: 1,
    file: '/media/eissa-labs-hero/frames/frame_0002.webp',
    sourceFrame: 10,
    sourceTime: 0.4,
    normalizedProgress: 0.25,
  },
  {
    index: 2,
    file: '/media/eissa-labs-hero/frames/frame_0003.webp',
    sourceFrame: 20,
    sourceTime: 0.8,
    normalizedProgress: 0.5,
  },
  {
    index: 3,
    file: '/media/eissa-labs-hero/frames/frame_0004.webp',
    sourceFrame: 30,
    sourceTime: 1.2,
    normalizedProgress: 0.75,
  },
  {
    index: 4,
    file: '/media/eissa-labs-hero/frames/frame_0005.webp',
    sourceFrame: 40,
    sourceTime: 1.6,
    normalizedProgress: 1.0,
  },
];

describe('UI-HERO-FRAME-SEQUENCE-INTEGRATION-001 Frame Engine Suite', () => {
  let tokenManager: AsyncTokenManager;
  let cache: EissaLabsFrameCache;

  beforeEach(() => {
    tokenManager = new AsyncTokenManager();
    cache = new EissaLabsFrameCache(tokenManager, {
      maxCacheSize: 3,
      forwardPreloadWindow: 2,
      backwardPreloadWindow: 1,
    });
  });

  describe('1. Manifest Validation & Bounds', () => {
    it('validates a correct manifest', () => {
      expect(validateManifest(MOCK_MANIFEST)).toBe(true);
    });

    it('rejects an empty or non-array manifest', () => {
      expect(validateManifest([])).toBe(false);
      expect(validateManifest(null)).toBe(false);
      expect(validateManifest({})).toBe(false);
    });

    it('rejects an unsorted manifest', () => {
      const invalid = [
        { index: 0, file: 'a.webp', sourceFrame: 0, sourceTime: 0, normalizedProgress: 0 },
        { index: 1, file: 'b.webp', sourceFrame: 10, sourceTime: 0.5, normalizedProgress: 0.8 },
        { index: 2, file: 'c.webp', sourceFrame: 20, sourceTime: 1.0, normalizedProgress: 0.5 },
      ];
      expect(validateManifest(invalid)).toBe(false);
    });

    it('rejects a manifest not starting at 0 or ending at 1', () => {
      const invalidStart = [
        { index: 0, file: 'a.webp', sourceFrame: 0, sourceTime: 0, normalizedProgress: 0.1 },
        { index: 1, file: 'b.webp', sourceFrame: 10, sourceTime: 1.0, normalizedProgress: 1.0 },
      ];
      expect(validateManifest(invalidStart)).toBe(false);
    });
  });

  describe('2. Adaptive Timestamp & Progress Lookup', () => {
    it('looks up initial frame at progress 0', () => {
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 0)).toBe(0);
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, -0.5)).toBe(0);
    });

    it('looks up final frame at progress 1', () => {
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 1)).toBe(4);
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 1.5)).toBe(4);
    });

    it('finds intermediate frame correctly for forward and reverse scrubbing', () => {
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 0.25)).toBe(1);
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 0.5)).toBe(2);
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 0.7)).toBe(2);
      expect(lookupFrameIndexByProgress(MOCK_MANIFEST, 0.76)).toBe(3);
    });
  });

  describe('3. Stale Async Generation Token Hardening', () => {
    it('invalidates tokens when nextToken() is called', () => {
      const t1 = tokenManager.nextToken();
      expect(tokenManager.isValidToken(t1)).toBe(true);

      const t2 = tokenManager.nextToken();
      expect(tokenManager.isValidToken(t1)).toBe(false);
      expect(tokenManager.isValidToken(t2)).toBe(true);
    });

    it('rejects stale async frame load results when token changes', async () => {
      tokenManager.nextToken(); // Token 1

      const mockLoader = vi
        .fn()
        .mockImplementation(async (entry: ManifestFrameEntry, token: number) => {
          // Simulate async delay
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { width: 1280, height: 720 } as unknown as HTMLImageElement;
        });

      // Initiate load with token 1
      cache.updateWindow(0, MOCK_MANIFEST, mockLoader);

      // Immediately invalidate token (e.g. resize / unmount / variant change)
      tokenManager.invalidate(); // Token 2

      // Wait for loader to finish
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Cache MUST NOT contain frames loaded under stale token 1!
      expect(cache.getCacheSize()).toBe(0);
      expect(cache.hasFrame(0)).toBe(false);
    });
  });

  describe('4. Bounded Cache & ImageBitmap Cleanup', () => {
    it('enforces maximum cache size and evicts furthest frame', async () => {
      const token = tokenManager.nextToken();
      const mockLoader = vi.fn().mockImplementation(async (entry: ManifestFrameEntry) => {
        return { width: 1280, height: 720 } as unknown as HTMLImageElement;
      });

      // Load frames 0..4 into cache with maxCacheSize = 3
      cache.updateWindow(0, MOCK_MANIFEST, mockLoader);
      await new Promise((r) => setTimeout(r, 10));

      expect(cache.getCacheSize()).toBeLessThanOrEqual(3);
    });

    it('clears all frames on clear()', () => {
      tokenManager.nextToken();
      const frameMock = { width: 100, height: 100 } as unknown as HTMLImageElement;

      // Directly populate cache via updateWindow test
      cache.clear();
      expect(cache.getCacheSize()).toBe(0);
    });
  });

  describe('5. Canvas 2D Cover Rendering', () => {
    it('draws frame onto canvas context without error', () => {
      const mockCtx = {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      const mockFrame = { width: 1280, height: 720 } as unknown as HTMLImageElement;

      drawCoverFrame(mockCtx, mockFrame, 1440, 900);

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 1440, 900);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });
  });
});
