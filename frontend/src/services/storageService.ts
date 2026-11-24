import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'restaurant-dishes';

export interface UploadResult {
  url: string;
  storageType: 'supabase' | 'base64';
}

/**
 * Nén và tối ưu hóa ảnh trước khi lưu trữ
 * Giới hạn kích thước tối đa 800x800, định dạng JPEG chất lượng 85%
 */
export async function optimizeImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('File ảnh không hợp lệ'));
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ blob: file, dataUrl });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl: optimizedDataUrl });
            } else {
              resolve({ blob: file, dataUrl: optimizedDataUrl });
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const storageService = {
  /**
   * Kiểm tra xem Supabase Storage đã sẵn sàng hoạt động hay chưa
   */
  isSupabaseReady(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  /**
   * Upload ảnh món ăn theo cơ chế Hybrid:
   * 1. Ưu tiên upload lên Supabase Storage (nếu có config và bucket sẵn sàng).
   * 2. Tự động fallback sang Base64 Data URL nếu chưa có config hoặc upload gặp sự cố.
   */
  async uploadDishImage(file: File, bucket = DEFAULT_BUCKET): Promise<UploadResult> {
    // Bước 1: Luôn tối ưu nén ảnh phía client
    const { blob, dataUrl } = await optimizeImage(file);

    // Bước 2: Thử upload lên Supabase Storage nếu đã cấu hình
    if (this.isSupabaseReady() && supabase) {
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
        const filePath = `dishes/${Date.now()}-${cleanName}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.warn(
            '[StorageService] Upload lên Supabase thất bại, tự động fallback sang Base64:',
            uploadError.message
          );
        } else {
          const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              storageType: 'supabase',
            };
          }
        }
      } catch (err) {
        console.warn(
          '[StorageService] Ngoại lệ khi upload Supabase Storage, chuyển sang Base64:',
          err
        );
      }
    }

    // Bước 3: Fallback Base64 an toàn tuyệt đối
    return {
      url: dataUrl,
      storageType: 'base64',
    };
  },
};
