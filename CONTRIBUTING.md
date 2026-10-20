# Hướng Dẫn Đóng Góp & Quy Trình Làm Việc Nhóm (CONTRIBUTING)

Chào mừng bạn gia nhập đội ngũ phát triển **Restaurant OS**! Tài liệu này quy định toàn bộ quy trình làm việc, chuẩn mực Git, quy định tách nhánh Monorepo, quy trình mở Pull Request (PR) và cách phối hợp hiệu quả giữa thành viên trong nhóm và trợ lý AI Antigravity.

---

## 1. Thiết Lập Môi Trường Phát Triển Ban Đầu

Mỗi thành viên khi clone repository về máy cần đảm bảo các công cụ sau:
- **Node.js:** Phiên bản 20+ LTS
- **Package Manager:** `pnpm` phiên bản 9+ (`npm install -g pnpm`)
- **Java Development Kit (JDK):** Java 21 LTS (khuyên dùng Eclipse Temurin hoặc Amazon Corretto)
- **Python:** 3.11+ (cho phân hệ `ai-service`)
- **Docker & Docker Compose:** Dùng để chạy Postgres / Supabase CLI cục bộ (nếu cần)

### Các bước cài đặt:
```bash
# 1. Clone repository
git clone <repo-url>
cd restaurant-os

# 2. Cài đặt dependencies cho Frontend & Monorepo
pnpm install

# 3. Tạo file cấu hình môi trường từ template mẫu
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
```

