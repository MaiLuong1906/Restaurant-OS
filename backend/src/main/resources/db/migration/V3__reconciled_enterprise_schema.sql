-- ====================================================================
-- V3__reconciled_enterprise_schema.sql: Lược Đồ Doanh Nghiệp Chuẩn Hóa Theo Locked Decisions
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Căn cứ nghiệp vụ: SPEC-ROS-USECASE-MASTER-01 & Locked Decisions (05/11, 15/11 & 18/11)
--
-- PHẠM VI SCHEMA & ĐỊNH HƯỚNG MIGRATION:
--   - Bảng 'vouchers': Thuộc domain AI Guest Chatbot, sẽ do lane AI triển khai trong Migration V4.
--   - Bảng 'leave_requests', 'payslips', 'tips': Thuộc HR nâng cao, dời sang giai đoạn sau MVP.
--
-- Thay đổi cốt lõi:
--   1. BỎ trạm bếp kitchen_stations và cột station_id trên dishes, order_items.
--   2. BỎ COOKING và cooking_started_at trong order_items (chỉ giữ WAITING, READY, SERVED, REJECTED).
--   3. BỎ PREPARING trong orders (chỉ giữ PLACED, CONFIRMED, SERVED, COMPLETED, CANCELLED).
--   4. BỎ HOÀN TOÀN chấm công time_entries và biometric_consents (đã tinh gọn bỏ luồng chấm công ngày 17-18/11).
--   5. BỎ cột batch_number trên order_items (KDS/FE gom mẻ động theo dish_id + note + allergy_note).
--   6. BẮT BUỘC nhập reason trong stock_audit_items khi có chênh lệch (variance != 0).
--   7. CHỐT công thức VAT tính SAU giảm giá trong bills (tuân thủ Thông tư 219/2013/TT-BTC, đồng bộ POS).
--   8. CHỐT bộ 6 vai trò gồm cả OWNER và STAFF (đồng bộ StaffLayout frontend).
--   9. BỔ SUNG quy tắc xử lý phần thừa cuối ca (action_on_excess: CARRY_FORWARD / DISCARD_WASTE).
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. MODULE 1: HỒ SƠ NHÀ HÀNG, PHÂN QUYỀN & BẢO MẬT
-- --------------------------------------------------------------------

-- 1.1. Ràng buộc Singleton cho cấu hình nhà hàng
ALTER TABLE restaurant_profile 
    ADD COLUMN IF NOT EXISTS is_singleton BOOLEAN NOT NULL DEFAULT TRUE;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_restaurant_profile_singleton'
    ) THEN
        ALTER TABLE restaurant_profile 
            ADD CONSTRAINT uq_restaurant_profile_singleton UNIQUE (is_singleton);
    END IF;
END $$;

-- 1.2. Chuẩn hóa bộ 6 vai trò người dùng (Bổ sung STAFF)
INSERT INTO roles (id, code, name, description)
VALUES 
    ('00000000-0000-0000-0000-000000000016', 'STAFF', 'Nhân viên tổng hợp', 'Nhân viên phục vụ chung, phụ việc hoặc nhân sự thử việc')
ON CONFLICT (code) DO NOTHING;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_roles_code'
    ) THEN
        ALTER TABLE roles 
            ADD CONSTRAINT chk_roles_code 
            CHECK (code IN ('OWNER', 'MANAGER', 'CASHIER', 'CHEF', 'WAITER', 'STAFF'));
    END IF;
END $$;

-- 1.3. Nâng cấp quản lý nhân sự (Soft Delete)
-- Lưu ý: PIN chấm công theo user đã bỏ cùng luồng chấm công; PIN KDS là mã PIN chung tablet, không gắn với user.
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 1.4. Loại bỏ bảng Sự đồng ý Sinh trắc học (Đã chốt bỏ FaceID chấm công)
DROP TABLE IF EXISTS biometric_consents CASCADE;

