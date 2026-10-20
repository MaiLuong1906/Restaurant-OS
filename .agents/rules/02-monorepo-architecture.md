# Quy Tắc 02: Kiến Trúc Monorepo & Quản Trị Cấu Trúc Thư Mục

## 1. Triết Lý Cấu Trúc Monorepo
Repository được tổ chức theo mô hình Monorepo thống nhất nhưng có sự phân tách ranh giới độc lập tuyệt đối giữa giao diện Client, lõi nghiệp vụ Backend và dịch vụ AI:

| Thư mục | Đơn vị Triển khai | Trách nhiệm cốt lõi | Chiều phụ thuộc |
| :--- | :--- | :--- | :--- |
| `frontend/` | Vercel / Node.js | Giao diện web cho khách hàng, bếp, thu ngân, quản lý | Gọi `backend/` qua REST & STOMP |
| `backend/` | Docker / Cloud Run | Nghiệp vụ lõi, giao dịch ACID, in ESC/POS & Flyway | Độc lập; phát sự kiện STOMP |
| `ai-service/` | Docker / GPU instance | Microservice Python nhận dạng giọng nói Whisper | Được gọi nội bộ bởi `backend/` |
| `doc/` | Tài liệu tĩnh | Yêu cầu nghiệp vụ, phân tích Sprint deep-dive | Chỉ đọc tham chiếu |
| `.agents/` | Quản trị AI | Bộ quy tắc (Rules) & Kỹ năng (Skills) của Antigravity | Áp dụng cho mọi dev & AI |

---

## 2. Quản Trị Cấu Trúc Thư Mục Frontend (`frontend/`)

Ứng dụng Next.js 15 tổ chức mã nguồn theo **tầng trách nhiệm** và **Route Groups**:

### 2.1. Phân vùng Route Groups trong `app/`
Mọi trang (page) **bắt buộc** phải nằm trong một Route Group đóng mở bằng dấu ngoặc đơn `(...)`. Route group không làm thay đổi đường dẫn URL, nhưng giúp cô lập Layout, thẩm quyền bảo mật (RBAC) và phạm vi tải CSS:

- **`app/(customer)/` — Phạm vi Khách hàng vãng lai & Quét QR:**
  - **Mục đích:** Giao diện Mobile Web siêu nhẹ cho khách hàng quét mã QR tại bàn gọi món.
  - **Bố cục & Trải nghiệm:** Ưu tiên hàng đầu cho di động, vuốt chạm mượt mà, không tải các thư viện quản trị cồng kềnh.
  - **Phạm vi State:** Gắn liền với phiên hoạt động của bàn (`tableId`).
- **`app/(staff)/` — Phạm vi Tác nghiệp tại quán (Bếp & Thu ngân):**
  - **Mục đích:** Giao diện KDS cho bếp/bar, màn hình sơ đồ bàn và quầy thu ngân POS, quản lý mở/đóng ca.
  - **Bố cục & Trải nghiệm:** Màn hình ngang (Tablet / TV), giao diện tối tương phản cao, nút bấm cảm ứng lớn ($\ge 48\text{px}$).
  - **Phạm vi State:** Nhận luồng STOMP thời gian thực của trạm bếp hoặc toàn bộ nhà hàng.
- **`app/(admin)/` — Phạm vi Quản trị văn phòng (Desktop):**
  - **Mục đích:** Báo cáo doanh thu, CRUD thực đơn (kéo thả danh mục), quản lý kho nguyên liệu BOM, xếp ca nhân sự.
  - **Bố cục & Trải nghiệm:** Giao diện Desktop nhiều cột, thanh điều hướng sidebar, bảng biểu dữ liệu lớn.
  - **Phạm vi State:** Xác thực quyền Quản lý / Chủ nhà hàng, phân trang REST.
- **`app/(me)/` — Cổng tự phục vụ cho nhân viên:**
  - **Mục đích:** Nhân viên xem ca làm cá nhân, gửi yêu cầu đổi ca, xin nghỉ phép, chấm công QR/GPS.

### 2.2. Phân tầng trách nhiệm các thư mục con
- **`components/ui/` (Atomic UI Primitives):**
  - Chứa các thành phần giao diện gốc tái sử dụng (Button, Dialog, Sheet, Input, Badge).
  - **Nguyên tắc bất biến:** Bắt buộc là *Dumb/Pure Component*. Tuyệt đối không được import Zustand store hay gọi API.
- **`components/<domain>/` (Domain Components):**
  - Các component gắn liền với nghiệp vụ chuyên biệt (ví dụ: `components/customer/DishCard.tsx`, `components/kds/OrderTicket.tsx`).
