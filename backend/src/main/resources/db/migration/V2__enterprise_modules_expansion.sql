-- ====================================================================
-- V2__enterprise_modules_expansion.sql: Mở Rộng Cơ Sở Dữ Liệu Tinh Gọn (Single-Store Architecture)
-- Dự án: Restaurant OS (PostgreSQL 16+ / Flyway 10+)
-- Căn cứ nghiệp vụ: SPEC-ROS-USECASE-MASTER-01 & ARCH-ROS-DB-MASTER-01
-- Định hướng: Tối ưu cho 1 cơ sở (Loại bỏ branch_id, dùng restaurant_profile duy nhất)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. MODULE 1: HỒ SƠ NHÀ HÀNG & PHÂN QUYỀN (STORE PROFILE & RBAC)
-- --------------------------------------------------------------------

-- 1.1. Bảng Thông tin & Cấu hình Nhà hàng duy nhất (restaurant_profile)
CREATE TABLE IF NOT EXISTS restaurant_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand_slogan VARCHAR(255),
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    vietqr_bank_id VARCHAR(50),                       -- Mã ngân hàng VietQR: 'ICB', 'MB', 'VCB'
    vietqr_account_no VARCHAR(50),                    -- Số tài khoản nhận tiền thanh toán
    vietqr_account_name VARCHAR(100),                 -- Tên chủ tài khoản
    default_vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 8.00,        -- Thuế VAT (%)
    default_service_charge NUMERIC(5, 2) NOT NULL DEFAULT 0.00,  -- Phí dịch vụ (%)
    wifi_ssid VARCHAR(100),
    wifi_password VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Khởi tạo thông tin cơ sở mẫu
INSERT INTO restaurant_profile (name, brand_slogan, address, phone, email, vietqr_bank_id, vietqr_account_no, vietqr_account_name)
VALUES (
    'Restaurant OS - Ẩm Thực Việt Đương Đại',
    'Tinh hoa phong vị Việt - Phục vụ thông minh thời gian thực',
    'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    '0901234567',
    'contact@restaurantos.vn',
    'ICB',
    '102876543210',
    'CONG TY TNHH RESTAURANT OS VIET NAM'
) ON CONFLICT DO NOTHING;

-- 1.2. Bảng Vai trò người dùng (roles)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO roles (id, code, name, description)
VALUES 
    ('00000000-0000-0000-0000-000000000011', 'OWNER', 'Chủ nhà hàng', 'Toàn quyền cấu hình thực đơn, xem báo cáo P&L, quản trị phân quyền'),
    ('00000000-0000-0000-0000-000000000012', 'MANAGER', 'Quản lý nhà hàng', 'Điều phối sàn 2.5D, duyệt mã PIN hủy món, duyệt chốt ca và nhập kho PO'),
    ('00000000-0000-0000-0000-000000000013', 'CASHIER', 'Thu ngân', 'Mở két tiền, quản lý ca, tách/gộp bill, thu tiền mặt & VietQR'),
    ('00000000-0000-0000-0000-000000000014', 'CHEF', 'Đầu bếp (KDS)', 'Quản lý màn hình trạm bếp, gom nấu hàng loạt và báo hao hụt món'),
    ('00000000-0000-0000-0000-000000000015', 'WAITER', 'Nhân viên phục vụ', 'Hỗ trợ gọi món, ra đồ, chấm công GPS Geofence và đổi ca')
ON CONFLICT (code) DO NOTHING;

-- 1.3. Bảng Người dùng & Nhân sự nội bộ (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pin_code_hash VARCHAR(255),                       -- PIN 4-6 số để thu ngân/bếp login nhanh hoặc Quản lý duyệt ngoại lệ
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

INSERT INTO users (id, role_id, username, password_hash, pin_code_hash, full_name, email)
VALUES 
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000011',
        'owner',
        '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1boqviPaQZeWBkxv.H6Ff74sQv2Iwe', -- pass: admin123
        '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- pin: 123456
        'Nguyễn Văn Chủ',
        'owner@restaurantos.vn'
    ),
    (
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000012',
        'manager',
        '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1boqviPaQZeWBkxv.H6Ff74sQv2Iwe',
        '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        'Trần Quản Lý',
        'manager@restaurantos.vn'
    )