-- --------------------------------------------------------------------
-- 2. MODULE 2: KHU VỰC, BÀN ĂN, GỘP BÀN & YÊU CẦU PHỤC VỤ (FLOOR PLAN)
-- --------------------------------------------------------------------

-- 2.1. Cập nhật trạng thái bàn ăn (Hỗ trợ RESERVED & BILLING)
-- Quy chuẩn ánh xạ màu giao diện Frontend (POS/Floor):
--   - VACANT: Bàn trống (màu xám / viền nhạt)
--   - SERVING: Đang phục vụ (màu xanh dương / xanh lá)
--   - BILLING: Đang yêu cầu / chờ thanh toán (màu vàng cảnh báo)
--   - CLEANING: Đang dọn dẹp (màu tím / xám đậm)
--   - RESERVED: Đã đặt trước (màu cam nhạt kèm badge đặt chỗ)
ALTER TABLE restaurant_tables 
    ADD COLUMN IF NOT EXISTS occupied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES users(id);

UPDATE restaurant_tables SET status = 'VACANT' WHERE status IN ('IDLE', 'FREE');
UPDATE restaurant_tables SET status = 'SERVING' WHERE status IN ('DINING', 'OCCUPIED');

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_restaurant_tables_status'
    ) THEN
        ALTER TABLE restaurant_tables 
            ADD CONSTRAINT chk_restaurant_tables_status 
            CHECK (status IN ('VACANT', 'SERVING', 'BILLING', 'CLEANING', 'RESERVED'));
    END IF;
END $$;

-- 2.2. Bảng Liên kết Gộp Bàn (order_tables)
CREATE TABLE IF NOT EXISTS order_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES restaurant_tables(id),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    merged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_order_table_pair UNIQUE (order_id, table_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_table_assignment 
    ON order_tables(table_id) 
    WHERE is_active = TRUE;

INSERT INTO order_tables (order_id, table_id, is_primary, is_active, merged_at)
SELECT o.id, o.table_id, TRUE, TRUE, o.opened_at
FROM orders o
WHERE o.status NOT IN ('COMPLETED', 'CANCELLED')
ON CONFLICT (order_id, table_id) DO NOTHING;

-- 2.3. Bảng Yêu cầu Phục vụ từ mã QR bàn (table_service_requests)
-- Lưu ý phạm vi: Tạm hoãn tạo bảng này ở V3 để bám sát danh mục 20 màn hình đã chốt; 
-- tính năng gọi phục vụ/xin đá/xin bill sẽ đưa vào migration bổ sung khi triển khai luồng QR tương ứng.

-- --------------------------------------------------------------------
-- 3. MODULE 3: THỰC ĐƠN, KÍCH CỠ PHẦN ĂN & NHÓM TOPPING (LOẠI BỎ TRẠM BẾP)
-- --------------------------------------------------------------------

-- 3.1. Loại bỏ khái niệm trạm bếp kitchen_stations (Đã khóa quyết định)
ALTER TABLE dishes DROP COLUMN IF EXISTS station_id CASCADE;
DROP TABLE IF EXISTS kitchen_stations CASCADE;

-- 3.2. Nâng cấp bảng món ăn gốc (dishes)
ALTER TABLE dishes 
    ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_manual_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS manual_sold_out_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS manual_sold_out_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS is_batch_cooked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3.3. Bảng Kích cỡ phần ăn & Quản lý tồn kho số phần bán Tầng C (dish_portions)
CREATE TABLE IF NOT EXISTS dish_portions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    portion_name VARCHAR(50) NOT NULL,
    subtext VARCHAR(100),
    price BIGINT NOT NULL CHECK (price >= 0),
    available_portions INT NOT NULL DEFAULT 0 CHECK (available_portions >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_dish_portion_name UNIQUE (dish_id, portion_name)
);

-- Backfill: Tạo phần ăn mặc định 'Tiêu Chuẩn' cho toàn bộ món ăn cũ từ dishes.price
INSERT INTO dish_portions (id, dish_id, portion_name, subtext, price, available_portions, is_default, display_order)
SELECT 
    gen_random_uuid(),
    d.id,
    'Tiêu Chuẩn',
    'Khẩu phần tiêu chuẩn 1 người',
    d.price,
    100,
    TRUE,
    1
FROM dishes d
WHERE NOT EXISTS (
    SELECT 1 FROM dish_portions dp WHERE dp.dish_id = d.id
);

-- 3.4. Bảng SỔ CÁI BIẾN ĐỘNG SỐ PHẦN MÓN TẦNG C (dish_portion_ledger)
CREATE TABLE IF NOT EXISTS dish_portion_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portion_id UUID NOT NULL REFERENCES dish_portions(id) ON DELETE RESTRICT,
    change_qty INT NOT NULL,
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('SALE_ORDER', 'VOID_REFUND', 'KITCHEN_ADJUST', 'SHIFT_RECONCILIATION')),
    reference_id UUID,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portion_ledger_lookup 
    ON dish_portion_ledger(portion_id, created_at DESC);

