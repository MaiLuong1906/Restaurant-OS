-- ====================================================================
-- scripts/kds-demo-seed.sql: Seed dữ liệu demo kiểm thử UC17 KDS
-- Mục đích: Tạo 2 đơn test thực tế:
--   - Đơn 1: Bàn 04, có món Phở Bò Đặc Biệt kèm dị ứng đậu phộng
--   - Đơn 2: Bàn 01, món Bún Chả Hà Nội, không dị ứng (allergy_note null)
-- Nguyên tắc:
--   - Không hardcode UUID, dùng subquery tra cứu từ dishes, dish_portions và restaurant_tables
--   - Tính lũy kế idempotency_key ('uc17-demo-order-ban04', 'uc17-demo-order-ban01')
--   - Tái chạy nhiều lần an toàn, không sinh duplicate
-- ====================================================================

DO $$
DECLARE
    v_table_04_id UUID;
    v_table_01_id UUID;
    v_dish_pho_id UUID;
    v_dish_pho_name VARCHAR(255);
    v_dish_pho_price BIGINT;
    v_portion_pho_id UUID;
    v_portion_pho_name VARCHAR(50);
    v_dish_buncha_id UUID;
    v_dish_buncha_name VARCHAR(255);
    v_dish_buncha_price BIGINT;
    v_portion_buncha_id UUID;
    v_portion_buncha_name VARCHAR(50);
    v_order_04_id UUID;
    v_order_01_id UUID;
BEGIN
    -- 1. Tra cứu ID bàn ăn từ restaurant_tables
    SELECT id INTO v_table_04_id FROM restaurant_tables WHERE table_number = 'Bàn 04' LIMIT 1;
    SELECT id INTO v_table_01_id FROM restaurant_tables WHERE table_number = 'Bàn 01' LIMIT 1;

    -- 2. Tra cứu ID món ăn, giá và portion mặc định từ dishes + dish_portions
    SELECT d.id, d.name, d.price, dp.id, dp.portion_name
    INTO v_dish_pho_id, v_dish_pho_name, v_dish_pho_price, v_portion_pho_id, v_portion_pho_name
    FROM dishes d
    LEFT JOIN dish_portions dp ON dp.dish_id = d.id AND dp.is_default = TRUE
    WHERE d.name = 'Phở Bò Đặc Biệt' LIMIT 1;

    SELECT d.id, d.name, d.price, dp.id, dp.portion_name
    INTO v_dish_buncha_id, v_dish_buncha_name, v_dish_buncha_price, v_portion_buncha_id, v_portion_buncha_name
    FROM dishes d
    LEFT JOIN dish_portions dp ON dp.dish_id = d.id AND dp.is_default = TRUE
    WHERE d.name = 'Bún Chả Hà Nội' LIMIT 1;

    -- Kiểm tra điều kiện tiên quyết dữ liệu nền
    IF v_table_04_id IS NULL OR v_table_01_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy bàn mẫu Bàn 04 hoặc Bàn 01 trong restaurant_tables';
    END IF;

    IF v_dish_pho_id IS NULL OR v_dish_buncha_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy món mẫu Phở Bò Đặc Biệt hoặc Bún Chả Hà Nội trong dishes';
    END IF;

    -- 3. Tạo Đơn 1: Bàn 04 (Có dị ứng) nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM orders WHERE idempotency_key = 'uc17-demo-order-ban04') THEN
        v_order_04_id := gen_random_uuid();

        INSERT INTO orders (
            id, table_id, status, total_amount, idempotency_key,
            customer_notes, opened_at, created_at, updated_at
        ) VALUES (
            v_order_04_id,
            v_table_04_id,
            'PLACED',
            v_dish_pho_price,
            'uc17-demo-order-ban04',
            'Khách bàn 4 dặn kỹ về dị ứng',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        INSERT INTO order_items (
            id, order_id, dish_id, portion_id,
            dish_name_snapshot, portion_name_snapshot,
            quantity, unit_price, modifiers, status, notes, allergy_note,
            sla_deadline, is_expedited, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_order_04_id,
            v_dish_pho_id,
            v_portion_pho_id,
            v_dish_pho_name,
            COALESCE(v_portion_pho_name, 'Tiêu Chuẩn'),
            1,
            v_dish_pho_price,
            '[]'::jsonb,
            'WAITING',
            'Nhiều hành, nước béo riêng',
            'Dị ứng đậu phộng nặng, không lạc, không tương đậu',
            CURRENT_TIMESTAMP + INTERVAL '15 minutes',
            FALSE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 4. Tạo Đơn 2: Bàn 01 (Không dị ứng) nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM orders WHERE idempotency_key = 'uc17-demo-order-ban01') THEN
        v_order_01_id := gen_random_uuid();

        INSERT INTO orders (
            id, table_id, status, total_amount, idempotency_key,
            customer_notes, opened_at, created_at, updated_at
        ) VALUES (
            v_order_01_id,
            v_table_01_id,
            'PLACED',
            v_dish_buncha_price,
            'uc17-demo-order-ban01',
            NULL,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        INSERT INTO order_items (
            id, order_id, dish_id, portion_id,
            dish_name_snapshot, portion_name_snapshot,
            quantity, unit_price, modifiers, status, notes, allergy_note,
            sla_deadline, is_expedited, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_order_01_id,
            v_dish_buncha_id,
            v_portion_buncha_id,
            v_dish_buncha_name,
            COALESCE(v_portion_buncha_name, 'Tiêu Chuẩn'),
            1,
            v_dish_buncha_price,
            '[]'::jsonb,
            'WAITING',
            'Nướng chả vừa tới',
            NULL,
            CURRENT_TIMESTAMP + INTERVAL '15 minutes',
            FALSE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;
END $$;