- **`stores/` (Zustand Slices):**
  - Mỗi file quản lý một lát cắt trạng thái (ví dụ: `cartStore.ts`, `kdsStore.ts`, `sessionStore.ts`). Chịu trách nhiệm cập nhật giao diện tức thì (optimistic update) và lắng nghe STOMP.
- **`lib/` (Tiện ích & Singleton):**
  - Quản lý các kết nối dùng chung: API client có bọc kiểu (`api-client.ts`), bộ quản lý kết nối STOMP tự động reconnect (`stomp.ts`), định dạng tiền tệ (`formatters.ts`).
- **`types/` (Kiểu dữ liệu hợp đồng):**
  - Định nghĩa TypeScript đồng bộ 100% với các class DTO của Backend.

### 2.3. Quy ước đặt tên Frontend
- **Thư mục & Route URL:** `kebab-case` (ví dụ: `check-in/`, `table-overview/`).
- **React Component:** `PascalCase.tsx` (ví dụ: `DishCard.tsx`, `ShiftModal.tsx`).
- **Hooks & Stores:** `camelCase.ts` có tiền tố `use` (ví dụ: `useCartStore.ts`, `useStomp.ts`).
- **File tiện ích:** `kebab-case.ts` (ví dụ: `format-currency.ts`, `device-haptics.ts`).

---

## 3. Quản Trị Cấu Trúc Backend Spring Boot (`backend/`)

Backend tuân thủ kiến trúc phân lớp chuẩn mực (`com.restaurantos.*`):

### 3.1. Trách nhiệm từng Package
- **`controller/` (Tầng Giao tiếp):**
  - Chứa các `@RestController` và `@MessageMapping` (WebSocket).
  - **Trách nhiệm:** Kiểm tra tính hợp lệ của dữ liệu đầu vào (`@Valid`), trả mã HTTP status, chuyển tiếp vào Service. Nghiêm cấm viết logic nghiệp vụ hay gọi Repository tại đây.
- **`service/` (Tầng Nghiệp vụ Lõi):**
  - Chứa Interface và Implementation của Service.
  - **Trách nhiệm:** Quản lý giao dịch `@Transactional`, tính toán trừ kho theo công thức BOM, sinh lệnh in nhiệt ESC/POS, và bắn thông báo qua STOMP.
- **`repository/` (Tầng Truy cập Dữ liệu):**
  - Interface Spring Data JPA. Chỉ chịu trách nhiệm truy vấn database.
- **`model/entity/` (Thực thể JPA):**
  - Ánh xạ 1:1 với các bảng trong PostgreSQL do Flyway tạo ra.
- **`model/dto/` (Data Transfer Objects):**
  - Sử dụng Java `record` bất biến (`*Request.java`, `*Response.java`). Tuyệt đối không trả thẳng Entity ra ngoài Controller.
- **`model/enums/` (Hằng số định danh):**
  - Chuẩn hóa các enum trạng thái: `OrderStatus`, `PaymentMethod`, `TableStatus`, `RoleType`.
- **`config/` (Cấu hình Hạ tầng):**
  - Bộ lọc JWT Spring Security, CORS, cấu hình WebSocket STOMP broker, Flyway migration beans.

### 3.2. Quy tắc Quản lý Migration Database (`db/migration/`)
- Mọi thay đổi cấu trúc DB bắt buộc phải viết thành file SQL trong `backend/src/main/resources/db/migration/`.
- **Cú pháp đặt tên:** `V<Số_Thứ_Tự>__<Tên_Mô_Tả_Dạng_Snake_Case>.sql` (ví dụ: `V1__init_schema.sql`, `V2__add_bom_recipes.sql`).
- **Tính bất biến (Immutability):** File migration một khi đã commit và chạy trên database thì **vĩnh viễn không được sửa lại nội dung**. Muốn thay đổi phải tạo file migration với số version tiếp theo.

---

## 4. Các Ràng Buộc Kiến Trúc Xuyên Suốt

1. **Đơn vị tiền tệ chính xác:**
   - Mọi giá tiền trên Database, DTO và Frontend State bắt buộc là **số nguyên VND (Integer)**. Nghiêm cấm dùng số thực floating point cho tiền tệ.
2. **Đồng bộ hợp đồng DTO:**
   - Các file type trong `frontend/types/` phải phản ánh chính xác cấu trúc Java Record của Backend.
3. **Cô lập phân tầng:**
   - Controller không bao giờ được gọi thẳng Repository; mọi thao tác phải qua Service.
   - UI Primitives trong `components/ui/` không bao giờ được phụ thuộc vào State nghiệp vụ.