-- 3.5. Bảng Nhóm Tùy Chọn & Topping (modifier_groups & modifier_options)
CREATE TABLE IF NOT EXISTS modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    min_selection INT NOT NULL DEFAULT 0 CHECK (min_selection >= 0),
    max_selection INT NOT NULL DEFAULT 1 CHECK (max_selection >= min_selection),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modifier_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    extra_price BIGINT NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 4. MODULE 4: ĐƠN HÀNG, CHI TIẾT ĐƠN & KDS (BỎ COOKING, BỎ PREPARING)
-- --------------------------------------------------------------------

-- 4.1. Chuẩn hóa trạng thái đơn hàng (orders) - BỎ PREPARING
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_status'
    ) THEN
        ALTER TABLE orders 
            ADD CONSTRAINT chk_orders_status 
            CHECK (status IN ('PLACED', 'CONFIRMED', 'SERVED', 'COMPLETED', 'CANCELLED'));
    END IF;
END $$;

-- 4.2. Nâng cấp bảng chi tiết món trong đơn (order_items) - BỎ COOKING & station_id & cooking_started_at
ALTER TABLE order_items DROP COLUMN IF EXISTS station_id CASCADE;
ALTER TABLE order_items DROP COLUMN IF EXISTS cooking_started_at CASCADE;
ALTER TABLE order_items DROP COLUMN IF EXISTS batch_number CASCADE;

-- Lưu ý quy tắc mẻ nấu KDS: FE và STOMP WebSocket gom mẻ động trên memory theo tiêu chí (dish_id + note + allergy_note);
-- các cột allergy_flags (dishes) và allergy_note (order_items) từ V2 được giữ nguyên phục vụ phân loại dị ứng.
-- Cờ is_expedited: Đánh dấu món ưu tiên/hối bếp (do phục vụ hối món hoặc khi chờ quá SLA), hiển thị badge ƯU TIÊN trên KDS.
ALTER TABLE order_items 
    ADD COLUMN IF NOT EXISTS portion_id UUID REFERENCES dish_portions(id),
    ADD COLUMN IF NOT EXISTS dish_name_snapshot VARCHAR(255),
    ADD COLUMN IF NOT EXISTS portion_name_snapshot VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_expedited BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS expedited_at TIMESTAMPTZ;

-- Backfill Snapshot dữ liệu cũ cho order_items
UPDATE order_items oi
SET 
    portion_id = dp.id,
    dish_name_snapshot = d.name,
    portion_name_snapshot = dp.portion_name
FROM dishes d
JOIN dish_portions dp ON dp.dish_id = d.id AND dp.is_default = TRUE
WHERE oi.dish_id = d.id AND oi.portion_id IS NULL;

