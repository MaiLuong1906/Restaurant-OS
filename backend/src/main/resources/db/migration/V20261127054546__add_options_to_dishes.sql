-- ====================================================================
-- Migration: V20261127054546__add_options_to_dishes.sql
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Thời gian tạo: 05:45:46 27/11/2026
-- --------------------------------------------------------------------
-- Ràng buộc cốt lõi (Core Invariants):
--   1. Tiền tệ bắt buộc dùng BIGINT (số nguyên VND, không dùng float)
--   2. Khối lượng kho dùng NUMERIC(12, 3)
--   3. Thuộc tính tùy biến dùng JSONB (kèm GIN index nếu cần truy vấn)
--   4. Mọi bảng chính phải có created_at và updated_at TIMESTAMPTZ
--   5. Khóa chính ưu tiên UUID (gen_random_uuid())
-- ====================================================================

-- Viết các câu lệnh DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX) bên dưới:

-- 1. Bổ sung cột options kiểu JSONB vào bảng dishes để lưu trữ các nhóm tùy chọn món ăn (Kích cỡ, Mức độ cay, Topping)
ALTER TABLE dishes
ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Đánh chỉ mục GIN hỗ trợ tối ưu truy vấn JSONB
CREATE INDEX IF NOT EXISTS idx_dishes_options ON dishes USING GIN (options);

