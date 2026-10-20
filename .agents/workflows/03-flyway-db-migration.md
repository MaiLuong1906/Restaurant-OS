# Kịch Bản 03: Quy Trình Thêm Bảng & Di Chuyển Dữ Liệu Flyway (DB Migration Workflow)

Kịch bản này hướng dẫn quy trình tạo, kiểm tra và chạy script di chuyển cơ sở dữ liệu (Flyway Migration) trên PostgreSQL (Supabase) một cách an toàn, không gây gián đoạn dịch vụ.

---

## Bước 1: Khởi Tạo Nhánh Backend & Xác Định Phiên Bản

1. **Checkout nhánh Backend:**
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b be/nam/feature-db-schema-vX
   ```
2. **Kiểm tra phiên bản Flyway hiện tại:**
   - Liệt kê các file trong `backend/src/main/resources/db/migration/`.
   - Xác định phiên bản tiếp theo: ví dụ `V1__init.sql` $\rightarrow$ tạo tiếp `V2__add_orders_and_bom.sql`.

---

## Bước 2: Viết Script Migration Tuân Thủ Ràng Buộc Kỹ Thuật

Sử dụng skill `flyway-migration-helper` hoặc tạo file SQL tuân thủ các quy tắc:

1. **Ràng buộc tiền tệ (Currency):**
   - Mọi cột giá tiền, doanh thu, giảm giá bắt buộc dùng kiểu `BIGINT` hoặc `INTEGER` (đơn vị: VND).
   - Nghiêm cấm dùng `NUMERIC(..., 2)`, `FLOAT`, `DOUBLE`.
2. **Ràng buộc biến thể tùy chọn món (Modifiers):**
   - Dùng kiểu `JSONB` cho cột `modifiers` (topping, độ ngọt, đá, độ cay):
     ```sql
     ALTER TABLE dishes ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;
     CREATE INDEX IF NOT EXISTS idx_dishes_modifiers ON dishes USING GIN (modifiers);
     ```
3. **Audit Columns:**
   - Đảm bảo có `created_at` và `updated_at` (kiểu `TIMESTAMPTZ`).
4. **Bảo mật bí mật:**
   - Dùng placeholder `${flyway:placeholder}`, không hardcode mật khẩu hay credentials.

---

## Bước 3: Chạy Kiểm Thử Migration Trên Môi Trường Cục Bộ (Local)

1. **Chạy Spring Boot với profile local:**
   ```bash
   cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```
2. **Kiểm tra log Flyway:**
   - Đảm bảo log xuất hiện thông báo:
     `Successfully applied 1 migration to schema 'public' (execution time ...)`
3. **Xác nhận tính bất biến (Immutability):**
   - Tuyệt đối không sửa lại nội dung file SQL migration đã commit và đã chạy.

---

## Bước 4: Đồng Bộ Hợp Đồng DTO Với Frontend

- Sau khi sửa database, cập nhật Entity JPA trong `backend/src/main/java/com/restaurantos/model/entity/`.
- Cập nhật Record DTO tương ứng trong `model/dto/`.
- Cập nhật định nghĩa TypeScript tương ứng trong `frontend/types/`.

---

## Bước 5: Mở Pull Request & Kiểm Thử Tự Động
- Chạy unit test backend: `cd backend && ./mvnw test`
- Dùng skill `audit-pr-readiness` để chuẩn bị PR và merge vào nhánh `dev`.