ON CONFLICT (username) DO NOTHING;

-- --------------------------------------------------------------------
-- 2. MODULE 2: KHU VỰC, BÀN ĂN & SƠ ĐỒ 2.5D (FLOOR PLAN & TABLES)
-- --------------------------------------------------------------------

-- 2.1. Bảng Khu vực ăn uống (dining_zones)
CREATE TABLE IF NOT EXISTS dining_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,                -- 'Tầng 1 - Sảnh Chính', 'Tầng 2 - Phòng VIP'
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dining_zones (id, name, display_order)
VALUES 
    ('00000000-0000-0000-0000-000000000031', 'Tầng 1 - Sảnh Chính', 1),
    ('00000000-0000-0000-0000-000000000032', 'Tầng 2 - Phòng VIP', 2)
ON CONFLICT (name) DO NOTHING;

-- 2.2. Nâng cấp bảng Bàn ăn (restaurant_tables)
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES dining_zones(id) ON DELETE RESTRICT;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS layout_coordinates JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "width": 80, "height": 80, "shape": "RECTANGLE"}'::jsonb;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS current_order_id UUID;

-- Gán zone_id mặc định cho các bàn đã tồn tại từ V1
UPDATE restaurant_tables 
SET zone_id = '00000000-0000-0000-0000-000000000031' 
WHERE zone_id IS NULL;

ALTER TABLE restaurant_tables ALTER COLUMN zone_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_zone ON restaurant_tables(zone_id);

-- 2.3. Bảng Đặt bàn & Giữ chỗ (table_reservations)
CREATE TABLE IF NOT EXISTS table_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    guest_count INT NOT NULL DEFAULT 2,
    reservation_time TIMESTAMPTZ NOT NULL,
    deposit_amount BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',  -- 'PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW'
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_time ON table_reservations(reservation_time);

-- --------------------------------------------------------------------
-- 3. MODULE 3: THỰC ĐƠN, MÓN ĂN & TRẠM BẾP (MENU CATALOG & STATIONS)
-- --------------------------------------------------------------------

-- 3.1. Bảng Trạm chế biến bếp (kitchen_stations)
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,                 -- 'ST-HOT', 'ST-COLD', 'ST-BAR'
    name VARCHAR(100) NOT NULL,
    printer_ip VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO kitchen_stations (id, code, name)
VALUES 
    ('00000000-0000-0000-0000-000000000041', 'ST-HOT', 'Bếp Nóng (Xào/Nấu/Chiên)'),
    ('00000000-0000-0000-0000-000000000042', 'ST-COLD', 'Bếp Nguội (Salad/Gỏi/Khai vị)'),
    ('00000000-0000-0000-0000-000000000043', 'ST-BAR', 'Quầy Pha Chế (Đồ uống/Bar)')
ON CONFLICT (code) DO NOTHING;

-- 3.2. Bảng Danh mục món ăn (categories)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 1,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (id, name, display_order)
VALUES 
    ('00000000-0000-0000-0000-000000000051', 'Khai Vị', 1),
    ('00000000-0000-0000-0000-000000000052', 'Món Chính', 2),
    ('00000000-0000-0000-0000-000000000053', 'Đồ Uống & Tráng Miệng', 3)
ON CONFLICT (name) DO NOTHING;

-- 3.3. Nâng cấp bảng Món ăn (dishes)
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES kitchen_stations(id);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS preparation_time_minutes INT NOT NULL DEFAULT 15;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_combo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS sold_out_reason VARCHAR(255);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS allergy_flags JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Gán category_id và station_id mặc định cho các món cũ của V1
UPDATE dishes SET 
    category_id = '00000000-0000-0000-0000-000000000052', 
    station_id = '00000000-0000-0000-0000-000000000041'
WHERE category_id IS NULL;

