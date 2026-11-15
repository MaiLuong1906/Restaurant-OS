# Quy Tắc 05: Hàng Rào Bảo Vệ AI & Quy Chuẩn Git Tự Động

Tài liệu hướng dẫn quy trình Git và phối hợp nhóm chi tiết dành cho lập trình viên được lưu tại [CONTRIBUTING.md](file:///d:/my-project/restaurant-os/CONTRIBUTING.md). 

File này quy định **hàng rào an toàn (Guardrails) và quy tắc hành vi bắt buộc** mà trợ lý AI Antigravity phải tuân thủ nghiêm ngặt trong mọi phiên làm việc:

---

## 1. RÀNG BUỘC SỐ 1: AI TUYỆT ĐỐI KHÔNG TỰ Ý HÀNH ĐỘNG — PHẢI XÁC NHẬN TRƯỚC
> **Quy tắc vàng:** AI là trợ lý đồng hành (Pair Programmer), không phải người quyết định độc lập.

- **BẮT BUỘC:** Trước khi thực hiện bất kỳ thao tác mang tính thay đổi trạng thái (tạo/xóa/đổi tên file, sửa file cấu hình, chạy lệnh Git commit/push, tạo nhánh mới, chạy lệnh terminal), AI **phải giải thích rõ việc sắp làm và chờ người dùng xác nhận đồng ý**.
- **CẤM:** Không tự tiện chạy ngầm các lệnh thay đổi cấu trúc hoặc tự động commit/push mã nguồn lên kho Git từ xa khi chưa có lệnh rõ ràng từ lập trình viên.

---

## 2. VÒNG ĐỜI PHÁT TRIỂN AGILE BẮT BUỘC DÀNH CHO AI (MANDATORY AGILE LIFECYCLE)

Khi được giao nhiệm vụ xây dựng một tính năng (Feature) hoặc User Story, AI **bắt buộc phải tuân thủ nghiêm ngặt 4 giai đoạn sau theo thứ tự**:

### 🎯 Giai đoạn 1: Làm Rõ Tiêu Chí Nghiệm Thu (Acceptance Criteria - AC)
- AI không được nhảy vào code ngay. Bắt buộc phải đọc spec trong [doc/README.md](file:///d:/my-project/restaurant-os/doc/README.md) và tóm tắt lại cho người dùng:
  - *Giao diện cần có những trạng thái nào? (Loading, Empty, Normal, Sold-out)*
  - *Topic STOMP Realtime nào sẽ phát sự kiện?*
  - *Cần gọi API REST nào để reconcile dữ liệu khi mất kết nối?*

### 📋 Giai đoạn 2: Phân Tách Sub-tasks & Lập Kế Hoạch (Sử Dụng `/plan`)
- Bắt buộc chia nhỏ tính năng thành các Sub-tasks tuần tự:
  - *Task 1:* Dựng DTO / Types (`types/`).
  - *Task 2:* Dựng UI Primitives / Dumb Component (`components/ui/` hoặc `components/<domain>/`).
  - *Task 3:* Dựng Zustand Store Slice (`stores/`) kèm luật Reconnect REST sync và IdempotencyKey.
  - *Task 4:* Ghép nối vào Container Page (`app/(group)/.../page.tsx`).
- **Dừng lại và chờ người dùng bấm "Duyệt / Proceed" kế hoạch trước khi sinh mã nguồn.**

### 🔨 Giai đoạn 3: Thực Thi Phân Đoạn Nhỏ (Vertical Slicing)
- AI chỉ được phép sinh code cho **từng sub-task một**. Sau mỗi sub-task, phải tự chạy kiểm tra biên dịch (`type-check` hoặc build) xem có lỗi syntax không.
- Tuyệt đối cấm sinh một cục code khổng lồ hàng trăm dòng làm thay đổi 5-6 file cùng lúc khiến lập trình viên mất kiểm soát.

### 🏁 Giai đoạn 4: Nghiệm Thu Theo Definition of Done (DoD) & Tạo PR
- Trước khi tuyên bố "hoàn thành", AI phải tự kiểm tra chéo theo bảng **DoD** trong [CONTRIBUTING.md](file:///d:/my-project/restaurant-os/CONTRIBUTING.md):
  - *TypeScript có lỗi không?*
  - *Ngân sách GPU animate có bị vi phạm không?*
  - *Có vô tình tạo file rác không?*
- Sau đó, kích hoạt skill `audit-pr-readiness` để sinh nội dung mô tả PR 4 phần cho người dùng.

---

## 3. Hàng Rào Bảo Vệ Hệ Thống & Cấu Hình

1. **Cấm tự ý sửa đổi file cấu hình hệ thống:**
   - AI **TUYỆT ĐỐI CẤM** tự ý chỉnh sửa: `package.json` ở root, `pnpm-workspace.yaml`, `backend/pom.xml`, `application.yml`, Dockerfile, workflow CI/CD, hoặc các file cấu hình trong `.agents/`.
   - Mọi đề xuất thay đổi cấu hình phải được giải thích lý do cụ thể và xin phép lập trình viên.
2. **Cấm tự ý cài đặt gói thư viện (Dependency Discipline):**
   - Không được tự tiện gõ `pnpm add` hoặc thêm dependency Maven khi chưa được người dùng phê duyệt rõ ràng.
3. **Cấm commit file rác và tài liệu tạm:**
   - Không tạo hoặc commit các file nháp cá nhân, file `.md`, file `.doc/.docx` tạm bợ ngoài thư mục tài liệu chính thống `doc/`.
4. **Cấm rò rỉ dữ liệu nhạy cảm (Zero-Leakage Secrets):**
   - Tuyệt đối không chạm vào hoặc commit các file `.env`, API keys, JWT secret, private key, token xác thực lên Git.

---

## 4. Quy Chuẩn Nhánh & Commit Khi Hỗ Trợ Git

Khi được lập trình viên yêu cầu hỗ trợ tạo nhánh hoặc commit mã nguồn:

### 4.1. Quy ước tạo nhánh (Bắt buộc từ nhánh `dev`):
- Nhánh gốc duy nhất để tách nhánh: **`dev`** (không dùng `main`, không dùng tên cũ `develop`).
- Định dạng bắt buộc: `<tiền-tố>/<tên-thành-viên>/<loại>-<tên-tính-năng>`
  - Nhánh Frontend: `fe/<tên-thành-viên>/feature-<tên>` hoặc `fe/<tên-thành-viên>/fix-<tên>`
  - Nhánh Backend: `be/<tên-thành-viên>/feature-<tên>` hoặc `be/<tên-thành-viên>/fix-<tên>`
  - Nhánh AI Service: `ai/<tên-thành-viên>/...`
  - Nhánh DevOps: `devops/<tên-thành-viên>/...`
  - Ví dụ: `fe/duy/feature-sprint1-menu-qr`, `be/nam/feature-sprint1-order-bom`.

### 4.2. Quy chuẩn Conventional Commits:
- Cú pháp: `<loại>(<phạm-vi>): <mô tả>`
- Loại: `feat`, `fix`, `refactor`, `perf`, `test`, `chore`, `docs`.
- Phạm vi: `customer`, `kds`, `pos`, `admin`, `inventory`, `backend`, `stomp`, `db`.

### 4.3. Hỗ trợ viết mô tả PR (Pull Request Description):
- Khi lập trình viên yêu cầu viết mô tả PR, AI phải xuất ra bản mô tả đầy đủ 4 phần chuẩn mực theo mẫu tại [CONTRIBUTING.md](file:///d:/my-project/restaurant-os/CONTRIBUTING.md) (Mô tả, Phạm vi ảnh hưởng, Bằng chứng test, Checklist tự kiểm tra), tuyệt đối không viết sơ sài 1 dòng.

---

## 5. Hàng Rào Chống Ảo Giác Dữ Liệu (Zero-Hallucination)
- **CẤM** tự bịa đặt cột trong Database, thuộc tính JSONB hoặc REST endpoint không có trong thiết kế [Restaurant_OS_Tai_Lieu_Du_An_v1.1.docx](file:///d:/my-project/restaurant-os/doc/Restaurant_OS_Tai_Lieu_Du_An_v1.1.docx).
- Nếu phát hiện thiếu thông tin, AI phải hỏi lại người dùng để làm rõ thay vì tự giả định.
