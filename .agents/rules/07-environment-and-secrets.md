# Quy Tắc 07: Quản Trị Biến Môi Trường & Bí Mật Hệ Thống

## 1. Chính Sách Không Rò Rỉ Bí Mật (Zero-Leakage Policy)
Tuyệt đối không được phép commit bất kỳ mật khẩu sản xuất, khóa riêng tư (private key), token bí mật hay file `.env` nào lên kho mã nguồn Git.

### Mẫu `.gitignore` Bắt Buộc:
Các mẫu sau phải được chặn ở root và toàn bộ các thư mục con:
```gitignore
.env
.env.*
!.env.example
*.pem
*.key
application-secrets.yml
```

---

## 2. Cô Lập Môi Trường Cấu Hình

### 2.1. Phân Tách Biến Frontend (`frontend/`)
- Biến môi trường muốn truyền xuống trình duyệt client **bắt buộc** phải có tiền tố `NEXT_PUBLIC_`:
  - `NEXT_PUBLIC_API_BASE_URL` (ví dụ: `http://localhost:8080/api/v1`)
  - `NEXT_PUBLIC_WS_ENDPOINT` (ví dụ: `ws://localhost:8080/ws`)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Chỉ là khóa public cho client, giới hạn bởi RLS)
- **NGHIÊM CẤM:** Tuyệt đối không để `SUPABASE_SERVICE_ROLE_KEY` xuất hiện trong mã nguồn hoặc file môi trường của frontend.

### 2.2. Phân Tách Biến Backend Spring Boot (`backend/`)
Sử dụng các Spring Profile:
- `application.yml`: Chứa cấu hình mặc định, tên ứng dụng, baseline Flyway.
- `application-local.yml`: Cấu hình chạy máy lập trình viên (kết nối Postgres Docker hoặc Supabase CLI local).
- `application-prod.yml`: Cấu hình môi trường sản xuất đọc qua biến môi trường máy chủ:
  - `SPRING_DATASOURCE_URL`: Chuỗi kết nối Supabase Session Pooler (port 5432/6543 có SSL).
  - `SPRING_DATASOURCE_USERNAME`: `postgres.<mã_dự_án>`
  - `SPRING_DATASOURCE_PASSWORD`: `${DB_PASSWORD}`
  - `JWT_SECRET_KEY`: Chuỗi bí mật 256-bit entropy cao.

### 2.3. Bí Mật Trong Migration Flyway (Theo Tài Liệu v1.1)
- Toàn bộ script migration của Flyway chạy qua Spring Boot phải dùng placeholder `${flyway:placeholder}` đối với các thông tin nhạy cảm.
- Không bao giờ lưu cứng user hay password dạng văn bản thuần trong các file SQL ở thư mục `db/migration/`.

---

## 3. Duy Trì File Mẫu `.env.example`
Mỗi sub-project (`frontend/`, `backend/`, `ai-service/`) bắt buộc phải duy trì một file `.env.example` chuẩn:
- Mọi biến đều có chú thích ngắn gọn giải thích định dạng và giá trị giả lập mẫu.
- Pipeline CI/CD sẽ tự động kiểm tra xem môi trường triển khai có bị thiếu biến nào so với file mẫu hay không.
