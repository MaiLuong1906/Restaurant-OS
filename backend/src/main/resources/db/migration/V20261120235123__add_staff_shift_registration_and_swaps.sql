-- ====================================================================
-- Migration: V20261120235123__add_staff_shift_registration_and_swaps.sql
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Thời gian tạo: 23:51:23 20/11/2026
-- --------------------------------------------------------------------
-- Ràng buộc cốt lõi (Core Invariants):
--   1. Tiền tệ bắt buộc dùng BIGINT (số nguyên VND, không dùng float)
--   2. Khối lượng kho dùng NUMERIC(12, 3)
--   3. Thuộc tính tùy biến dùng JSONB (kèm GIN index nếu cần truy vấn)
--   4. Mọi bảng chính phải có created_at và updated_at TIMESTAMPTZ
--   5. Khóa chính ưu tiên UUID (gen_random_uuid())
-- ====================================================================

-- Create table open_shifts
CREATE TABLE open_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_key DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    zone VARCHAR(50) NOT NULL,
    slots_total INT NOT NULL CHECK (slots_total >= 0),
    slots_taken INT NOT NULL DEFAULT 0 CHECK (slots_taken >= 0),
    posted_by_id UUID NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by date
CREATE INDEX idx_open_shifts_date_key ON open_shifts(date_key);

-- Create table shift_registrations
CREATE TABLE shift_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    open_shift_id UUID NOT NULL REFERENCES open_shifts(id) ON DELETE CASCADE,
    date_key DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    note TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index for staff daily lookup
CREATE INDEX idx_shift_registrations_staff_date ON shift_registrations(staff_id, date_key);

-- Trigger to auto‑update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_open_shifts_update BEFORE UPDATE ON open_shifts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_shift_registrations_update BEFORE UPDATE ON shift_registrations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();