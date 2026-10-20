-- ====================================================================
-- V1__init_schema.sql: Khởi tạo lược đồ cơ sở dữ liệu ban đầu cho Restaurant OS
-- Tuân thủ: PostgreSQL 15+, UUID primary key, Tiền tệ VND BIGINT, JSONB modifiers
-- ====================================================================

-- 1. Bảng Quản lý Bàn ăn (restaurant_tables)
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(50) NOT NULL UNIQUE,
    qr_code_token VARCHAR(100) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 4,
    status VARCHAR(30) NOT NULL DEFAULT 'IDLE', -- IDLE, OCCUPIED, DINING, BILLING
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Danh mục & Món ăn (dishes)
CREATE TABLE IF NOT EXISTS dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price BIGINT NOT NULL, -- Giá tiền VND (số nguyên, e.g. 55000)
    category VARCHAR(100) NOT NULL, -- APPETIZER, MAIN, DRINK, DESSERT
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Quản lý Đơn hàng (orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES restaurant_tables(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PLACED', -- PLACED, CONFIRMED, PREPARING, SERVED, COMPLETED, CANCELLED
    total_amount BIGINT NOT NULL DEFAULT 0, -- Tổng tiền VND
    idempotency_key VARCHAR(100) UNIQUE, -- Khóa lũy kế chống double-ordering
    customer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Chi tiết món trong đơn (order_items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL, -- Giá tại thời điểm đặt (VND)
    modifiers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Tùy chọn (đá, đường, topping)
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING', -- WAITING, COOKING, READY, SERVED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Kho nguyên vật liệu (inventory_items)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL, -- kg, gram, ml, quả, lon
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    minimum_threshold NUMERIC(12, 3) NOT NULL DEFAULT 0,
    cost_per_unit BIGINT NOT NULL DEFAULT 0, -- Giá nhập trung bình VND
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bảng Định lượng nguyên liệu món ăn (dish_recipes / BOM)
CREATE TABLE IF NOT EXISTS dish_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(12, 3) NOT NULL, -- Số lượng nguyên liệu cần cho 1 suất
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_dish_inventory UNIQUE(dish_id, inventory_item_id)
);

-- Indexes tối ưu truy vấn nghiệp vụ Realtime KDS & Order
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Dữ liệu mẫu khởi tạo (Seed data)
INSERT INTO restaurant_tables (table_number, qr_code_token, capacity, status)
VALUES 
    ('Bàn 01', 'token-table-01', 4, 'IDLE'),
    ('Bàn 02', 'token-table-02', 2, 'IDLE'),
    ('Bàn 03', 'token-table-03', 6, 'IDLE'),
    ('Bàn 04', 'token-table-04', 4, 'IDLE')
ON CONFLICT (table_number) DO NOTHING;

INSERT INTO dishes (name, description, price, category, is_available)
VALUES
    ('Phở Bò Đặc Biệt', 'Bánh phở tươi, nạm gầu tái lăn, nước dùng ninh xương 24h', 75000, 'MAIN', TRUE),
    ('Bún Chả Hà Nội', 'Chả nướng than hoa, bún tươi, rau sống và nước chấm truyền thống', 65000, 'MAIN', TRUE),
    ('Cà Phê Muối Xứ Huế', 'Cà phê Robusta Đắk Lắk hòa quyện lớp kem muối béo mặn nhẹ', 35000, 'DRINK', TRUE),
    ('Trà Mãng Cầu Đắk Lắk', 'Trà lài ủ lạnh kết hợp mãng cầu xiêm tươi ngọt dịu mát', 40000, 'DRINK', TRUE),
    ('Nem Lụi Nướng Sả', 'Set 5 xiên nem lụi nướng sả, bánh tráng và tương chấm đậu phộng', 55000, 'APPETIZER', TRUE)
ON CONFLICT DO NOTHING;
