## 1. Mô Tả Tính Năng / Thay Đổi (Description)
- **Tóm tắt:** <!-- Tóm tắt ngắn gọn tính năng vừa hoàn thành hoặc lỗi vừa được sửa -->
- **Phân hệ:** <!-- Frontend (fe) / Backend (be) / AI Service / DevOps -->
- **Sprint / Ticket:** <!-- Ví dụ: Sprint 1 - Thẻ món 3D tilt -->

---

## 2. Các Màn Hình & API Bị Ảnh Hưởng (Impact Analysis)
- **Frontend:** <!-- Liệt kê các trang/component đã sửa, ví dụ: app/(customer)/menu -->
- **Backend:** <!-- Liệt kê các endpoint/service đã sửa, ví dụ: GET /api/v1/tables/{id} -->
- **Database:** <!-- Có file Flyway migration mới không? (Có / Không) -->

---

## 3. Bằng Chứng Kiểm Thử (Evidence)
<!-- Đính kèm ảnh chụp màn hình (Screenshot) hoặc Video GIF test thành công trên máy cục bộ -->
- [ ] Đã kiểm tra giao diện chạy thực tế không phát sinh lỗi Console.
- [ ] Đã chạy thử luồng nghiệp vụ trên mobile/desktop.

---

## 4. Checklist Tự Kiểm Tra (Self-Verification)
- [ ] Nhánh được tách từ nhánh `dev` và đặt tên đúng chuẩn `<tiền-tố>/<tên-thành-viên>/<loại>-<tên>` (ví dụ: `fe/duy/feature-sprint1-menu`).
- [ ] Không commit file nháp cá nhân, file `.md/.doc` rác ngoài thư mục `doc/`.
- [ ] Tuyệt đối không commit file `.env`, API key, token bí mật.
- [ ] Không tự ý sửa đổi file cấu hình hệ thống dùng chung (`package.json` root, `pom.xml`, `.agents/`).
- [ ] Đã chạy vượt qua toàn bộ Quality Gates:
  - Frontend: `pnpm --filter frontend type-check` & `pnpm --filter frontend lint`
  - Backend: `cd backend && ./mvnw test`
