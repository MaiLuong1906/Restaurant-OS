# Quy Tắc 09: Quản Trị Công Cụ & Thư Viện Trong Monorepo

## 1. Chuỗi Công Cụ & Trình Quản Lý Gói (Toolchain)

Để đảm bảo việc cài đặt đồng nhất và quá trình build có thể tái lập (reproducible) trên mọi máy của thành viên trong nhóm, Monorepo phân định rõ quyền hạn công cụ theo từng hệ sinh thái:

| Sub-project | Công cụ Quản lý | File Khóa Phiên Bản (Lockfile) | Tiêu chuẩn Chạy Lệnh |
| :--- | :--- | :--- | :--- |
| Root Monorepo & `frontend/` | **pnpm (v12+)** workspaces | `pnpm-lock.yaml` & `.npmrc` | `pnpm <script>` |
| `backend/` | **Maven 3.9+** (qua `./mvnw`) | `pom.xml` | `./mvnw clean test` |
| `ai-service/` | **Python 3.11** + **uv** / `venv` | `requirements.txt` | `uvicorn main:app` |

---

## 2. Kỷ Luật Về Phiên Bản Thư Viện & pnpm v12 Security
1. **Frontend (`frontend/package.json`):**
   - Các gói phải được ghim phiên bản cụ thể hoặc khoảng minor an toàn (`^`).
   - **Lưu ý pnpm v12:** pnpm v12 mặc định chặn các lifecycle scripts (`ERR_PNPM_IGNORED_BUILDS`). Khi thêm các gói có native build script (như `sharp`, `esbuild`), bắt buộc phải khai báo trong file `.npmrc` ở root và frontend:
     ```ini
     only-built-dependencies=sharp,esbuild
     ```
     và chạy lệnh duyệt quyền: `pnpm approve-builds --all`.
   - **CẤM** dùng lẫn lộn các trình quản lý gói (không bao giờ gõ `npm install` hoặc `yarn install` trong repo này).
2. **Backend (`backend/pom.xml`):**
   - Mọi bản build trên CI và máy dev bắt buộc dùng **Maven Wrapper (`./mvnw` hoặc `mvnw.cmd`)** để bảo đảm tính tương thích phiên bản.
   - Thư viện tài liệu hóa API bắt buộc dùng `springdoc-openapi-starter-webmvc-ui` (OpenAPI 3 / Swagger).
3. **AI Microservice (`ai-service/`):**
   - Khóa cứng phiên bản các thư viện máy học lõi (`fastapi`, `uvicorn`, `pydantic`).

---

## 3. Bộ Lệnh Điều Phối Tại Thư Mục Gốc (`package.json` Root)
Thư mục gốc cung cấp các script tiện ích để điều phối toàn bộ môi trường lập trình:
```json
{
  "name": "restaurant-os-monorepo",
  "private": true,
  "scripts": {
    "dev:frontend": "pnpm --filter frontend dev",
    "build:frontend": "pnpm --filter frontend build",
    "lint:frontend": "pnpm --filter frontend lint",
    "typecheck:frontend": "pnpm --filter frontend typecheck",
    "test:frontend": "pnpm --filter frontend test",
    "test:backend": "cd backend && ./mvnw test",
    "test:all": "pnpm test:frontend && pnpm test:backend",
    "dev:backend": "cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local",
    "build:backend": "cd backend && ./mvnw clean package -DskipTests",
    "dev:ai": "cd ai-service && python -m uvicorn main:app --reload --port 8000",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:build": "docker compose build",
    "docker:logs": "docker compose logs -f"
  }
}
```
