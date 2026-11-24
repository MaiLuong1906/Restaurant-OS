-- ====================================================================
-- Migration: V20261121055003__add_employee_code_to_users.sql
-- Bổ sung trường employee_code (Mã nhân sự định danh ngắn gọn: CH001, QL001, TN001...)
-- Tuân thủ: PostgreSQL 16, Unique constraint, Seed code cho tài khoản mặc định
-- ====================================================================

-- 1. Bổ sung cột employee_code vào bảng users
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE;

-- 2. Đánh chỉ mục tìm kiếm nhanh cho employee_code
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);

-- 3. Gán mã định danh ban đầu cho các tài khoản quản trị seed mặc định
UPDATE users SET employee_code = 'CH001' WHERE username = 'owner' AND employee_code IS NULL;
UPDATE users SET employee_code = 'QL001' WHERE username = 'manager' AND employee_code IS NULL;
