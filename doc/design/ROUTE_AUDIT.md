# BÁO CÁO AUDIT FRONTEND ROUTE & KIỂM TRA NỀN TẢNG (READ-ONLY AUDIT)

> **Dự án**: Restaurant OS (Monorepo Next.js 15 App Router + Spring Boot 3 + FastAPI)  
> **Thời điểm kiểm tra**: 2026-11-06  
> **Người thực hiện**: Trợ lý kiểm tra code AI (Chế độ CHỈ ĐỌC - Không sửa code)  
> **Nhánh Git hiện tại**: `dev`  
> **Commit mới nhất**: `ae66277c51765e8e373c851e33fce064a05e3299` (*Merge pull request #2 from MaiLuong1906/fe/huy/feature-ui-foundation*)  
> **Tình trạng working tree**: `nothing to commit, working tree clean` (Không có file nào chưa commit)

---

## 1. BẢNG TỔNG QUAN ĐỐI CHIẾU 23 MÀN HÌNH THIẾT KẾ ĐÃ DUYỆT

> **Ghi chú về các quyết định thiết kế đã chốt:**
> - **A2 (Station Select)**: ĐÃ BỎ (không còn khái niệm phân trạm).
> - **A4 (Batch Cooking View)**: Đã gộp vào **A3** dạng toggle chế độ (*Theo ticket* / *Theo mẻ nấu*).
> - **B4**: Đã bỏ Geofence, chỉ còn Quét khuôn mặt (chính) + Nhập PIN 4 số (dự phòng).
> - Luồng chuyển màn: B1 → A1 cho đầu bếp dùng chung tablet; B1 → B2 sau khi nhân viên đăng nhập.

| Mã màn | Tên màn hình theo Inventory | Route kỳ vọng (Đề xuất theo quy ước repo) | Route thực tế hiện có trong repo | Trạng thái | Đánh giá & Những phần còn thiếu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **B1** | Staff Login (SĐT + Password, JWT) | `/login` hoặc `/(staff)/login` | *Chưa có* | ❌ **Chưa có** | Thiếu route, form SĐT/mật khẩu, hook auth JWT, API backend `/api/v1/auth/login`. |
| **B2** | Staff Home (Dashboard nhân viên) | `/(staff)/home` (URL: `/home`) | `/(demo)/staff-home` (URL: `/staff-home`) | ⚠️ **Demo** | Đang nằm ở nhóm `(demo)`, dữ liệu hardcode `minh anh`, các link sub-nav trỏ vòng lặp lại `/staff-home`. Chưa có route thật `/(staff)/home`. |
| **B3** | Attendance (Màn hình chấm công) | `/(staff)/attendance` (URL: `/attendance`) | *Chưa có* | ❌ **Chưa có** | Chưa có route, chưa có nút bấm vào ca/kết ca tích hợp camera hay chuyển B4. |
| **B4** | Chấm công: Face Scan + PIN 4 số dự phòng | `/(staff)/attendance/verify` (URL: `/attendance/verify`) | *Chưa có* | ❌ **Chưa có** | Chưa có UI quét mặt (Webcam/Canvas stream) và bàn phím ảo PIN 4 số dự phòng (đã bỏ Geofence). |
| **B5** | Attendance Result (Kết quả chấm công) | `/(staff)/attendance/result` (URL: `/attendance/result`) | *Chưa có* | ❌ **Chưa có** | Chưa có màn hình hiển thị trạng thái check-in thành công kèm ca làm việc, giờ vào ca. |
| **B6** | Shift Schedule (Lịch làm việc cá nhân) | `/(staff)/shifts` (URL: `/shifts`) | ⚠️ Một phần ở `/(demo)/staff-management` | ❌ **Chưa có route riêng** | Trong demo chỉ có lịch tổng ở vai trò quản trị `staff-management`, chưa có màn lịch cá nhân của nhân viên (B6). |
| **B7** | Shift Register (Đăng ký ca làm) | `/(staff)/shifts/register` (URL: `/shifts/register`) | *Chưa có* | ❌ **Chưa có** | Chưa có form chọn tuần/ngày và tick chọn ca làm việc. |
| **B8** | Shift Swap (Yêu cầu đổi ca) | `/(staff)/shifts/swap` (URL: `/shifts/swap`) | *Chưa có* | ❌ **Chưa có** | Chưa có form chọn đồng nghiệp đổi ca và gửi duyệt cho Quản lý. |
| **B9** | Leave List (Danh sách đơn xin nghỉ) | `/(staff)/leaves` (URL: `/leaves`) | *Chưa có* | ❌ **Chưa có** | Chưa có màn hình danh sách đơn nghỉ phép kèm trạng thái (Chờ duyệt / Đã duyệt / Từ chối). |
| **B10** | Leave Request Form (Tạo đơn xin nghỉ) | `/(staff)/leaves/new` (URL: `/leaves/new`) | *Chưa có* | ❌ **Chưa có** | Chưa có form chọn ngày nghỉ, loại nghỉ phép (phép năm, ốm), lý do. |
| **B11** | Payslip List (Danh sách phiếu lương) | `/(staff)/payslips` (URL: `/payslips`) | *Chưa có* | ❌ **Chưa có** | Chưa có danh sách phiếu lương theo từng tháng/kỳ. |
| **B12** | Payslip Detail (Chi tiết phiếu lương) | `/(staff)/payslips/[id]` (URL: `/payslips/[id]`) | *Chưa có* | ❌ **Chưa có** | Chưa có bảng chi tiết giờ công, hệ số lương, phụ cấp, trích nộp bảo hiểm, thực lĩnh. |
| **B13** | Tip Detail (Chi tiết phân bổ tiền Tip) | `/(staff)/tips` (URL: `/tips`) | *Chưa có* | ❌ **Chưa có** | Chưa có màn hình tra cứu tiền tip nhận được theo ca/ngày và cơ chế chia tip. |
| **A1** | KDS PIN Login (PIN 4 số tablet chung) | `/(staff)/kds/login` (URL: `/kds/login`) | *Chưa có* | ❌ **Chưa có** | Chưa có route đăng nhập bằng PIN 4 số dành cho bếp tablet. |
| **A3** | KDS Main Board (Hàng đợi ticket, 1 nút Hoàn tất, toggle Mẻ nấu) | `/(staff)/kds` (URL: `/kds`) | 1. `/(staff)/kds/page.tsx`<br>2. `/(demo)/kds-board/page.tsx` | ⚠️ **Demo / Placeholder** | File `/(staff)/kds` hiện tại chỉ là placeholder thô v1 (`INITIAL_KDS_ITEMS`). File `/(demo)/kds-board` đã có logic UI mockup v7.1 rất đầy đủ nhưng dùng mock data, chưa gộp sang `/(staff)/kds`, thiếu toggle mẻ nấu chuẩn. |
| **A5** | Ticket Detail (Drawer chi tiết ticket) | Tích hợp trong `/(staff)/kds` (Drawer component) | Một phần trong `/(demo)/kds-board` | ⚠️ **Demo thiếu Drawer** | Chưa có Drawer chuyên biệt bung chi tiết toàn bộ món/dị ứng của bàn. |
| **A6** | Cancel/Edit Alert (Cảnh báo món hủy / sửa) | Tích hợp trong `/(staff)/kds` (Modal / Toast) | Có alert cơ bản trong demo | ⚠️ **Chưa hoàn chỉnh** | Chưa có popup xử lý xác nhận khi phục vụ/thu ngân hủy món hoặc đổi note từ POS. |
| **A7** | Sold-out List (Báo hết món - 86 món) | `/(staff)/kds/sold-out` (URL: `/kds/sold-out`) | UI mẫu trong `/(demo)/kds-board` | ⚠️ **Chưa có route riêng** | Mới chỉ có trạng thái visual 86 trong demo card, chưa có màn/modal quản lý danh sách món đã hết. |
| **A8** | Sold-out Confirm (Xác nhận báo hết món) | Modal trong `/(staff)/kds/sold-out` | *Chưa có* | ❌ **Chưa có** | Chưa có modal xác nhận trước khi broadcast 86 tới POS & Khách QR. |
| **A9** | Waste Log (Ghi nhận hao phí - Bếp trưởng) | `/(staff)/kds/waste` (URL: `/kds/waste`) | *Chưa có* | ❌ **Chưa có** | Chưa có form ghi nhận hủy nguyên liệu/món hỏng theo bảng `kitchen_wastages`. |
| **A10** | Waste Confirm (Xác nhận tiêu hao/hủy món) | Modal trong `/(staff)/kds/waste` | *Chưa có* | ❌ **Chưa có** | Chưa có modal popup xác nhận trừ kho hao hụt nguyên liệu. |

---

## 2. ĐỐI CHIẾU ROUTE THỰC TẾ VỚI TÀI LIỆU README.MD

| Địa chỉ ghi trong README.md | Route thực tế tồn tại trong code | Phân loại | Đánh giá hiện trạng |
| :--- | :--- | :--- | :--- |
| `http://localhost:3000` | `frontend/src/app/page.tsx` | Trang Portal Hub | Đã có, làm nhiệm vụ landing page điều hướng sang các phân hệ. |
| `http://localhost:3000/qr/table-01` | `frontend/src/app/(customer)/qr/[tableId]/page.tsx` | Nhận diện bàn QR | Nhận `tableId`, lưu vào `useCartStore` rồi chuyển tiếp. |
| `http://localhost:3000/menu` | `frontend/src/app/(customer)/menu/page.tsx` | Thực đơn khách QR | **Màn demo/placeholder v1**: dùng mảng `SAMPLE_DISHES` hardcode, chưa dùng token `ops-*` v6 và chưa dùng ảnh từ demo v6. |
| `http://localhost:3000/kds` | `frontend/src/app/(staff)/kds/page.tsx` | Bếp KDS | **Màn demo/placeholder v1**: dùng data hardcode `INITIAL_KDS_ITEMS`, có trạng thái `COOKING` (sai spec), chưa kết nối `useKdsStore`. (Bản UI v7.1 xịn lại đang nằm kẹt ở `/(demo)/kds-board`). |
| `http://localhost:3000/pos` | `frontend/src/app/(staff)/pos/page.tsx` | Thu ngân POS | **Màn demo/placeholder v1**: dùng `TABLES_DATA` đơn sơ. (Bản UI v6 chi tiết nằm ở `/(demo)/pos-demo`). |
| `http://localhost:3000/dashboard` | `frontend/src/app/(admin)/dashboard/page.tsx` | Quản trị Kho BOM | **Màn placeholder v1**: dùng `INVENTORY_DATA` hardcode. (Bản UI Recharts nằm ở `/(demo)/dashboard-demo`). |

---

## 3. BẢNG KIỂM TRA NỀN TẢNG (TOKEN, TYPES, COMPONENTS, STORES, AUTH)

| Mục kiểm tra | Trạng thái | Chi tiết vị trí (`file:dòng`) | Đánh giá so với yêu cầu |
| :--- | :---: | :--- | :--- |
| **Design Tokens (globals.css)** | ⚠️ **Cơ bản đủ nhưng lệch KDS** | `frontend/src/app/globals.css:26-156` | - Nền web khách: `--color-cream: #f5f2ea` (ĐÚNG)<br>- Nền vận hành: `--color-ops-bg: #f6f4f0` (ĐÚNG)<br>- Card: `--color-surface: #ffffff` (ĐÚNG)<br>- Chữ chính: `--color-ink: #141210` (ĐÚNG)<br>- Chữ vận hành: `--color-ops-ink: #2b2118` (ĐÚNG)<br>- Chữ phụ: `--color-ops-muted: #7a6a58` và `--color-muted: #6f6659` (ĐÚNG)<br>- Viền: `--color-ops-border: #e9e4dc` (ĐÚNG)<br>- Brand: `--color-ops-brand: #8c1d2c`, brand-dark: `--color-ops-brand-dark: #6f1623` (ĐÚNG)<br>- Danger: `--color-danger-500: #d14b3a` (ĐÚNG)<br>- Bo góc: `--radius-card: 8px` (ĐÚNG)<br>- Font: Playfair Display + Be Vietnam Pro đã cấu hình trong `layout.tsx:18-30` (ĐÚNG).<br>⚠️ **LƯU Ý:** Token `--color-kds-bg` trong globals.css đang để `#f5f2ea` theo bản v7.1 light theme. Nếu muốn KDS quay lại nền tối `#0B0F14` theo AGENTS.md thì cần chỉnh lại. |
| **Types / Domain Models** | ❌ **Lệch Spec Nghiệp Vụ** | `frontend/src/types/index.ts:38-75` | 1. `OrderItemStatus` đang chứa `'COOKING'`: `export type OrderItemStatus = 'WAITING' \| 'COOKING' \| 'READY' \| 'SERVED' \| 'REJECTED';` trong khi spec đã chốt **KHÔNG có COOKING** (chỉ có `WAITING → READY → SERVED + REJECTED`).<br>2. Chưa có `Ticket` type (toàn bộ món gom theo 1 bàn).<br>3. Chưa có `Batch` type (gom các món cùng loại + cùng ghi chú + cùng dị ứng).<br>4. Đã có các trường: `tableId`, `allergy`, `slaDeadline` trên `OrderItem`. |
| **State / Store KDS** | ⚠️ **Đã có nhưng chưa chuẩn spec** | `frontend/src/stores/useKdsStore.ts:1-107` | Đã có Zustand store kết nối STOMP WebSocket và gọi REST API sync khi reconnect. Tuy nhiên:<br>- Store đang quản lý mảng phẳng `OrderItem[]` thay vì nhóm thành `Ticket` (theo bàn) hoặc `Batch` (theo món).<br>- Chưa có state quản lý danh sách món dị ứng nổi bật, SLA countdown timer, và cơ chế hoàn tác Undo 10s. |
| **Component Dùng Chung** | ⚠️ **Thiếu 6/6 component domain** | `frontend/src/components/ui/` | **Chưa có bất kỳ component chuyên biệt nào:**<br>- `KdsTicketCard`: ❌ Chưa có<br>- `SlaTimer`: ❌ Chưa có<br>- `AllergyBanner`: ❌ Chưa có<br>- `ShiftCalendar`: ❌ Chưa có<br>- `PayslipRow`: ❌ Chưa có<br>- `LeaveStatusBadge`: ❌ Chưa có<br>*(Hiện mới chỉ có các UI atom cơ bản: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Dialog.tsx`, `DropdownMenu.tsx`, `Input.tsx`, `Modal.tsx`, `Tabs.tsx`, `TopBar.tsx`, `BottomSheet.tsx`).* |
| **Cơ chế Auth (B1 / A1)** | ❌ **Chưa có** | Toàn bộ `frontend/src/` | Chưa có bất kỳ logic xác thực nào: không có JWT Token storage (cookie/localStorage), không có context/store `useAuthStore`, không có mã hóa/kiểm tra mã PIN 4 số của KDS. |
| **Phụ thuộc Backend API** | ❌ **Chưa có API thực tế** | `backend/src/main/java/` | Backend hiện mới chỉ có 2 Controller:<br>- `HealthController.java`: API health check.<br>- `DishController.java`: API lấy danh sách món `/api/v1/dishes`.<br>**Hoàn toàn chưa có**: API Auth/Login JWT, API chấm công/xác thực PIN/mặt, API ca làm việc, API phiếu lương, API STOMP KDS thật (mới chỉ có mock config), API báo hủy/hết món. |

---

## 4. CẢNH BÁO AN NINH & BẢO MẬT (SECURITY & CODE HEALTH)

> [!CAUTION]
> ### 1. BÁO ĐỘNG LỖ HỔNG BẢO MẬT CRITICAL (CVE-2025-66478)
> - **File**: [frontend/package.json](file:///home/hxhbang/Documents/Restaurant-OS/frontend/package.json#L20)
> - **Phiên bản hiện tại**: `"next": "15.1.7"`
> - **Mức độ rủi ro**: **CVSS 10.0 (Remote Code Execution)**.
> - **Hành động bắt buộc**: Phải pin nâng cấp lên `"next": "15.1.9"` (hoặc phiên bản vá lỗi chính thức) trên một nhánh fix riêng trước khi tiến hành code và merge PR vào `dev`.

> [!NOTE]
> ### 2. Kiểm Tra Tài Khoản & Bí Mật Hardcode
> - Đã quét toàn bộ `frontend/src/`: **KHÔNG phát hiện** số điện thoại demo dạng `0901234567`, không có mật khẩu/token JWT bí mật bị hardcode trong source code.

> [!NOTE]
> ### 3. Kiểm Tra Git Status
> - Working tree hoàn toàn sạch (`working tree clean`).
> - Nhánh hiện tại: `dev` đồng bộ với `origin/dev`.

---

## 5. CHECKLIST "CẦN LÀM TRƯỚC KHI CODE THẬT" (PHÂN CẤP ƯU TIÊN)

### 🔴 Mức P0: Chặn Code Thật (Bắt buộc phải làm ngay)
1. **Nâng cấp bảo mật Next.js**: Cập nhật `"next": "15.1.9"` trong `frontend/package.json` để triệt tiêu lỗ hổng RCE CVSS 10.0.
2. **Chuẩn hóa TypeScript Types** (`frontend/src/types/index.ts`):
   - Xóa bỏ trạng thái `COOKING` khỏi `OrderItemStatus` (chỉ giữ `WAITING`, `READY`, `SERVED`, `REJECTED`).
   - Định nghĩa model `Ticket` (gom các order items theo bàn) và `Batch` (gom các order items cùng món, cùng ghi chú, cùng cảnh báo dị ứng).
   - Định nghĩa DTO cho Staff & KDS Auth: `StaffUser`, `LoginRequest`, `LoginResponse`, `KdsPinAuthRequest`.
   - Định nghĩa DTO cho Staff Portal: `Shift`, `AttendanceRecord`, `LeaveRequest`, `Payslip`, `TipRecord`.
3. **Xây dựng module Auth Foundation**:
   - Viết `useAuthStore` (Zustand) quản lý JWT token của nhân viên và PIN session của tablet KDS.
   - Viết API client interceptor tự động gắn `Authorization: Bearer <token>` vào request.

### 🟡 Mức P1: Nền tảng UI/UX & Component dùng chung (Cần cho chất lượng code)
1. **Chế tạo 6 Component dùng chung cho Staff & KDS**:
   - `KdsTicketCard.tsx`: Thẻ ticket KDS hiển thị bàn, danh sách món, ghi chú, 1 nút hoàn tất to $\ge 48\text{px}$.
   - `SlaTimer.tsx`: Đồng hồ đếm ngược trực quan MM:SS, đổi màu khi sắp quá hạn và nhấp nháy khi quá hạn.
   - `AllergyBanner.tsx`: Dải cảnh báo dị ứng màu đỏ nổi bật trên đầu ticket.
   - `ShiftCalendar.tsx`: Lưới lịch ca làm việc theo tuần.
   - `LeaveStatusBadge.tsx`: Huy hiệu trạng thái đơn nghỉ phép.
   - `PayslipRow.tsx`: Hàng thông tin tóm tắt phiếu lương.
2. **Nâng cấp `useKdsStore`**:
   - Viết logic chuyển đổi từ danh sách món phẳng sang cấu trúc gom nhóm `Ticket[]` và `Batch[]`.
   - Bổ sung state Undo 10s khi bấm hoàn tất ticket.
3. **Thống nhất token KDS Light/Dark**:
   - Thống nhất với team xem KDS dùng nền sáng `#F5F2EA` (theo `BASE_README.md` v7.1) hay nền tối `#0B0F14` (theo `AGENTS.md`).

### 🟢 Mức P2: Làm sau hoặc song song với Backend
1. Tạo mock server/MSW hoặc mock service layer để các màn hình B6–B13 có thể chạy thử UI mượt mà trong khi chờ backend Spring Boot viết API.
2. Viết Web Camera hook phục vụ chụp ảnh / quét khuôn mặt cho màn B4.

---

## 6. GỢI Ý THỨ TỰ THỰC THI (IMPLEMENTATION ROADMAP)

Thứ tự được sắp xếp theo mức độ độc lập của UI và rủi ro kỹ thuật:

1. **Giai đoạn 1 — Lõi Bếp KDS (A3 → A1 → A5 → A6 → A7–A10)**:
   - `A3` (KDS Main Board): Đã có nền tảng mockup rất tốt ở `/(demo)/kds-board/page.tsx`, chỉ cần refactor tách component sạch sẽ, đưa vào `/(staff)/kds/page.tsx` và nối với `useKdsStore`.
   - `A1` (PIN Login): Dựng bàn phím số 4 số đơn giản, lưu PIN session.
   - `A5` (Ticket Detail Drawer) & `A6` (Cancel Alert): Hoàn thiện các modal tương tác của KDS.
   - `A7–A10` (Sold-out & Waste Log): Dựng form báo hết món và ghi hao phí nguyên liệu.
2. **Giai đoạn 2 — Staff Portal Cơ Bản (B2 → B3–B5)**:
   - `B2` (Staff Home): Chuyển đổi từ `/(demo)/staff-home` sang route chính thức `/(staff)/home`, hiển thị thông tin ca hôm nay.
   - `B3–B5` (Chấm công & Face/PIN verify): Dựng giao diện check-in ca làm việc.
3. **Giai đoạn 3 — Lịch Ca & Nghỉ Phép (B6–B8 → B9–B10)**:
   - `B6–B8` (Xem/Đăng ký/Đổi ca) và `B9–B10` (Đơn xin nghỉ phép): Code giao diện biểu mẫu và danh sách trạng thái.
4. **Giai đoạn 4 — Lương, Thưởng & Đăng Nhập Tổng (B11–B13 → B1)**:
   - `B11–B13` (Phiếu lương & Tip): Dựng bảng biểu chi tiết thu nhập.
   - `B1` (Login JWT): Hoàn thiện màn đăng nhập chính thức nối với API Spring Boot Security.

---

## 7. KẾT LUẬN & ĐÁNH GIÁ CHUNG

1. **Hiện trạng repo**: Frontend hiện đang có khung sườn cơ bản v6/v7.1 nhưng **phần lớn các màn hình nằm ở thư mục `(demo)`** (`kds-board`, `staff-home`, `staff-management`, `pos-demo`), trong khi các route chính thức trong `(staff)` và `(admin)` chỉ là placeholder v1 sơ sài. Toàn bộ 13 màn hình Staff Portal (B1–B13) và các màn hình vệ tinh KDS (A1, A5–A10) **chưa có route thật**.
2. **Màn hình có thể code UI ngay**: **A3 (KDS Board)** và **B2 (Staff Home)** có thể triển khai ngay bằng cách chuyển đổi và tinh chỉnh từ code mẫu trong thư mục `(demo)` sang component chuẩn; kế tiếp là **A1 (PIN Login)** và **B6–B13** (dùng mock data trước).
3. **Màn hình phải chờ hoặc cần chuẩn bị**: **B1 (Login JWT)**, **B3–B5 (Chấm công)** và tính năng realtime của **A3/A6** cần chuẩn bị hook camera, mock API hoặc chờ Backend hoàn thiện endpoint.
4. **Việc cấp bách nhất trước khi code**: Cần **vá lỗ hổng Next.js CVE-2025-66478 lên 15.1.9**, cập nhật lại file `types/index.ts` (xóa `COOKING`, thêm `Ticket`, `Batch`) và dựng các component dùng chung.