ALTER TABLE dishes ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE dishes ALTER COLUMN station_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dishes_station ON dishes(station_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_allergies ON dishes USING GIN (allergy_flags);

-- 3.4. Bảng Chi tiết Combo món (dish_combos)
CREATE TABLE IF NOT EXISTS dish_combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    item_dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 4. MODULE 4: ĐƠN HÀNG, CHI TIẾT ĐƠN & KDS REALTIME (ORDERS & KDS)
-- --------------------------------------------------------------------

-- 4.1. Nâng cấp bảng Đơn hàng (orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_amount BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_guest_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_table_active ON orders(table_id, status) WHERE status NOT IN ('COMPLETED', 'CANCELLED');

-- 4.2. Nâng cấp bảng Chi tiết món trong đơn (order_items)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES kitchen_stations(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS allergy_note TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS batch_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cooking_started_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS served_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cooked_by UUID REFERENCES users(id);

UPDATE order_items oi
SET station_id = d.station_id
FROM dishes d
WHERE oi.dish_id = d.id AND oi.station_id IS NULL;

ALTER TABLE order_items ALTER COLUMN station_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_station_status ON order_items(station_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_modifiers ON order_items USING GIN (modifiers);

-- 4.3. Bảng Nhật ký hủy món có kiểm toán (order_item_voids)
CREATE TABLE IF NOT EXISTS order_item_voids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    quantity_voided INT NOT NULL,
    reason TEXT NOT NULL,
    wasted BOOLEAN NOT NULL DEFAULT FALSE,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID NOT NULL REFERENCES users(id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 5. MODULE 5: HÓA ĐƠN, TÁCH GỘP BILL & CA THU NGÂN (BILLING & SHIFTS)
-- --------------------------------------------------------------------

-- 5.1. Bảng Hóa đơn tính tiền (bills)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    bill_code VARCHAR(50) NOT NULL UNIQUE,
    subtotal BIGINT NOT NULL,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    discount_reason TEXT,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    service_charge BIGINT NOT NULL DEFAULT 0,
    final_amount BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',     -- 'UNPAID', 'PAID', 'REFUNDED', 'CANCELLED'
    cashier_id UUID NOT NULL REFERENCES users(id),
    approved_discount_by UUID REFERENCES users(id),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bills_order ON bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_paid ON bills(paid_at);

-- 5.2. Bảng Phân bổ món vào Bill hỗ trợ Tách bill (bill_items)
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    quantity INT NOT NULL,
    amount BIGINT NOT NULL
);

-- 5.3. Bảng Giao dịch thanh toán (payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
    payment_method VARCHAR(50) NOT NULL,              -- 'CASH', 'VIETQR', 'POS_CARD', 'VOUCHER'
    amount BIGINT NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    transaction_code VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);

-- 5.4. Bảng Sổ cái kiểm đếm két tiền ca thu ngân (cash_shifts)
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMPTZ,
    opening_cash BIGINT NOT NULL DEFAULT 0,           -- Tiền mặt đầu ca trong két (VND)
    closing_cash_system BIGINT NOT NULL DEFAULT 0,    -- Tiền mặt hệ thống tính (VND)
    closing_cash_actual BIGINT,                       -- Tiền mặt thực tế đếm được (VND)
    discrepancy BIGINT DEFAULT 0,                     -- Chênh lệch: Actual - System (VND)
    total_vietqr_sales BIGINT NOT NULL DEFAULT 0,
    total_card_sales BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',       -- 'OPEN', 'PENDING_APPROVAL', 'CLOSED'
    verified_by UUID REFERENCES users(id),            -- Quản lý duyệt chốt ca
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_shifts_time ON cash_shifts(start_time DESC);

-- --------------------------------------------------------------------
-- 6. MODULE 6: KHO NGUYÊN LIỆU, BOM & SỔ CÁI KHO KÉP (INVENTORY & BOM)
-- --------------------------------------------------------------------

-- 6.1. Bảng Nhà cung cấp nguyên vật liệu (suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    tax_code VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6.2. Nâng cấp bảng Nguyên vật liệu kho (inventory_items)
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS preferred_supplier_id UUID REFERENCES suppliers(id);

CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory_items(current_stock);

-- 6.3. Nâng cấp bảng Định lượng BOM (dish_recipes)
ALTER TABLE dish_recipes ADD COLUMN IF NOT EXISTS gross_quantity NUMERIC(12, 3);
ALTER TABLE dish_recipes ADD COLUMN IF NOT EXISTS net_quantity NUMERIC(12, 3);
ALTER TABLE dish_recipes ADD COLUMN IF NOT EXISTS waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0;

UPDATE dish_recipes 
SET gross_quantity = quantity_required, net_quantity = quantity_required 
WHERE gross_quantity IS NULL;

-- 6.4. Bảng SỔ CÁI BIẾN ĐỘNG KHO BẤT BIẾN (inventory_transactions - Double-Entry Ledger)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    transaction_type VARCHAR(50) NOT NULL,            -- 'PURCHASE_IN', 'SALE_BOM_OUT', 'KITCHEN_WASTE', 'INVENTORY_AUDIT_ADJUST'
    quantity_change NUMERIC(12, 3) NOT NULL,          -- Dương (+) nếu nhập, Âm (-) nếu xuất
    balance_after NUMERIC(12, 3) NOT NULL,            -- Số dư tồn kho sau phát sinh
    cost_price BIGINT NOT NULL DEFAULT 0,             -- Giá vốn tại thời điểm phát sinh (VND)
    reference_id UUID,                                -- ID tham chiếu: order_id, po_id, audit_id
    notes TEXT,
    performed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_item_time ON inventory_transactions(inventory_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_type ON inventory_transactions(transaction_type);

-- 6.5. Bảng Đơn đặt hàng nhập kho (purchase_orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    total_cost BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',      -- 'DRAFT', 'ORDERED', 'RECEIVED', 'REJECTED', 'CANCELLED'
    ordered_by UUID NOT NULL REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6.6. Bảng Chi tiết nguyên vật liệu trong PO (purchase_order_items)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity_ordered NUMERIC(12, 3) NOT NULL,
    quantity_received NUMERIC(12, 3) NOT NULL DEFAULT 0,
    unit_cost BIGINT NOT NULL,
    quality_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT
);

-- 6.7. Bảng Ghi nhận hao hụt / Hỏng hủy bếp (kitchen_wastages)
CREATE TABLE IF NOT EXISTS kitchen_wastages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    quantity NUMERIC(12, 3) NOT NULL,
    cost_loss BIGINT NOT NULL,                        -- Giá trị thiệt hại thất thoát (VND)
    reason_type VARCHAR(50) NOT NULL,                 -- 'BURNT', 'DROPPED', 'EXPIRED', 'DEFECTIVE_PREP'
    reported_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID NOT NULL REFERENCES users(id),
    approved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 7. MODULE 7: NHÂN SỰ, CHẤM CÔNG GPS GEOFENCE & ĐÁNH GIÁ (HR & REVIEWS)
-- --------------------------------------------------------------------

-- 7.1. Bảng Lịch ca làm việc (work_shifts)
CREATE TABLE IF NOT EXISTS work_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    shift_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL,                  -- 'MORNING', 'AFTERNOON', 'NIGHT', 'SPLIT'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role_in_shift VARCHAR(50) NOT NULL,               -- 'WAITER', 'CHEF', 'CASHIER'
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',  -- 'SCHEDULED', 'COMPLETED', 'ABSENT', 'SWAPPED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_shifts_user_date ON work_shifts(user_id, shift_date);

-- 7.2. Bảng Chấm công thực tế định vị GPS Geofence (time_entries)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES work_shifts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    clock_in_lat NUMERIC(10, 7),
    clock_in_lng NUMERIC(10, 7),
    is_geofence_verified BOOLEAN NOT NULL DEFAULT FALSE,
    face_verified_url TEXT,
    work_hours NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);

-- 7.3. Bảng Yêu cầu đổi ca nội bộ (shift_swaps)
CREATE TABLE IF NOT EXISTS shift_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id),
    requester_shift_id UUID NOT NULL REFERENCES work_shifts(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    target_shift_id UUID NOT NULL REFERENCES work_shifts(id),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PEER', -- 'PENDING_PEER', 'PENDING_MANAGER', 'APPROVED', 'REJECTED'
    reason TEXT,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7.4. Bảng Đánh giá thực khách & Phân tích cảm xúc AI (reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    rating_stars INT NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
    food_quality_score INT CHECK (food_quality_score BETWEEN 1 AND 5),
    service_score INT CHECK (service_score BETWEEN 1 AND 5),
    comment TEXT,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    sentiment_label VARCHAR(30),                      -- 'POSITIVE', 'NEUTRAL', 'NEGATIVE'
    manager_response TEXT,
    responded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_stars ON reviews(rating_stars);
