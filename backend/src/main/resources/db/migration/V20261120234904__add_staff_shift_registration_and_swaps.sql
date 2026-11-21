-- ====================================================================
-- Migration: V20261120234904__add_staff_shift_registration_and_swaps.sql
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Thời gian tạo: 23:49:04 20/11/2026
-- --------------------------------------------------------------------
-- Ràng buộc cốt lõi (Core Invariants):
--   1. Tiền tệ bắt buộc dùng BIGINT (số nguyên VND, không dùng float)
--   2. Khối lượng kho dùng NUMERIC(12, 3)
--   3. Thuộc tính tùy biến dùng JSONB (kèm GIN index nếu cần truy vấn)
--   4. Mọi bảng chính phải có created_at và updated_at TIMESTAMPTZ
--   5. Khóa chính ưu tiên UUID (gen_random_uuid())
-- ====================================================================

-- Viết các câu lệnh DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX) bên dưới:

