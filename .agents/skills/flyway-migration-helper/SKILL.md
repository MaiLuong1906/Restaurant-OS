---
name: flyway-migration-helper
description: >-
  Sử dụng kỹ năng này khi người dùng yêu cầu tạo mới bảng database, thay đổi schema, thêm cột, hoặc viết script migration cho Spring Boot và PostgreSQL. Đảm bảo tuân thủ chuẩn đặt tên Flyway, kiểu dữ liệu JSONB và số nguyên VND.
---

# Kỹ Năng: Tạo File Migration Database Chuẩn Flyway (flyway-migration-helper)

Quy trình chuẩn từng bước để tạo script SQL versioning trong `backend/src/main/resources/db/migration/`.

---

## Bước 1: Quy Ước Đặt Tên File Migration
- Kiểm tra danh sách các file migration hiện có trong thư mục `backend/src/main/resources/db/migration/`.
- Xác định số phiên bản tiếp theo: `V<Số_Thứ_Tự>__<Tên_Mô_Tả_Snake_Case>.sql` (dùng 2 dấu gạch dưới `__`).
- Ví dụ: `V1__init_restaurant_schema.sql`, `V2__create_orders_and_bom.sql`.

---

## Bước 2: Tuân Thủ Các Ràng Buộc Schema Cốt Lõi
1. **Kiểu tiền tệ:**
   - Dùng `BIGINT` hoặc `INTEGER` cho mọi cột giá tiền, tổng hóa đơn (đơn vị: VND).
   - Tuyệt đối KHÔNG dùng `FLOAT`, `DOUBLE`, `REAL` hay `NUMERIC(..., 2)`.
2. **Kiểu dữ liệu linh hoạt (Modifiers, Options):**
   - Dùng `JSONB` cho các thuộc tính tùy chọn món (topping, mức đường, đá, độ cay) hoặc siêu dữ liệu mở rộng.
   - Luôn đánh chỉ mục GIN cho cột JSONB nếu cần truy vấn: `CREATE INDEX idx_dishes_modifiers ON dishes USING GIN (modifiers);`
3. **Audit Columns bắt buộc:**
   - Mọi bảng chính phải có:
     ```sql
     created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
     ```

---

## Bước 3: Nguyên Tắc Bất Biến (Immutability)
- File migration một khi đã tạo và chạy thì **không bao giờ được sửa nội dung**.
- Nếu cần sửa, phải tạo một file migration mới với version tiếp theo để `ALTER TABLE`.
- Không hardcode mật khẩu hay credentials trong file SQL.
