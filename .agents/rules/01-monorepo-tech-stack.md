# Quy Tắc 01: Ngăn Xếp Công Nghệ & Ràng Buộc Kỹ Thuật Bất Biến

## 1. Phạm Vi & Phân Vùng Hệ Sinh Thái
Dự án được cấu trúc theo mô hình **Monorepo** phục vụ hệ thống điều hành nhà hàng **Restaurant OS**. Mọi code do Antigravity sinh ra hoặc chỉnh sửa đều phải tuân thủ nghiêm ngặt các ranh giới công nghệ sau:

### Phân vùng các thư mục con:
- `frontend/` — Ứng dụng Web Next.js 15 (Màn hình khách quét QR, KDS bếp, Thu ngân POS, Quản trị)
- `backend/` — Backend nghiệp vụ lõi Spring Boot 3
- `ai-service/` — Microservice AI Python FastAPI (xử lý giọng nói bồi bàn Whisper & dự báo)
- `doc/` — Tài liệu đặc tả yêu cầu, phân tích kiến trúc và deep-dive từng Sprint

---

## 2. Ngăn Xếp Công Nghệ Frontend (`frontend/`)

### Khung ứng dụng & Trạng thái:
- **Framework:** Next.js 15+ sử dụng **App Router** độc quyền.
- **Ngôn ngữ:** TypeScript 5+ ở chế độ nghiêm ngặt (`"strict": true`). Tuyệt đối không dùng kiểu `any` nếu không có lý do bất khả kháng.
- **React:** React 19 (Server Components là mặc định; Client Components chỉ dùng khi cần hook hoặc tương tác trình duyệt qua `'use client'`).
- **Styling:** **Tailwind CSS v4** sử dụng chỉ thị hiện đại `@theme` trực tiếp trong file CSS.
- **Quản lý trạng thái (State Management):** **Zustand** theo mô hình Slice pattern.
- **Kiểm thử Unit & Store (Testing):** **Vitest** kết hợp `@testing-library/react`.
- **Hiệu ứng chuyển động (Animation):** **Framer Motion** cho tương tác vi mô và hiệu ứng xoay 3D thẻ món.
- **Đồ họa 3D (POS/Nội bộ):** **Three.js** kết hợp **@react-three/fiber** (v9) và **@react-three/drei** (v10) cho sơ đồ bàn POS; bắt buộc nạp qua `next/dynamic` (`ssr: false`), nghiêm cấm kéo vào bundle route khách hàng.
- **Realtime Client:** `@stomp/stompjs` + `sockjs-client` cho giao thức STOMP qua WebSocket (cam kết độ trễ $<50\text{ms}$).

### Các điều cấm tuyệt đối (Frontend):
- ❌ **CẤM** sử dụng Pages Router của Next.js (thư mục `pages/`).
- ❌ **CẤM** tạo hoặc sử dụng cấu hình cũ `tailwind.config.js`. Cấu hình Tailwind v4 phải nằm trong CSS (`@theme`).
- ❌ **CẤM** cài đặt Redux, MobX, hoặc Axios (bắt buộc dùng `fetch` nguyên bản có bọc kiểu dữ liệu typed).
- ❌ **CẤM** cài đặt Three.js hoặc các engine 3D nặng nề trên giao diện web mobile của khách hàng.

---

## 3. Ngăn Xếp Công Nghệ Backend (`backend/`)

### Khung ứng dụng & Kiến trúc:
- **Môi trường chạy:** **Java 21 (LTS)**.
- **Framework:** **Spring Boot 3.3+**.
- **Kiến trúc:** Phân lớp chuẩn mực: `Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `Entity/DTO`.
- **Bảo mật:** Spring Security 6 với xác thực JWT không lưu phiên (Stateless) & Phân quyền RBAC.
- **Tài liệu hóa API:** **SpringDoc OpenAPI 3** (`springdoc-openapi-starter-webmvc-ui` v2.6.0) tự động sinh Swagger UI tại `/swagger-ui/index.html`.
- **Giám sát & Sức khỏe hệ thống:** **Spring Boot Actuator** (`spring-boot-starter-actuator`) tại `/actuator/health`.
- **Lưu trữ dữ liệu:** Spring Data JPA / Hibernate với dialect PostgreSQL.
- **Quản lý phiên bản Database:** **Flyway** là cơ quan duy nhất nắm quyền kiểm soát Schema.
- **Realtime Broker:** Spring WebSocket với STOMP message broker (`SimpleBroker`).
- **Kết nối phần cứng:** Giao tiếp Socket mạng nội bộ LAN / USB để in hoá đơn nhiệt ESC/POS.

### Các điều cấm tuyệt đối (Backend):
- ❌ **CẤM** đặt `spring.jpa.hibernate.ddl-auto` thành `create`, `create-drop`, hoặc `update`. Bắt buộc phải là `validate` hoặc `none`. Chỉ một mình Flyway kiểm soát DDL.
- ❌ **CẤM** thực hiện thao tác trừ kho hoặc tạo hóa đơn ngoài ranh giới `@Transactional`.
- ❌ **CẤM** dùng công cụ migration tích hợp của Supabase; Supabase chỉ đóng vai trò PostgreSQL Hosting và S3 Storage.

---

## 4. Ngăn Xếp Microservice AI (`ai-service/`)
- **Môi trường chạy:** Python 3.11+.
- **Framework:** **FastAPI** với các hàm bất đồng bộ (`async def`).
- **Xử lý âm thanh:** OpenAI Whisper / Faster-Whisper để nhận dạng giọng nói bồi bàn (Voice-to-Order).
- **Giao tiếp:** Gọi nội bộ với Backend Spring Boot qua REST / gRPC có khóa bảo mật.

---

## 5. Cơ Sở Dữ Liệu & Điện Toán Đám Mây
- **Database:** PostgreSQL 16+ lưu trữ trên Supabase (kết nối qua Session pooler port 5432/6543 có SSL).
- **Kiểu dữ liệu mở rộng:** Ứng dụng sâu kiểu `JSONB` cho các biến thể món ăn phức tạp (topping, lượng đường, đá, độ cay).
- **Lưu trữ file:** Supabase Storage (chuẩn S3) để lưu trữ ảnh món ăn và biên lai số.
