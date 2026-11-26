import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Kiểm tra xem Supabase Client có đủ cấu hình (URL + Anon Key) hợp lệ không
 * Không dùng URL mặc định cứng để tránh lộ thông tin dự án
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey &&
    supabaseAnonKey.trim().length > 10 &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
);

/**
 * Supabase client instance (chỉ khởi tạo khi có đủ URL và anon key)
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