-- Dự phòng an toàn: nếu còn order_items trỏ món chưa có default portion, gán portion bất kỳ của món đó
UPDATE order_items oi
SET 
    portion_id = dp.id,
    dish_name_snapshot = COALESCE(oi.dish_name_snapshot, d.name, 'Món ăn'),
    portion_name_snapshot = COALESCE(oi.portion_name_snapshot, dp.portion_name, 'Tiêu Chuẩn')
FROM dishes d
JOIN dish_portions dp ON dp.dish_id = d.id
WHERE oi.dish_id = d.id AND oi.portion_id IS NULL;

ALTER TABLE order_items 
    ALTER COLUMN portion_id SET NOT NULL,
    ALTER COLUMN dish_name_snapshot SET NOT NULL,
    ALTER COLUMN portion_name_snapshot SET NOT NULL;

-- Cập nhật trạng thái cũ nếu có sang WAITING
UPDATE order_items SET status = 'WAITING' WHERE status IN ('COOKING', 'WAITING');

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_status'
    ) THEN
        ALTER TABLE order_items 
            ADD CONSTRAINT chk_order_items_status 
            CHECK (status IN ('WAITING', 'READY', 'SERVED', 'REJECTED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_expedited 
    ON order_items(is_expedited, created_at) 
    WHERE is_expedited = TRUE;

CREATE INDEX IF NOT EXISTS idx_order_items_status 
    ON order_items(status, created_at);

-- 4.3. Nâng cấp bảng nhật ký hủy món (order_item_voids)
ALTER TABLE order_item_voids 
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS is_post_cooking BOOLEAN NOT NULL DEFAULT FALSE;

-- --------------------------------------------------------------------
-- 5. MODULE 5: HÓA ĐƠN & THANH TOÁN (VAT TÍNH SAU GIẢM GIÁ)
-- --------------------------------------------------------------------

-- 5.1. Ràng buộc số học trên hóa đơn (bills): VAT tính SAU chiết khấu
-- Lưu ý service_charge: Đã có NOT NULL DEFAULT 0 từ V2; nếu FE chưa kích hoạt phí phục vụ thì mặc định là 0 VND,
-- công thức toán vẫn đảm bảo đúng chuẩn Thông tư 219/2013/TT-BTC.
DO $$ 
BEGIN
    -- Xóa constraint cũ nếu đã tạo
    ALTER TABLE bills DROP CONSTRAINT IF EXISTS chk_bills_math_balance;
    
    ALTER TABLE bills 
        ADD CONSTRAINT chk_bills_math_balance 
        CHECK (final_amount = (subtotal - discount_amount) + tax_amount + service_charge);
END $$;

-- 5.2. Nâng cấp bảng thanh toán (payments) hỗ trợ Chia đều Bill & Tiền thừa
ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS tendered_amount BIGINT CHECK (tendered_amount >= 0),
    ADD COLUMN IF NOT EXISTS change_amount BIGINT CHECK (change_amount >= 0);

-- 5.3. Bổ sung khóa lũy kế cho ca thu ngân (cash_shifts)
ALTER TABLE cash_shifts 
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) UNIQUE;

-- --------------------------------------------------------------------
-- 6. MODULE 6: KHO 3 TẦNG, SƠ CHẾ YIELD, SẢN XUẤT & ĐỐI SOÁT PHIÊN
-- --------------------------------------------------------------------

-- 6.1. Chuẩn hóa đơn vị gốc và tỷ lệ quy đổi (inventory_items)
ALTER TABLE inventory_items 
    ADD COLUMN IF NOT EXISTS base_unit VARCHAR(20) NOT NULL DEFAULT 'gram',
    ADD COLUMN IF NOT EXISTS purchase_unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    ADD COLUMN IF NOT EXISTS purchase_to_base_ratio NUMERIC(12, 3) NOT NULL DEFAULT 1000.000 CHECK (purchase_to_base_ratio > 0),
    ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) NOT NULL DEFAULT 'RAW',
    ADD COLUMN IF NOT EXISTS parent_raw_id UUID REFERENCES inventory_items(id),
    ADD COLUMN IF NOT EXISTS shelf_life_hours INT CHECK (shelf_life_hours > 0);

