# Thư Viện Tài Liệu Dự Án — Restaurant OS (Knowledge Hub)

Chào mừng bạn đến với thư mục tài liệu nghiệp vụ và thiết kế kiến trúc của **Restaurant OS**. File này đóng vai trò là **Mục lục điều hướng tri thức tập trung (Documentation Hub)**. Khi bổ sung tài liệu mới, vui lòng cập nhật đường dẫn vào danh mục tương ứng dưới đây.

---

## 1. Kiến Trúc Tổng Thể & Quyết Định Kỹ Thuật (Architecture & Strategy)

Tài liệu nền tảng định hình toàn bộ dự án, phân tích lựa chọn công nghệ và lộ trình phát triển tổng thể:
- **Tài liệu đặc tả kiến trúc v1.1:** [Restaurant_OS_Tai_Lieu_Du_An_v1.1.docx](file:///d:/my-project/restaurant-os/doc/Restaurant_OS_Tai_Lieu_Du_An_v1.1.docx)
  - *Nội dung chính:* Mô hình Spring Boot 3 + Supabase PostgreSQL + Flyway, định lượng nguyên vật liệu trừ kho (BOM), microservice AI Whisper (Voice-to-Order), và phân quyền đa tầng (RBAC).

---

## 2. Thiết Kế Cơ Sở Dữ Liệu & Định Lượng BOM (Database & Schema Design)

Khu vực lưu trữ các bản thiết kế quan hệ thực thể (ERD), từ điển dữ liệu (Data Dictionary) và cấu trúc JSONB:
- **Thiết kế Schema & Bảng dữ liệu (Đang cập nhật):** `doc/database/schema_design.md` *(Sẽ bổ sung khi chốt chi tiết các bảng DDL)*
- **Quy chuẩn lưu trữ Database đã chốt:**
  - Tiền tệ: Bắt buộc số nguyên VND (`BIGINT` / `INTEGER`).
  - Biến thể món ăn (topping, đá, đường, độ cay): Sử dụng kiểu `JSONB` có đánh chỉ mục GIN.
  - Quản trị DDL: Do các script Flyway trong `backend/src/main/resources/db/migration/` nắm quyền duy nhất.

---

## 3. Đặc Tả Nghiệp Vụ Theo Phân Hệ & Sprint (Sprint Deep-Dives)

Các tài liệu phân tích sâu chi tiết từng màn hình, hành vi người dùng, animation và luồng xử lý:

### Phân hệ Khách hàng (Customer Mobile Web):
- **Sprint 1 — Menu QR, Thẻ món 3D tilt & Giỏ nhóm:** [Restaurant_OS_Sprint1_Menu_DeepDive.md](file:///d:/my-project/restaurant-os/doc/Restaurant_OS_Sprint1_Menu_DeepDive.md)
  - *Nội dung chính:* Cây route `(customer)`, hiệu ứng 3D tilt Framer Motion $\pm 8^\circ$, bottom-sheet chi tiết món (xoay 360° giả lập bằng sprite ảnh), giỏ hàng nhóm WebSocket STOMP `<50ms`, chia tiền VietQR/MoMo.

### Phân hệ Tác nghiệp & Quản lý (Staff & Admin Screens):
- **Deep-dive Màn hình Nội bộ (KDS bếp, Thu ngân, Ca làm việc, Kho):** [Restaurant_OS_Staff_Screens_DeepDive.md](file:///d:/my-project/restaurant-os/doc/Restaurant_OS_Staff_Screens_DeepDive.md)
  - *Nội dung chính:* KDS bếp nền tối `#0B0F14` phím bấm lớn $\ge 48\text{px}$, thuật toán gom món 5 phút, sơ đồ bàn POS, đối soát đóng/mở ca, cơ chế tự động REST sync khi STOMP reconnect.

---

## 4. Giao Tiếp Phần Cứng & Cổng Thanh Toán (Hardware & External APIs)

Khu vực lưu trữ tài liệu tích hợp thiết bị ngoại vi và bên thứ ba:
- **Máy in hóa đơn nhiệt:** Giao thức mạng LAN / USB (lệnh in ESC/POS).
- **Cổng thanh toán số:** Tạo mã động VietQR (chuẩn NAPAS 247) và MoMo QR.

---

## 5. Quy Chuẩn Đóng Góp & Hướng Dẫn Thêm Tài Liệu Mới
- Khi tạo tài liệu mới, đặt trong thư mục `doc/` (hoặc tạo thư mục con như `doc/database/`, `doc/api/`).
- Luôn sử dụng định dạng Markdown (`.md`) có cấu trúc rõ ràng.
- Cập nhật thêm liên kết vào file [doc/README.md](file:///d:/my-project/restaurant-os/doc/README.md) này để các thành viên và AI có thể tra cứu ngay lập tức.
