import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
  isSupabaseConfigured: true,
}));

import { storageService, optimizeImage } from '../storageService';

// Mock DOM APIs used by optimizeImage in Node.js test environment
class MockFileReader {
  onload: ((e: { target: { result: string } }) => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(_file: unknown) {
    setTimeout(() => {
      this.onload?.({ target: { result: 'data:image/jpeg;base64,mockOriginalBase64' } });
    }, 0);
  }
}

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 1200;
  height = 900;
  private _src = '';

  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }

  get src() {
    return this._src;
  }
}

describe('storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup global DOM mocks
    (globalThis as unknown as { FileReader: typeof MockFileReader }).FileReader = MockFileReader;
    (globalThis as unknown as { Image: typeof MockImage }).Image = MockImage;
    (globalThis as unknown as { document: unknown }).document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 800,
            height: 600,
            getContext: () => ({
              drawImage: vi.fn(),
            }),
            toDataURL: () => 'data:image/jpeg;base64,mockOptimizedBase64',
            toBlob: (cb: (blob: Blob | null) => void) => {
              cb(new Blob(['mock-blob-data'], { type: 'image/jpeg' }));
            },
          };
        }
        return {};
      },
    };
  });

  describe('optimizeImage', () => {
    it('nén và scale ảnh xuống tối đa 800px kèm dataUrl', async () => {
      const mockFile = new File(['fake-image-bytes'], 'test-dish.jpg', { type: 'image/jpeg' });
      const result = await optimizeImage(mockFile);

      expect(result).toHaveProperty('blob');
      expect(result).toHaveProperty('dataUrl');
      expect(result.dataUrl).toBe('data:image/jpeg;base64,mockOptimizedBase64');
    });
  });

  describe('isSupabaseReady', () => {
    it('trả về true khi Supabase Client đã được khởi tạo và cấu hình hợp lệ', () => {
      expect(storageService.isSupabaseReady()).toBe(true);
    });

    it('trả về false khi isSupabaseReady được kiểm tra lúc chưa cấu hình', () => {
      vi.spyOn(storageService, 'isSupabaseReady').mockReturnValueOnce(false);
      expect(storageService.isSupabaseReady()).toBe(false);
    });
  });

  describe('uploadDishImage', () => {
    const mockFile = new File(['fake-bytes'], 'pho_bo.jpg', { type: 'image/jpeg' });

    it('tự động fallback sang Base64 khi Supabase chưa được cấu hình', async () => {
      vi.spyOn(storageService, 'isSupabaseReady').mockReturnValue(false);

      const result = await storageService.uploadDishImage(mockFile);

      expect(result.storageType).toBe('base64');
      expect(result.url).toBe('data:image/jpeg;base64,mockOptimizedBase64');
    });

    it('upload lên Supabase thành công khi client sẵn sàng', async () => {
      vi.spyOn(storageService, 'isSupabaseReady').mockReturnValue(true);
      mockUpload.mockResolvedValueOnce({ error: null });
      mockGetPublicUrl.mockReturnValueOnce({
        data: { publicUrl: 'https://supabase.co/storage/v1/object/public/restaurant-dishes/dishes/mock.jpg' },
      });

      const result = await storageService.uploadDishImage(mockFile);

      expect(result.storageType).toBe('supabase');
      expect(result.url).toBe('https://supabase.co/storage/v1/object/public/restaurant-dishes/dishes/mock.jpg');
      expect(mockUpload).toHaveBeenCalled();
    });

    it('tự động fallback sang Base64 khi upload Supabase gặp lỗi', async () => {
      vi.spyOn(storageService, 'isSupabaseReady').mockReturnValue(true);
      mockUpload.mockResolvedValueOnce({
        error: new Error('Bucket permission denied or bucket does not exist'),
      });

      const result = await storageService.uploadDishImage(mockFile);

      expect(result.storageType).toBe('base64');
      expect(result.url).toBe('data:image/jpeg;base64,mockOptimizedBase64');
    });
  });
});