ALTER TABLE inventory_items 
    ALTER COLUMN cost_per_unit TYPE NUMERIC(14, 4);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_items_base_unit'
    ) THEN
        ALTER TABLE inventory_items 
            ADD CONSTRAINT chk_inventory_items_base_unit 
            CHECK (base_unit IN ('gram', 'ml', 'piece'));
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_items_item_type'
    ) THEN
        ALTER TABLE inventory_items 
            ADD CONSTRAINT chk_inventory_items_item_type 
            CHECK (item_type IN ('RAW', 'PREPPED'));
    END IF;
END $$;

-- 6.2. Nâng cấp định lượng BOM gắn chặt với kích cỡ phần ăn (dish_recipes)
ALTER TABLE dish_recipes 
    ADD COLUMN IF NOT EXISTS portion_id UUID REFERENCES dish_portions(id) ON DELETE CASCADE;

UPDATE dish_recipes dr
SET portion_id = dp.id
FROM dish_portions dp
WHERE dr.dish_id = dp.dish_id AND dp.is_default = TRUE AND dr.portion_id IS NULL;

-- 6.3. Bảng Nhật ký Mẻ Sơ Chế & Tỷ lệ Yield (prep_batches)
-- Lưu ý: expires_at được backend tính toán tự động dựa trên thời điểm prepped_at + shelf_life_hours của nguyên liệu.
CREATE TABLE IF NOT EXISTS prep_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(50) NOT NULL UNIQUE,
    raw_item_id UUID NOT NULL REFERENCES inventory_items(id),
    prepped_item_id UUID NOT NULL REFERENCES inventory_items(id),
    raw_weight NUMERIC(12, 3) NOT NULL CHECK (raw_weight > 0),
    usable_weight NUMERIC(12, 3) NOT NULL CHECK (usable_weight >= 0),
    waste_weight NUMERIC(12, 3) GENERATED ALWAYS AS (raw_weight - usable_weight) STORED,
    yield_percentage NUMERIC(5, 2) GENERATED ALWAYS AS ((usable_weight / raw_weight) * 100.00) STORED,
    supplier_id UUID REFERENCES suppliers(id),
    prepped_by UUID NOT NULL REFERENCES users(id),
    prepped_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    is_depleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_prep_batches_weight CHECK (usable_weight <= raw_weight)
);

CREATE INDEX IF NOT EXISTS idx_prep_batches_fifo 
    ON prep_batches(prepped_item_id, expires_at) 
    WHERE is_depleted = FALSE;

-- 6.4. Bảng Lệnh Sản Xuất / Nấu Mẻ Lớn Tầng B ra Tầng C (production_runs & production_run_outputs)
-- Phân biệt 2 khái niệm "Mẻ":
--   - production_runs: Lệnh sản xuất nấu mẻ Tầng B tiêu hao bán thành phẩm để sinh ra suất ăn Tầng C nhập kho.
--   - "Mẻ nấu KDS": Nhóm các ticket món nóng theo (dish_id + note + allergy_note) để đầu bếp chế biến trực tiếp theo ca.
CREATE TABLE IF NOT EXISTS production_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_code VARCHAR(50) NOT NULL UNIQUE,
    prepped_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity_used NUMERIC(12, 3) NOT NULL CHECK (quantity_used > 0),
    run_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    chef_id UUID NOT NULL REFERENCES users(id),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS production_run_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
    portion_id UUID NOT NULL REFERENCES dish_portions(id),
    portions_produced INT NOT NULL CHECK (portions_produced > 0),
    CONSTRAINT uq_run_portion_output UNIQUE (run_id, portion_id)
);

