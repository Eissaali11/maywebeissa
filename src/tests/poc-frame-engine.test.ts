import { describe, expect, it, vi } from 'vitest';
import {
  BoundedFrameCache,
  calculateFrameIndex,
  DecodedFrame,
  getFrameUrl,
} from '../lib/motion/poc-frame-engine';

describe('UI-MOTION-POC-001 Frame Engine Unit Tests', () => {
  describe('calculateFrameIndex', () => {
    it('FRAME-001: progress 0 returns first frame (index 0)', () => {
      expect(calculateFrameIndex(0, 24)).toBe(0);
    });

    it('FRAME-002: progress 1 returns final frame (index 23)', () => {
      expect(calculateFrameIndex(1, 24)).toBe(23);
    });

    it('FRAME-003: progress values clamp safely for out-of-bound values', () => {
      expect(calculateFrameIndex(-0.5, 24)).toBe(0);
      expect(calculateFrameIndex(1.5, 24)).toBe(23);
      expect(calculateFrameIndex(NaN, 24)).toBe(0);
    });

    it('FRAME-004: reverse progress produces correct index', () => {
      expect(calculateFrameIndex(0.75, 24)).toBe(18);
      expect(calculateFrameIndex(0.5, 24)).toBe(12);
      expect(calculateFrameIndex(0.25, 24)).toBe(6);
    });

    it('getFrameUrl generates deterministic 4-digit formatted URL', () => {
      expect(getFrameUrl('/motion/poc/hero/desktop', 'frame-{NNNN}.png', 0)).toBe(
        '/motion/poc/hero/desktop/frame-0001.png'
      );
      expect(getFrameUrl('/motion/poc/hero/desktop', 'frame-{NNNN}.png', 23)).toBe(
        '/motion/poc/hero/desktop/frame-0024.png'
      );
    });
  });

  describe('BoundedFrameCache', () => {
    function createMockBitmap(): DecodedFrame {
      return {
        close: vi.fn(),
        width: 320,
        height: 180,
      } as unknown as ImageBitmap;
    }

    it('CACHE-001: evicted owned bitmap receives close()', () => {
      const cache = new BoundedFrameCache({ forwardPreload: 2, backwardWindow: 1 });
      const mockBitmap0 = createMockBitmap() as ImageBitmap & { close: ReturnType<typeof vi.fn> };
      const mockBitmap5 = createMockBitmap() as ImageBitmap & { close: ReturnType<typeof vi.fn> };

      cache.setFrame(0, mockBitmap0);
      cache.setFrame(5, mockBitmap5);

      // Evict outside window [2, 5]
      cache.evictOutsideWindow(2, 5);

      expect(mockBitmap0.close).toHaveBeenCalledTimes(1);
      expect(mockBitmap5.close).not.toHaveBeenCalled();
      expect(cache.hasFrame(0)).toBe(false);
      expect(cache.hasFrame(5)).toBe(true);
    });

    it('CACHE-002: cache never exceeds configured bound after eviction cycle', () => {
      const cache = new BoundedFrameCache({ forwardPreload: 3, backwardWindow: 2 });
      const totalFrames = 24;

      // Populate frames 0 to 10
      for (let i = 0; i <= 10; i++) {
        cache.setFrame(i, createMockBitmap());
      }

      // Update target index to 7 (window [5, 10])
      cache.updateWindow(7, totalFrames, async () => null);

      // Frames < 5 should be evicted. Cache size should be <= (backwardWindow + 1 + forwardPreload)
      expect(cache.getCacheSize()).toBeLessThanOrEqual(6);
      expect(cache.hasFrame(4)).toBe(false);
      expect(cache.hasFrame(7)).toBe(true);
    });

    it('CACHE-003: clear/unmount releases all owned bitmaps', () => {
      const cache = new BoundedFrameCache({ forwardPreload: 3, backwardWindow: 2 });
      const mockBitmaps = [
        createMockBitmap() as ImageBitmap & { close: ReturnType<typeof vi.fn> },
        createMockBitmap() as ImageBitmap & { close: ReturnType<typeof vi.fn> },
        createMockBitmap() as ImageBitmap & { close: ReturnType<typeof vi.fn> },
      ];

      mockBitmaps.forEach((bmp, idx) => cache.setFrame(idx, bmp));

      cache.clear();

      mockBitmaps.forEach((bmp) => {
        expect(bmp.close).toHaveBeenCalledTimes(1);
      });
      expect(cache.getCacheSize()).toBe(0);
    });
  });
});
