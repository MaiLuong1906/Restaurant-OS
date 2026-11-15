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

## Bước 2: Chạy Thử CI/CD Quality Gates Cục Bộ (AI Pre-flight CI/CD Verification)
AI **BẮT BUỘC** phải tự chạy các lệnh kiểm tra tương ứng với phân hệ thay đổi trước khi báo cáo hoàn thành hoặc tạo PR:

### 2.1. Kiểm Tra Phân Hệ Frontend:
```bash
pnpm cicd:frontend
# Hoặc chạy lẻ:
pnpm --filter frontend typecheck   # Bắt buộc: 0 lỗi TypeScript
pnpm --filter frontend test        # Bắt buộc: Vitest xanh 100%
```

### 2.2. Kiểm Tra Phân Hệ Backend (Nếu có sửa backend/):
```bash
cd backend && ./mvnw test-compile   # Hoặc ./mvnw test nếu có Docker/DB
```

### 2.3. Kiểm Tra Phân Hệ AI (Nếu có sửa ai-service/):
```bash
cd ai-service && python -m py_compile main.py
```

### 2.4. Kiểm Tra Git Status & Untracked Files:
- Chạy `git status -s` để phát hiện:
  - Có file mã nguồn mới nào trong `src/` bị sót do `.gitignore` chặn nhầm không.
  - Có file rác hoặc `.env` nào đang nằm trong stage không.

> [!CAUTION]
> Nếu bất kỳ lệnh nào trả về lỗi (exit code $\neq 0$), AI **tuyệt đối không được yêu cầu người dùng commit hoặc mở PR**. Phải giải quyết triệt để lỗi trước!

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
