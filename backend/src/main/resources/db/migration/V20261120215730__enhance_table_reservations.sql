-- ====================================================================
-- Migration: V20261120215730__enhance_table_reservations.sql
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Use Cases: UC_CASH_01 (Create Table Reservation), UC_CASH_02 (Check-in Reserved Table)
-- --------------------------------------------------------------------
-- Ràng buộc cốt lõi (Core Invariants):
--   1. Tiền tệ bắt buộc dùng BIGINT (số nguyên VND, không dùng float)
--   2. Audit columns dùng TIMESTAMPTZ
--   3. Khóa chính UUID (gen_random_uuid())
--   4. Hỗ trợ Idempotency (idempotency_key UNIQUE) chống double-booking
-- ====================================================================

-- 1. Bổ sung cột hỗ trợ Idempotency, phương thức thu cọc và dấu vết Check-in / Hủy
ALTER TABLE table_reservations
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS deposit_method VARCHAR(30),
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 2. Ràng buộc duy nhất cho khóa lũy kế (chống gửi trùng khi mạng lag / bấm đúp)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_table_reservations_idempotency_key'
    ) THEN
        ALTER TABLE table_reservations
            ADD CONSTRAINT uq_table_reservations_idempotency_key UNIQUE (idempotency_key);
    END IF;
END $$;

-- 3. Ràng buộc toàn vẹn trạng thái, số khách và tiền cọc (VND >= 0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_table_reservations_status'
    ) THEN
        ALTER TABLE table_reservations
            ADD CONSTRAINT chk_table_reservations_status
            CHECK (status IN ('PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_table_reservations_guest_count'
    ) THEN
        ALTER TABLE table_reservations
            ADD CONSTRAINT chk_table_reservations_guest_count
            CHECK (guest_count > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_table_reservations_deposit_amount'
    ) THEN
        ALTER TABLE table_reservations
            ADD CONSTRAINT chk_table_reservations_deposit_amount
            CHECK (deposit_amount >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_table_reservations_deposit_method'
    ) THEN
        ALTER TABLE table_reservations
            ADD CONSTRAINT chk_table_reservations_deposit_method
            CHECK (deposit_method IS NULL OR deposit_method IN ('CASH', 'VIETQR', 'CARD'));
    END IF;
END $$;

-- 4. Indexes tối ưu cho Check Table Availability (±2h) & Tra cứu khách đặt bàn tại quầy POS
CREATE INDEX IF NOT EXISTS idx_reservations_table_time_active
    ON table_reservations(table_id, reservation_time)
    WHERE status IN ('PENDING', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_reservations_phone
    ON table_reservations(customer_phone);

CREATE INDEX IF NOT EXISTS idx_reservations_status_time
    ON table_reservations(status, reservation_time);
