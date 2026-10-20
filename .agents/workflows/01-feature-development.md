# Kịch Bản 01: Quy Trình Phát Triển Tính Năng Mới (Feature Development Workflow)

Kịch bản này hướng dẫn chi tiết từng bước phối hợp giữa Lập trình viên và AI Antigravity khi bắt đầu phát triển một tính năng (Feature) mới trong Sprint.

---

## Bước 1: Tiếp Nhận & Khởi Tạo Nhánh Làm Việc

1. **Kiểm tra trạng thái Git:**
   - Luôn đảm bảo đang đứng ở nhánh `dev` mới nhất:
     ```bash
     git checkout dev
     git pull origin dev
     ```
2. **Tạo nhánh tính năng:**
   - Đặt tên theo chuẩn: `<tiền-tố>/<tên-thành-viên>/feature-<tên>`
   - Ví dụ cho Frontend: `git checkout -b fe/duy/feature-sprint1-menu-qr`
   - Ví dụ cho Backend: `git checkout -b be/nam/feature-sprint1-order-bom`

---

## Bước 2: Làm Rõ Acceptance Criteria (AC) & Thiết Kế

1. **Đọc tài liệu đặc tả:**
   - Tra cứu tài liệu nghiệp vụ tương ứng trong [doc/README.md](file:///d:/my-project/restaurant-os/doc/README.md).
2. **Tra cứu Trí tuệ Thiết kế (Nếu làm Frontend):**
   - Chạy lệnh tra cứu palette màu và font chữ:
     ```bash
     python .agents/skills/ui-ux-pro-max/scripts/search.py "restaurant food menu" --domain product
     python .agents/skills/ui-ux-pro-max/scripts/search.py "restaurant" --domain color
     ```
3. **Xác định các trạng thái giao diện & API:**
   - Trạng thái UI: Loading, Empty, Normal, Sold-out (Hết hàng).
   - Realtime: Cần lắng nghe Topic STOMP nào? Xử lý reconnect REST sync ra sao?

---

## Bước 3: Lập Kế Hoạch Bằng Slash Command `/plan`

1. **Yêu cầu AI lập kế hoạch:**
   - Lập trình viên gõ `/plan` để AI phân tích cấu trúc Sub-tasks theo thứ tự:
     - *Task 1:* Định nghĩa Types / DTO (`types/`).
     - *Task 2:* Xây dựng Dumb UI Components (`components/ui/` hoặc `components/<domain>/`).
     - *Task 3:* Xây dựng Zustand Store Slice (`stores/`) kèm optimistic updates.
     - *Task 4:* Ghép nối vào Container Page (`app/(group)/.../page.tsx`).
2. **Duyệt kế hoạch:**
   - Lập trình viên rà soát, yêu cầu chỉnh sửa nếu cần, sau đó bấm **"Duyệt / Proceed"**.

---

## Bước 4: Thực Thi Từng Phân Đoạn (Vertical Slicing)

1. **AI chỉ code từng task một:**
   - Sau khi hoàn thành mỗi task, tự động kiểm tra biên dịch:
     ```bash
     pnpm --filter frontend type-check
     ```
2. **Tuân thủ triệt để Performance Budget:**
   - Nếu là màn khách hàng: Khóa góc tilt 3D $\pm 8^\circ$, chỉ animate `transform` và `opacity`, WebP lazy load.
   - Nếu là màn KDS: Nền tối `#0B0F14`, nút cảm ứng $\ge 48\text{px}$.

---

## Bước 5: Tự Nghiệm Thu Theo Definition of Done (DoD) & Mở PR

1. **Kiểm tra tiêu chuẩn hoàn thành (DoD):**
   - [x] Pass `type-check` và Lint.
   - [x] Đã test trực tiếp trên mobile hoặc desktop.
   - [x] Không commit `.env` hay file rác.
2. **Kích hoạt Skill Audit:**
   - Yêu cầu AI: *"Chạy skill audit-pr-readiness để kiểm tra và sinh mô tả PR"*.
3. **Mở Pull Request:**
   - Push nhánh lên Git và mở PR vào nhánh `dev` kèm mô tả 4 phần đã sinh.