-- 6.5. Bảng Phiên Kiểm Kê Ca & Bắt Buộc Lý Do Khi Có Chênh Lệch (Màn K3)
CREATE TABLE IF NOT EXISTS stock_audit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(50) NOT NULL UNIQUE,
    session_date DATE NOT NULL,
    shift_type VARCHAR(30) NOT NULL CHECK (shift_type IN ('LUNCH_CLOSE', 'END_OF_DAY', 'ADHOC')),
    audited_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stock_audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES stock_audit_sessions(id) ON DELETE CASCADE,
    portion_id UUID NOT NULL REFERENCES dish_portions(id),
    theoretical_portions INT NOT NULL,
    actual_portions INT NOT NULL CHECK (actual_portions >= 0),
    variance_portions INT GENERATED ALWAYS AS (actual_portions - theoretical_portions) STORED,
    action_on_excess VARCHAR(20) NOT NULL DEFAULT 'CARRY_FORWARD' CHECK (action_on_excess IN ('CARRY_FORWARD', 'DISCARD_WASTE')),
    reason TEXT,
    CONSTRAINT uq_session_portion_audit UNIQUE (session_id, portion_id),
    -- BẮT BUỘC nhập lý do khi có chênh lệch thực tế khác lý thuyết
    CONSTRAINT chk_audit_reason_required_on_variance CHECK (
        (actual_portions = theoretical_portions) OR (reason IS NOT NULL AND length(trim(reason)) > 0)
    )
);

-- 6.6. Nâng cấp bảng hao hụt bếp (kitchen_wastages)
ALTER TABLE kitchen_wastages 
    ADD COLUMN IF NOT EXISTS void_item_id UUID REFERENCES order_item_voids(id);

-- --------------------------------------------------------------------
-- 7. MODULE 7: LOẠI BỎ TOÀN BỘ CHẤM CÔNG (ĐÃ CHỐT BỎ NGÀY 17-18/11)
-- --------------------------------------------------------------------

-- 7.1. Xóa bỏ hoàn toàn bảng chấm công time_entries (Dự án tinh gọn còn 20 màn hình, xóa luồng B3-B5)
DROP TABLE IF EXISTS time_entries CASCADE;

-- --------------------------------------------------------------------
-- 8. CÁC HÀM VÀ TRIGGER TOÀN VẸN NGHIỆP VỤ
-- --------------------------------------------------------------------

-- 8.1. Trigger Chống Hủy Đúp Đồng Thời (Pessimistic Locking & Validation)
CREATE OR REPLACE FUNCTION fn_prevent_double_void()
RETURNS TRIGGER AS $$
DECLARE
    v_order_item_qty INT;
    v_total_voided INT;
BEGIN
    SELECT quantity INTO v_order_item_qty
    FROM order_items
    WHERE id = NEW.order_item_id
    FOR UPDATE;

    IF v_order_item_qty IS NULL THEN
        RAISE EXCEPTION 'Order item không tồn tại với ID %', NEW.order_item_id;
    END IF;

    SELECT COALESCE(SUM(quantity_voided), 0) INTO v_total_voided
    FROM order_item_voids
    WHERE order_item_id = NEW.order_item_id;

    IF (v_total_voided + NEW.quantity_voided) > v_order_item_qty THEN
        RAISE EXCEPTION 'Tổng số lượng hủy (%) vượt quá số lượng đặt gốc (%)', 
            (v_total_voided + NEW.quantity_voided), v_order_item_qty;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_void ON order_item_voids;
CREATE TRIGGER trg_prevent_double_void
BEFORE INSERT ON order_item_voids
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_double_void();