### Cách 1: Khởi chạy toàn bộ hệ thống bằng Docker (Khuyên Dùng)
Chỉ với 1 câu lệnh, Docker sẽ tự động build và chạy cả 4 containers (PostgreSQL 16, Backend Spring Boot 3, FastAPI AI và Next.js 15):
```bash
# Build và chạy ngầm toàn bộ hệ thống
docker compose up -d

# Xem log thời gian thực
docker compose logs -f

# Dừng toàn bộ hệ thống
docker compose down
```
**Các cổng dịch vụ sau khi khởi chạy:**
- 🌐 **Frontend (Next.js 15 App Router):** [http://localhost:3000](http://localhost:3000)
  - Khách gọi món QR: [http://localhost:3000/qr/table-01](http://localhost:3000/qr/table-01) & thực đơn [http://localhost:3000/menu](http://localhost:3000/menu)
  - Màn hình Bếp KDS (<50ms): [http://localhost:3000/kds](http://localhost:3000/kds)
  - Quầy thu ngân POS: [http://localhost:3000/pos](http://localhost:3000/pos)
  - Quản trị kho BOM: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- ⚙️ **Backend Core (Spring Boot 3 + Java 21):** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
  - 📖 **Swagger UI / OpenAPI 3:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) (JSON: `/v3/api-docs`)
  - 📊 **Actuator Monitoring:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
  - ⚡ **STOMP WebSocket:** `ws://localhost:8080/ws` (broker `/topic`, `/queue`)
- 🧠 **AI Voice Microservice (FastAPI):** [http://localhost:8000/health](http://localhost:8000/health)
  - 📖 **FastAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) (ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc))
- 🐘 **Database (PostgreSQL 16):** `localhost:5432`, DB `restaurant_os`, User `postgres`, Password `postgres`

### Cách 2: Khởi chạy từng phần cục bộ (Local Standalone Development)
Dành cho lập trình viên muốn code và hot-reload riêng từng phân hệ:
```bash
# Bước 2.1: Chạy Database Postgres trong nền
docker compose up -d postgres

# Bước 2.2: Khởi chạy Backend (Terminal 1)
pnpm dev:backend
# Hoặc: cd backend && mvn spring-boot:run

# Bước 2.3: Khởi chạy Frontend Next.js 15 (Terminal 2)
pnpm dev:frontend
# Truy cập: http://localhost:3000

# Bước 2.4: Khởi chạy AI Service (Terminal 3)
pnpm dev:ai
# Hoặc: cd ai-service && uvicorn main:app --reload --port 8000
```

---

## 2. Quy Trình Phát Triển Tính Năng Chuẩn Agile / Scrum (Feature Lifecycle)

Mỗi tính năng (Feature) trong Sprint bắt buộc phải trải qua vòng đời chuẩn mực từ lúc tiếp nhận yêu cầu đến khi bàn giao:

```text
[Sprint Backlog] ──▶ [DoR Check] ──▶ [Dev with AI] ──▶ [DoD Audit] ──▶ [PR & Review] ──▶ [Done on dev]
```

### 2.1. Tiếp nhận User Story & Tiêu chí nghiệm thu (Acceptance Criteria - AC)
- Mỗi tính năng xuất phát từ một User Story cụ thể:
  - *Ví dụ:* *"Là khách ngồi tại bàn, tôi muốn quét QR để xem menu và chọn topping món ăn để cá nhân hóa khẩu vị."*
- **Acceptance Criteria (AC):** Lập trình viên và AI phải đọc kỹ tài liệu spec trong [doc/README.md](file:///d:/my-project/restaurant-os/doc/README.md) để xác định rõ:
  1. Trạng thái giao diện khi bình thường, khi tải (loading), khi rỗng (empty) và khi hết món (sold-out).
  2. Sự kiện Realtime STOMP tương ứng và cách xử lý khi mất kết nối.
  3. Định dạng dữ liệu DTO và mã lỗi cần bắt.

### 2.2. Điều kiện sẵn sàng bắt đầu code (Definition of Ready - DoR)
Một tính năng chỉ được bắt đầu code khi thỏa mãn DoR:
- [x] Đã hiểu rõ mục tiêu nghiệp vụ trong tài liệu Sprint deep-dive.
- [x] Đã thống nhất hợp đồng DTO / API giữa Frontend và Backend.
- [x] Đã chia nhỏ tính năng thành các Sub-tasks độc lập (Ví dụ: Dumb UI Component $\rightarrow$ Zustand Store $\rightarrow$ Endpoint Backend $\rightarrow$ Tích hợp STOMP).

### 2.3. Tiêu chuẩn hoàn thành tính năng (Definition of Done - DoD)
Một tính năng chỉ được xem là **"Done" (Hoàn thành)** và đủ điều kiện mở Pull Request khi thỏa mãn 100% các tiêu chí DoD sau:
- [ ] **Đúng chuẩn kiến trúc:** Tuân thủ toàn bộ 10 Core Rules (Ngân sách GPU animate, Dark theme KDS, Tiền tệ số nguyên VND, IdempotencyKey).
- [ ] **Không lỗi biên dịch:** `pnpm --filter frontend type-check` đạt 0 lỗi.
- [ ] **Pass kiểm thử tự động:** Toàn bộ Unit Test (`vitest` / `./mvnw test`) chạy xanh 100%.
- [ ] **Nghiệm thu thực tế (Self-Test):** Đã kiểm tra trực tiếp trên trình duyệt mobile (cho màn khách) hoặc tablet/TV (cho KDS), không có lỗi Console hay crash layout.
- [ ] **Vệ sinh mã nguồn:** Đã xóa bỏ các dòng `console.log`, `System.out.println`, không commit file `.env` hay file rác.
- [ ] **Đầy đủ bằng chứng (Evidence):** Có ảnh chụp màn hình hoặc video GIF ghi lại luồng chạy thành công đính kèm trong mô tả PR.

---

## 3. Chiến Lược Phân Nhánh Git (Git Branching Strategy)

> [!IMPORTANT]
> **QUY TẮC BẤT BIẾN VỀ VỊ TRÍ NHÁNH LÀM VIỆC:**
> - **Phần lớn thời gian (95% vòng đời dự án)**, toàn bộ đội ngũ lập trình viên và trợ lý AI sẽ **làm việc trực tiếp trên và bắt nguồn từ nhánh `dev`**.
> - Nhánh **`main`** chỉ đại diện cho mã nguồn sản xuất (Production-ready) và chỉ được cập nhật khi phát hành phiên bản chính thức (Release Tag).
> - **Tuyệt đối không commit trực tiếp vào `main`.** Mọi nhánh tính năng (`feature`), sửa lỗi (`fix`), tối ưu (`perf`) **bắt buộc phải tách ra từ `dev`** và mở Pull Request merge ngược lại vào **`dev`**.

Dự án áp dụng mô hình phân nhánh với nhánh tích hợp chính là **`dev`** (đã rút gọn từ `develop`):

```text
main (Production — luôn luôn ổn định, chỉ release khi xong Sprint)
  ▲
  │ (Release PR sau mỗi Sprint)
dev (Staging / Development — toàn bộ nhánh tính năng bắt buộc tách từ đây)
  ▲
  ├── fe/duy/feature-sprint1-dish-card-3d   (Nhánh Frontend có tên thành viên)
  ├── be/nam/feature-sprint1-order-bom      (Nhánh Backend có tên thành viên)
  ├── fe/duy/fix-cart-currency              (Nhánh sửa lỗi Frontend)
  └── be/nam/fix-stomp-reconnect            (Nhánh sửa lỗi Backend)
```

### 📌 Quy tắc vàng khi tạo nhánh:
1. **BẮT BUỘC TÁCH TỪ NHÁNH `dev`:** Tuyệt đối không tách nhánh từ `main` hoặc từ nhánh cá nhân của người khác khi chưa đồng bộ vào `dev`.
2. **ĐỊNH DẠNG TÊN NHÁNH BẮT BUỘC:** `<tiền-tố>/<tên-thành-viên>/<loại>-<tên-tính-năng>`
   - **Tiền tố:**
     - Nhánh Frontend: `fe/<tên-thành-viên>/...`
     - Nhánh Backend: `be/<tên-thành-viên>/...`
     - Nhánh AI Microservice: `ai/<tên-thành-viên>/...`
     - Nhánh Hạ tầng / DevOps: `devops/<tên-thành-viên>/...`
   - **Tên thành viên:** Tên hoặc username viết thường, không dấu (ví dụ: `duy`, `nam`, `tuan`, `anhnt`). Giúp team biết ngay ai là chủ sở hữu nhánh và tránh trùng tên khi nhiều người cùng làm một phân hệ.
   - **Loại:** `feature`, `fix`, `perf`.
   - **Ví dụ chuẩn:**
     - `fe/duy/feature-sprint1-qr-menu`
     - `be/nam/feature-sprint1-kds-stomp`
     - `fe/duy/fix-tilt-gesture`

---

## 4. Các Điều Cấm Tuyệt Đối Khi Làm Việc Với Git

- ❌ **CẤM COMMIT FILE RÁC, FILE TÀI LIỆU TẠM:**
  - Không commit các file ghi chú cá nhân, file nháp `.md`, file `.doc`, `.docx` phát sinh ngoài thư mục tài liệu chuẩn `doc/`.
  - Không commit các file build tạm thời, thư mục cache, file log (`.log`), `.DS_Store`, `Thumbs.db`.
- ❌ **CẤM COMMIT NỘI DUNG NHẠY CẢM (SECRETS):**
  - Tuyệt đối không commit file `.env`, mật khẩu database, token JWT, Supabase Service Role Key, private key `.pem/.key`.
  - Kiểm tra kỹ lệnh `git status` và `git diff` trước khi thực hiện commit.
- ❌ **CẤM TỰ Ý SỬA CÁC FILE CẤU HÌNH HỆ THỐNG:**
  - Nghiêm cấm tự ý thay đổi: `package.json` gốc, `pnpm-workspace.yaml`, `backend/pom.xml`, `application.yml`, Dockerfile, file cấu hình CI/CD (`.github/workflows`), hoặc các file trong `.agents/`.
  - Mọi thay đổi về cấu hình dùng chung phải được **thảo luận và có sự đồng thuận của Team Lead / DevOps**.

---

## 5. Quy Chuẩn Commit (Conventional Commits)

Định dạng commit bắt buộc:
```text
<loại>(<phạm-vi>): <mô tả ngắn gọn bằng tiếng Việt không dấu hoặc tiếng Anh>

[Nội dung chi tiết giải thích lý do thay đổi (nếu có)]
```

### Các loại commit hợp lệ:
- `feat`: Tính năng mới cho người dùng hoặc API mới.
- `fix`: Sửa lỗi phát sinh trong hệ thống.
- `refactor`: Tái cấu trúc code mà không thay đổi logic nghiệp vụ.
- `perf`: Cải thiện hiệu năng, giảm giật lag hoặc giảm độ trễ WebSocket.
- `test`: Bổ sung hoặc chỉnh sửa unit test / E2E test.
- `chore`: Cập nhật cấu hình build phụ, scripts hỗ trợ.
- `docs`: Cập nhật tài liệu kỹ thuật chính thống.

### Các phạm vi (`scope`) chuẩn trong dự án:
`customer`, `kds`, `pos`, `admin`, `inventory`, `backend`, `stomp`, `db`.

---

## 6. Quy Trình Mở Pull Request (PR) & Bắt Buộc Viết Mô Tả Rõ Ràng

Mọi Pull Request gửi vào nhánh `dev` **bắt buộc phải có mô tả chi tiết, không được để trống hoặc ghi sơ sài**.

### Mẫu mô tả PR chuẩn (PR Description Template):
```markdown
## 1. Mô tả tính năng / Thay đổi
- Tóm tắt ngắn gọn tính năng vừa hoàn thành hoặc lỗi vừa được sửa.
- Thuộc Sprint nào, mã Task/Ticket (nếu có).

## 2. Các màn hình hoặc API bị ảnh hưởng
- Frontend: Danh sách các trang/component đã sửa (ví dụ: `app/(customer)/menu`).
- Backend: Danh sách các endpoint hoặc Service đã sửa (ví dụ: `POST /api/v1/orders`).

## 3. Bằng chứng kiểm thử (Evidence)
- Ảnh chụp màn hình (Screenshot) hoặc Video GIF quay lại luồng chạy thành công trên mobile / desktop.
- Kết quả chạy test thành công (Pass 100%).

## 4. Checklist tự kiểm tra
- [ ] Nhánh được tách từ `dev` và đặt tên đúng chuẩn `<tiền-tố>/<tên-thành-viên>/<loại>-<tên>` (ví dụ: `fe/duy/feature-...`).
- [ ] Không commit file nháp cá nhân, file `.md/.doc` rác, không commit `.env`.
- [ ] Không tự ý sửa đổi file cấu hình hệ thống dùng chung.
- [ ] Đã chạy và vượt qua: `pnpm --filter frontend type-check` và `./mvnw test`.
```

### Quy định xét duyệt (Review):
- Cần tối thiểu **1 lượt Approved** từ thành viên khác trong team trước khi bấm **Squash and merge** vào nhánh `dev`.

---

## 7. Quy Tắc Sử Dụng AI Antigravity Trong Nhóm

1. **AI KHÔNG ĐƯỢC TỰ Ý HÀNH ĐỘNG — LUÔN PHẢI XÁC NHẬN TRƯỚC:**
   - Trợ lý AI tuyệt đối không tự ý chạy các lệnh thay đổi trạng thái nhạy cảm (như tạo nhánh Git, commit, push code, xóa file, sửa file cấu hình root).
   - AI **bắt buộc phải trình bày kế hoạch rõ ràng và nhận được sự xác nhận đồng ý của lập trình viên** trước khi thực thi.
2. **Tuân thủ Router & Rules:** Luôn nhắc AI đọc [AGENTS.md](file:///d:/my-project/restaurant-os/AGENTS.md) để không đoán mò công nghệ.
3. **Cấm tự ý cài thư viện:** Mọi đề xuất cài package mới đều phải được người dùng đồng ý trước.
