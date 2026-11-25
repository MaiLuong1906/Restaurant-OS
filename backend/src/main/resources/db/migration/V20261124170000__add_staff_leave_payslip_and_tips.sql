-- ====================================================================
-- Migration: V20261124170000__add_staff_leave_payslip_and_tips.sql
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Mô tả: Bổ sung bảng Quản lý đơn xin nghỉ phép (UC_STF_04) và Phiếu lương & Tip (UC_STF_05)
-- --------------------------------------------------------------------
-- Ràng buộc cốt lõi (Core Invariants):
--   1. Tiền tệ bắt buộc dùng BIGINT (số nguyên VND, không dùng float)
--   2. Khóa ngoại tham chiếu users(id) ON DELETE CASCADE
--   3. Đầy đủ created_at và updated_at TIMESTAMPTZ
--   4. Khóa chính UUID (gen_random_uuid())
-- ====================================================================

-- 1. Bảng Đơn xin nghỉ phép nhân viên (leave_requests)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ANNUAL', 'SICK', 'UNPAID')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approved_by VARCHAR(255),
    calendar_days INT NOT NULL CHECK (calendar_days > 0),
    affected_shifts INT NOT NULL DEFAULT 1 CHECK (affected_shifts >= 0),
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_requests_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_leave_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_staff_status ON leave_requests(staff_id, status, created_at DESC);

-- 2. Bảng Phiếu lương nhân viên theo tháng (payslips) - Tiền tệ 100% BIGINT (số nguyên VND)
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    month VARCHAR(7) NOT NULL,
    month_label VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PROVISIONAL' CHECK (status IN ('PROVISIONAL', 'FINAL')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'EXPECTED' CHECK (payment_status IN ('EXPECTED', 'PAID')),
    period_label VARCHAR(100),
    payment_date_label VARCHAR(50),
    payment_note TEXT,
    base_salary BIGINT NOT NULL CHECK (base_salary >= 0),
    worked_hours INT NOT NULL CHECK (worked_hours >= 0),
    hourly_rate BIGINT NOT NULL CHECK (hourly_rate >= 0),
    allowance BIGINT NOT NULL DEFAULT 0 CHECK (allowance >= 0),
    bonus BIGINT NOT NULL DEFAULT 0 CHECK (bonus >= 0),
    tip_amount BIGINT NOT NULL DEFAULT 0 CHECK (tip_amount >= 0),
    deductions BIGINT NOT NULL DEFAULT 0 CHECK (deductions >= 0),
    bhxh_amount BIGINT NOT NULL DEFAULT 0 CHECK (bhxh_amount >= 0),
    advance_amount BIGINT NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
    net_salary BIGINT NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payslips_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_payslips_staff_month UNIQUE (staff_id, month)
);

CREATE INDEX IF NOT EXISTS idx_payslips_staff_month ON payslips(staff_id, month DESC);

-- 3. Bảng Phân bổ tiền Tip theo ca/ngày (tip_records) - Tiền tệ 100% BIGINT (số nguyên VND)
CREATE TABLE IF NOT EXISTS tip_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    tip_date DATE NOT NULL,
    month_key VARCHAR(7) NOT NULL,
    date_label VARCHAR(100),
    shift_label VARCHAR(100) NOT NULL,
    pool_amount BIGINT NOT NULL DEFAULT 0 CHECK (pool_amount >= 0),
    allocated_amount BIGINT NOT NULL CHECK (allocated_amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PAID')),
    payment_note TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tip_records_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tip_records_staff_month ON tip_records(staff_id, month_key DESC, tip_date DESC);