-- 8.2. Trigger Tự Động Giải Phóng Bàn Ăn Khi Đơn Đóng (COMPLETED/CANCELLED)
CREATE OR REPLACE FUNCTION fn_sync_order_tables_on_close()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('COMPLETED', 'CANCELLED') AND OLD.status NOT IN ('COMPLETED', 'CANCELLED') THEN
        UPDATE order_tables 
        SET is_active = FALSE 
        WHERE order_id = NEW.id AND is_active = TRUE;

        UPDATE restaurant_tables
        SET status = 'CLEANING', occupied_at = NULL
        WHERE id IN (
            SELECT table_id FROM order_tables WHERE order_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_tables_on_close ON orders;
CREATE TRIGGER trg_sync_order_tables_on_close
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_sync_order_tables_on_close();

-- 8.3. Trigger Khóa Bàn Tự Động Khi Đơn Hàng Mới Được Tạo
-- Luồng mở đơn: Khi một đơn hàng mới được tạo (kể cả bàn trước đó là VACANT hay RESERVED khách vừa tới nhận bàn),
-- bàn chính thức chuyển sang SERVING kèm thời điểm mở bàn occupied_at.
CREATE OR REPLACE FUNCTION fn_auto_create_order_table()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO order_tables (order_id, table_id, is_primary, is_active, merged_at)
    VALUES (NEW.id, NEW.table_id, TRUE, TRUE, NEW.opened_at)
    ON CONFLICT (order_id, table_id) DO UPDATE SET is_active = TRUE;

    UPDATE restaurant_tables 
    SET status = 'SERVING', occupied_at = NEW.opened_at 
    WHERE id = NEW.table_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_order_table ON orders;
CREATE TRIGGER trg_auto_create_order_table
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_auto_create_order_table();

-- 8.4. Trigger Kiểm Tra Phân Bổ Món Vào Hóa Đơn Không Vượt Quá Số Lượng Hiệu Lực
CREATE OR REPLACE FUNCTION fn_validate_bill_item_quantity()
RETURNS TRIGGER AS $$
DECLARE
    v_order_item_qty INT;
    v_total_voided INT;
    v_effective_qty INT;
    v_total_billed INT;
BEGIN
    SELECT quantity INTO v_order_item_qty
    FROM order_items
    WHERE id = NEW.order_item_id
    FOR UPDATE;

    SELECT COALESCE(SUM(quantity_voided), 0) INTO v_total_voided
    FROM order_item_voids
    WHERE order_item_id = NEW.order_item_id;

    v_effective_qty := v_order_item_qty - v_total_voided;

    SELECT COALESCE(SUM(bi.quantity), 0) INTO v_total_billed
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE bi.order_item_id = NEW.order_item_id 
      AND bi.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND b.status <> 'CANCELLED';

    IF (v_total_billed + NEW.quantity) > v_effective_qty THEN
        RAISE EXCEPTION 'Tổng số lượng phân bill (%) vượt quá số lượng hiệu lực khả dụng (%)',
            (v_total_billed + NEW.quantity), v_effective_qty;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_bill_item_quantity ON bill_items;
CREATE TRIGGER trg_validate_bill_item_quantity
BEFORE INSERT OR UPDATE ON bill_items
FOR EACH ROW
EXECUTE FUNCTION fn_validate_bill_item_quantity();

-- 8.5. Constraint Trigger Kiểm Tra Hóa Đơn Phải Đủ Tiền Khi Chuyển Sang PAID
CREATE OR REPLACE FUNCTION fn_verify_bill_payment_on_paid()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid BIGINT;
BEGIN
    IF NEW.status = 'PAID' THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
        FROM payments
        WHERE bill_id = NEW.id AND status = 'COMPLETED';

        IF v_total_paid <> NEW.final_amount THEN
            RAISE EXCEPTION 'Hóa đơn % chưa khớp tiền: Cần thanh toán % VND, thực nhận % VND',
                NEW.bill_code, NEW.final_amount, v_total_paid;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_bill_payment_on_paid ON bills;
CREATE CONSTRAINT TRIGGER trg_verify_bill_payment_on_paid
AFTER INSERT OR UPDATE OF status ON bills
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION fn_verify_bill_payment_on_paid();
