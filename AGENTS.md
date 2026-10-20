# Restaurant OS — Kim Chỉ Nam & Bản Đồ Điều Hướng Cho AI (AGENTS.md)

Chào mừng bạn đến với Monorepo của dự án **Restaurant OS**. File này đóng vai trò là **Bản đồ điều hướng cấp cao (Router / North Star)** cho Antigravity và các AI agent. Hãy giữ cho context window luôn sạch và tinh gọn: **tuyệt đối không đoán mò hoặc sinh ảo giác (hallucinate) quy chuẩn dự án**. Hãy tham chiếu trực tiếp đến các file quy tắc chuyên biệt được liệt kê dưới đây.

---

## 1. Các Ràng Buộc Kỹ Thuật Bất Biến & Hàng Rào AI (Invariants)

- **AI KHÔNG ĐƯỢC TỰ Ý HÀNH ĐỘNG:** Bắt buộc phải giải thích kế hoạch và **hỏi ý kiến xác nhận của người dùng trước** khi tạo nhánh, commit, sửa file cấu hình hoặc chạy lệnh terminal nhạy cảm.
- **Tuân thủ vòng đời Agile bắt buộc:** Khi nhận task, AI phải đi qua 4 bước: (1) Trích xuất Acceptance Criteria (AC) từ `doc/` $\rightarrow$ (2) Lập plan chia nhỏ Sub-tasks bằng `/plan` chờ duyệt $\rightarrow$ (3) Thực thi từng phần nhỏ (Vertical Slicing) $\rightarrow$ (4) Tự nghiệm thu theo Definition of Done (DoD) & tạo PR.
- **Vị trí nhánh làm việc chính thức (`dev`):** **Phần lớn thời gian (95%) AI và lập trình viên làm việc trên và xuất phát từ nhánh `dev`**. Nhánh `main` chỉ dành cho Production Release. Mọi nhánh tính năng **bắt buộc phải tách từ nhánh `dev`**, định dạng: `<tiền-tố>/<tên-thành-viên>/<loại>-<tên>` (ví dụ: `fe/duy/feature-sprint1-menu-qr`, `be/nam/feature-sprint1-order-bom`).
- **Cấm file rác & bí mật:** Tuyệt đối không commit file `.env`, file ghi chú cá nhân, file `.md`, `.doc` rác, và không tự ý sửa file cấu hình hệ thống (`package.json`, `pom.xml`, `.agents/`).
- **Mô tả Pull Request:** Mọi PR bắt buộc phải viết mô tả chi tiết theo 4 phần chuẩn trong [CONTRIBUTING.md](file:///d:/my-project/restaurant-os/CONTRIBUTING.md).
- **Cấu trúc Monorepo:** `frontend/` (Next.js 15 App Router + Tailwind v4 + Zustand), `backend/` (Spring Boot 3 + Java 21 + Flyway), `ai-service/` (FastAPI + Whisper).
- **Cơ sở dữ liệu:** PostgreSQL trên Supabase (Flyway là cơ quan duy nhất quản lý DDL schema; nghiêm cấm bật `ddl-auto` của Hibernate).
- **Giao tiếp Realtime:** STOMP qua WebSocket (<50ms). Khi mất mạng và kết nối lại, **bắt buộc phải gọi REST API để đồng bộ dữ liệu mới nhất trước**.
- **Tính lũy kế (Idempotency):** Mọi thao tác thay đổi trạng thái (đặt món, cập nhật KDS, thanh toán) bắt buộc phải gửi kèm UUID `idempotencyKey`.
- **Ngân sách hiệu năng (Performance Budget):** Web khách hàng trên mobile chỉ animate bằng GPU (`transform`, `opacity`), góc nghiêng 3D tilt thẻ món giới hạn $\pm 8^\circ$, tuyệt đối không dùng Three.js. KDS bếp dùng nền tối `#0B0F14` với phím bấm cảm ứng lớn $\ge 48\text{px}$.
- **Đơn vị tiền tệ:** Mọi giá tiền và doanh thu trên DB, DTO và state bắt buộc là **số nguyên VND** (không dùng số thực floating point).

---

## 2. Bản Đồ Điều Hướng Quy Tắc (Rule Navigation Map)

Khi thực hiện từng tác vụ chuyên biệt, hãy đọc trực tiếp file quy tắc tương ứng:

| Lĩnh vực phụ trách | Đường dẫn file Rule | Thời điểm cần tham chiếu |
| :--- | :--- | :--- |
| **Công nghệ & Thư viện** | [01-monorepo-tech-stack.md](file:///d:/my-project/restaurant-os/.agents/rules/01-monorepo-tech-stack.md) | Khi thêm thư viện, cấu hình Tailwind v4, Spring Boot setup |
| **Kiến trúc & Cấu trúc thư mục** | [02-monorepo-architecture.md](file:///d:/my-project/restaurant-os/.agents/rules/02-monorepo-architecture.md) | Khi tạo route mới, phân chia component, thiết kế DTO backend |
| **Realtime & Toàn vẹn dữ liệu** | [03-realtime-and-data-integrity.md](file:///d:/my-project/restaurant-os/.agents/rules/03-realtime-and-data-integrity.md) | Khi code STOMP topic, xử lý reconnect sync, `@Transactional` BOM |
| **Giao diện & Hiệu năng (UI/UX)** | [04-ui-ux-performance-budget.md](file:///d:/my-project/restaurant-os/.agents/rules/04-ui-ux-performance-budget.md) | Khi dựng 3D tilt thẻ món, bottom-sheet, thuật toán gom món KDS |
| **Quy chuẩn Git & Hàng rào AI** | [05-team-git-ai-workflow.md](file:///d:/my-project/restaurant-os/.agents/rules/05-team-git-ai-workflow.md) | Khi tạo commit, đặt tên nhánh, ngăn chặn AI sinh code ảo giác |
| **Chuẩn API & Xử lý lỗi** | [06-api-response-and-errors.md](file:///d:/my-project/restaurant-os/.agents/rules/06-api-response-and-errors.md) | Khi viết REST Controller, `@RestControllerAdvice`, typed error |
| **Biến môi trường & Bí mật** | [07-environment-and-secrets.md](file:///d:/my-project/restaurant-os/.agents/rules/07-environment-and-secrets.md) | Khi quản lý file `.env.example`, Supabase key, password Flyway |
| **Logging & Truy vết (Tracing)** | [08-logging-and-observability.md](file:///d:/my-project/restaurant-os/.agents/rules/08-logging-and-observability.md) | Gắn `X-Request-ID`, SLF4J MDC, định dạng log JSON sản xuất |
| **Quản trị Tooling & Monorepo** | [09-monorepo-tooling-and-dependencies.md](file:///d:/my-project/restaurant-os/.agents/rules/09-monorepo-tooling-and-dependencies.md) | `pnpm` workspaces, Maven `./mvnw`, root orchestration scripts |
| **Kiểm thử & Quality Gates** | [10-testing-and-quality-gates.md](file:///d:/my-project/restaurant-os/.agents/rules/10-testing-and-quality-gates.md) | Viết JUnit 5, Vitest, Playwright E2E cho 3 luồng nghiệp vụ |

---

## 3. Danh Mục Kỹ Năng Tự Động Theo Nhu Cầu (Available Skills)

Khi lập trình viên đưa ra yêu cầu thuộc các tác vụ sau, AI tự động kích hoạt kỹ năng chuyên biệt:

| Tên Skill | Đường dẫn hướng dẫn | Mục đích thực thi |
| :--- | :--- | :--- |
| **`create-feature-screen`** | [create-feature-screen/SKILL.md](file:///d:/my-project/restaurant-os/.agents/skills/create-feature-screen/SKILL.md) | Dựng màn hình mới chuẩn Route Group, layout, và hiệu năng |
| **`stomp-realtime-slice`** | [stomp-realtime-slice/SKILL.md](file:///d:/my-project/restaurant-os/.agents/skills/stomp-realtime-slice/SKILL.md) | Dựng Zustand store lắng nghe STOMP, optimistic update & Reconnect sync |
| **`flyway-migration-helper`** | [flyway-migration-helper/SKILL.md](file:///d:/my-project/restaurant-os/.agents/skills/flyway-migration-helper/SKILL.md) | Sinh file migration database `V<version>__<name>.sql` chuẩn Flyway |
| **`audit-pr-readiness`** | [audit-pr-readiness/SKILL.md](file:///d:/my-project/restaurant-os/.agents/skills/audit-pr-readiness/SKILL.md) | Tự động kiểm tra chất lượng code và sinh mô tả PR 4 phần |
| **`ui-ux-pro-max`** | [ui-ux-pro-max/SKILL.md](file:///d:/my-project/restaurant-os/.agents/skills/ui-ux-pro-max/SKILL.md) | Trí tuệ thiết kế UI/UX: 79 phong cách, 192 bảng màu F&B, 74 cặp font Google Fonts |

---

## 4. Kịch Bản Quy Trình Thực Thi Chuẩn (Standard Workflows)

Khi thực hiện các chuỗi tác vụ phức tạp, AI và lập trình viên bám sát kịch bản từng bước trong `.agents/workflows/`:

| Tên Kịch Bản | Đường dẫn Playbook | Khi nào áp dụng? |
| :--- | :--- | :--- |
| **Phát triển tính năng mới** | [01-feature-development.md](file:///d:/my-project/restaurant-os/.agents/workflows/01-feature-development.md) | Bắt đầu User Story mới từ Sprint Backlog đến khi mở PR |
| **Sửa lỗi Realtime STOMP & Sync** | [02-hotfix-reconnection.md](file:///d:/my-project/restaurant-os/.agents/workflows/02-hotfix-reconnection.md) | Xử lý sự cố rớt mạng, lệch đơn KDS, trùng lặp đơn |
| **Di chuyển Database Flyway** | [03-flyway-db-migration.md](file:///d:/my-project/restaurant-os/.agents/workflows/03-flyway-db-migration.md) | Thêm bảng, cột JSONB, định lượng BOM trên PostgreSQL Supabase |

---

## 5. Thư Viện Tri Thức & Tài Liệu Nghiệp Vụ (Knowledge Hub)

Để tránh phụ thuộc cứng vào danh sách file cụ thể, toàn bộ tài liệu đặc tả kiến trúc, thiết kế Database Schema, định lượng BOM và deep-dive từng Sprint được quản trị tập trung tại:

👉 **[Thư Viện Tài Liệu Dự Án (doc/README.md)](file:///d:/my-project/restaurant-os/doc/README.md)**

Khi cần tra cứu nghiệp vụ hoặc thiết kế, AI tra cứu mục lục tại file trên để đọc tài liệu chuyên biệt tương ứng (Kiến trúc v1.1, Sprint 1 Khách hàng, Màn hình nội bộ KDS/POS, Thiết kế Database).

- **Quy trình làm việc nhóm & đóng góp code cho Developer:** [CONTRIBUTING.md](file:///d:/my-project/restaurant-os/CONTRIBUTING.md)
