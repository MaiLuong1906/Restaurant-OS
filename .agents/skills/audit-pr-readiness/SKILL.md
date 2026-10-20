---
name: audit-pr-readiness
description: >-
  Sử dụng kỹ năng này khi người dùng yêu cầu kiểm tra code trước khi commit, chuẩn bị mở Pull Request (PR) hoặc muốn sinh nội dung mô tả PR chuẩn 4 phần theo CONTRIBUTING.md. Tự động kiểm tra Type check, Lint, Test và quét file rác/secrets.
---

# Kỹ Năng: Kiểm Tra Chất Lượng & Tạo Mô Tả PR (audit-pr-readiness)

Quy trình tự động hóa kiểm tra trước khi tạo Pull Request để đảm bảo pass 100% CI Quality Gates.

---

## Bước 1: Quét File Rác & Rò Rỉ Bí Mật (Security Scan)
AI tự động kiểm tra nhanh:
1. Có file `.env`, `.env.local` nào vô tình bị thêm vào git stage không?
2. Có file nháp `.md`, file `.doc` tạm bợ nào ngoài thư mục `doc/` không?
3. Có file cấu hình dùng chung (`package.json` root, `pom.xml`, `.agents/`) bị sửa đổi ngoài ý muốn không?

---

## Bước 2: Chạy Thử Quality Gates (Nếu môi trường đã cài đặt)
- Frontend Typecheck: `pnpm typecheck:frontend` (0 lỗi TypeScript).
- Frontend Unit Test: `pnpm test:frontend` (Vitest chạy xanh 100%).
- Backend Unit Test: `pnpm test:backend` (hoặc `cd backend && ./mvnw test`).
- Kiểm tra toàn diện nhanh: `pnpm test:all`.

---

## Bước 3: Tự Động Sinh Nội Dung Mô Tả PR (PR Description)
AI tổng hợp các thay đổi trong branch và xuất ra mẫu 4 phần sẵn sàng để lập trình viên copy-paste lên GitHub:

```markdown
## 1. Mô Tả Tính Năng / Thay Đổi (Description)
- **Tóm tắt:** [Tóm tắt ngắn gọn các commit trong branch]
- **Phân hệ:** [Frontend / Backend / AI / DevOps]
- **Sprint / Ticket:** [Tên Sprint hoặc mã ticket]

## 2. Các Màn Hình & API Bị Ảnh Hưởng (Impact Analysis)
- **Frontend:** [Danh sách file/route đã chỉnh sửa]
- **Backend:** [Danh sách controller/service/migration đã thêm]

## 3. Bằng Chứng Kiểm Thử (Evidence)
- [x] Đã tự kiểm tra code và chạy thử trên môi trường local.
- [x] Đã vượt qua kiểm tra TypeScript và Unit Test.

## 4. Checklist Tự Kiểm Tra
- [x] Nhánh được tách từ nhánh `dev` và đặt tên đúng chuẩn `<tiền-tố>/<tên-thành-viên>/<loại>-<tên>`.
- [x] Không commit file nháp cá nhân, không commit file `.env`.
- [x] Không tự ý sửa đổi file cấu hình hệ thống dùng chung.
```
