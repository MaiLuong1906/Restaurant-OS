# Frontend Base Structure — Restaurant OS

> **Mẫu nền dùng chung cho mọi thành viên.** Mọi màn hình tính năng mới đều bắt đầu từ base
> này thay vì mỗi người tự chế một mẫu FE khác nhau.

> **QUYẾT ĐỊNH THEME v2 — ĐỌC TRƯỚC KHI DÙNG (thay đổi có chủ đích, không lặng lẽ):**
> Nhánh này áp dụng theme **"Warm Earth Organic"** làm theme duy nhất, **THAY THẾ** theme
> "Vietnamese Gastronomic OS" của Stitch ở bản v1 (đỏ gạch `#C84B31`, xanh lá `#1B4332`,
> font Be Vietnam Pro — bản v1 đã lưu trong file zip giao cho user, không mất).
> Theme v2: nền cream `#FAF7F2`, primary terracotta `#C4714A` (thang 50–900),
> secondary nâu ấm `#6B4226`, accent sage `#8FAF8F`, mặt thẻ trắng `#FFFFFF`,
> chữ nâu đậm `#33241A`, font **Lora** (heading, serif, italic) + **Source Sans 3**
> (body, button; tên hiện tại trên Google Fonts của Source Sans Pro, đều hỗ trợ tiếng Việt
> qua latin-ext). Token nằm gọn trong block `@theme` của `frontend/src/app/globals.css`
> nên muốn revert chỉ cần sửa lại đúng block đó.
>
> **NGOẠI LỆ KDS:** shell/board KDS **GIỮ nền tối** `#0B0F14` để đọc được trong bếp,
> nhưng nút và accent đã chuyển sang terracotta Warm Earth.
>
> **NGOẠI LỆ NGÔN NGỮ:** trang demo `/cafe-landing` giữ nguyên copy **tiếng Anh** của prompt
> gốc; mọi trang demo khác giữ tiếng Việt.
>
> Trang demo của base nằm ở route group `(demo)` — xem mục 4.

## 1. Quy tắc bắt buộc của base

1. **Chỉ dùng token.** Mọi màu sắc, font đều qua token trong `@theme` (`bg-primary-500`,
   `text-ink`, `bg-table-empty`, `bg-kds-bg`…). **Cấm hardcode mã hex ngoài `globals.css`.**
   Cần màu mới → thêm token vào `globals.css` rồi mới dùng.
2. **Luôn dùng component dùng chung** trong `src/components/ui/` thay vì tự viết nút, thẻ,
   input, modal riêng. Cần biến thể mới → mở rộng component chung, không fork.
3. **Dùng đúng layout shell theo role** (mục 3). Không tự dựng khung trang mới khi đã có shell.
4. **Không dùng Three.js ngoài `(staff)/pos`.** POS trong base dùng CSS grid (xem demo
   `/pos-demo`). Tuyệt đối không dùng Three.js ở `(customer)`, dashboard, HR, KDS.
5. **Spacing lưới 8px, không ngoại lệ.** Ưu tiên `padding` và `gap` (Flex/Grid), tránh
   `margin`. Section padding 96px desktop / 64px mobile, không bao giờ ít hơn. Gap giữa
   các card 24px; padding trong card 24–32px; gap giữa các phần tử trong card ≥ 16px.
   Container max-width 1280px, padding ngang 24px mobile / 48px desktop, đặt trên
   container con bên trong — **KHÔNG đặt padding trực tiếp lên thẻ `<section>`**.
6. **Typography.** Heading dùng Lora, body/button dùng Source Sans 3, nhấn từ khóa trong
   H1/H2 bằng italic. Thang cỡ dùng biến clamp: display `clamp(2.5rem, 6vw, 5rem)`/600/1.1;
   h1 `clamp(1.75rem, 4vw, 3rem)`/600/1.2; h2 `clamp(1.25rem, 2.5vw, 2rem)`/600/1.3;
   h3 `clamp(1rem, 2vw, 1.5rem)`/600; body `1rem`/400/1.6; small `0.875rem`/400.
7. **Shadow CHỈ tông nâu ấm** `rgba(100,60,20,0.1)` trở lên — **cấm shadow xám/đen**
   (`rgba(0,0,0,...)`). Radius: card 16px, nút `24px 24px 2px 24px`, blob hữu cơ
   `60% 40% 55% 45% / 50% 60% 40% 50%` cho ảnh và icon nổi bật.
8. **Nút bấm.** Min-height 48px, padding `12px 32px`, radius playful, `cursor: pointer`,
   hover = scale nhẹ + tăng shadow, active = nhấn xuống (chuyển động xác nhận hành động).
   Nút KDS tối thiểu 64px (`size="kds"`). Target chạm phía khách tối thiểu 44px.
9. **Texture & selection.** Noise phủ toàn bộ body bằng SVG feTurbulence, opacity 0.03,
   không chặn click. `::selection` nền primary, chữ trắng.
10. **Code sạch & accessibility.** HTML5 semantic, không inline style, SVG inline cho
    divider/icon, ảnh có thể phủ multiply tông ấm. Phân bổ màu demo khoảng 70% cream,
    20% nâu neutral/chữ, 10% terracotta primary.
11. **Responsive mobile-first** (375 / 768 / 1024 / 1440). Mobile luôn 1 cột, đa cột chỉ
    bật bằng media query trên desktop. Card KHÔNG đặt chiều cao cố định gây cắt nội dung
    (chỉ min-height, cho giãn dọc). `word-break: break-word` để chữ dài không phá khung.
    Không có trang demo nào được scroll ngang.
12. **Tilt thẻ món tối đa ±8°** nếu có dùng tilt (chỉ animate bằng `transform`, `opacity`).
13. **SLA bếp 15 phút.** Chỉ báo quá SLA dùng `Badge` variant `sla-overdue` (nhấp nháy).
14. **Tiền tệ là số nguyên VND.** Hiển thị bằng hàm `formatVND` trong `src/lib/utils.ts`.
15. **Copy tiếng Việt** (trừ `/cafe-landing` theo ngoại lệ trên).
16. **Dữ liệu demo phải ghi rõ là mẫu.** Trang `(demo)` không gọi API thật.

## 2. Checklist video UI/UX (đã audit toàn bộ trang demo)

- **Một hành động chính mỗi màn hình**, trội hẳn về thị giác; các hành động phụ hạ
  xuống secondary/ghost. Ví dụ: menu khách chỉ "Gửi bếp" là primary solid, nút "+ Thêm"
  là secondary outline; POS chỉ "Thanh toán" là primary cỡ lg; staff home chỉ
  "Check-out kết ca" là primary.
- **Spacing đúng hệ token**, không margin/padding tự chế chen ngang.
- **Một thứ bậc thị giác duy nhất mỗi màn hình**: nếu hai phần tử cùng to cùng đậm thì
  hạ một bên xuống (ví dụ: dashboard chỉ giá trị KPI dùng font serif cỡ h2).
- **Chuyển động xác nhận hành động**: mọi phần tử tương tác đều có hover VÀ active/pressed,
  không còn nút tĩnh chết.
- **Nhất quán hơn sáng tạo bất ngờ**: cùng một component/token ở mọi trang, không style
  riêng lẻ theo trang.

## 3. Component dùng chung (`src/components/ui/`)

| Component | Dùng khi nào |
|---|---|
| `Button` | Mọi nút bấm. Variants: `primary` (solid terracotta), `secondary` (outline), `ghost`, `danger`. Sizes: `sm`, `md`, `lg` (min-height 48px), `kds` (tối thiểu 64px). |
| `Card` | Thẻ nội dung, KPI, chi tiết đơn. Nền trắng, shadow nâu ấm, radius 16px, padding 24px, hover nhấc lên, không chiều cao cố định. |
| `Badge` | Nhãn trạng thái: `table-empty`, `table-inuse`, `table-overdue`, `table-cleaning` (đúng token trạng thái bàn), `sla-ok`, `sla-warning`, `sla-overdue`, `default`, `success`, `warning`, `danger`, `neutral`. Prop `blink` để nhấp nháy. |
| `Input` | Ô nhập liệu có label + thông báo lỗi, cao tối thiểu 48px, focus ring tông ấm. |
| `Tabs` | Tab ngang: tab active = màu primary + gạch chân. Prop `dark` cho nền tối KDS. |
| `Modal` | Hộp thoại xác nhận, form ngắn. |
| `BottomSheet` | Sheet trượt từ dưới lên phía khách (chi tiết món, giỏ hàng). |
| `TopBar` | Thanh topbar 3 slot trái / giữa / phải, prop `dark` cho KDS. |

## 4. Layout shell theo role (`src/components/layouts/`)

| Layout | Role / màn hình | Đặc điểm |
|---|---|---|
| `CustomerLayout` | Khách (QR / menu / giỏ hàng) | Mobile-first, header slot, thanh giỏ hàng dính đáy (slot). |
| `KdsLayout` | Bếp (KDS) | **Ngoại lệ nền tối** `bg-kds-bg`, slot lọc trạm, chuông, đồng hồ. |
| `PosLayout` | Thu ngân (POS) | Vùng sơ đồ bàn + rail bên phải; mobile rail xếp dưới bản đồ. |
| `DashboardLayout` | Quản lý / Chủ quán | Sidebar (ẩn trên mobile) + nội dung. |
| `StaffLayout` | Nhân viên (Staff Portal) | Mobile + bottom navigation 4 mục. |

## 5. Trang demo (`src/app/(demo)/` — route group, không đụng route thật)

| URL | Nội dung |
|---|---|
| `/customer-menu` | Menu khách: tab danh mục, thẻ món, bottom-sheet chi tiết món, thanh giỏ hàng. |
| `/kds-board` | Bảng KDS: 3 cột Chờ nấu / Đang nấu / Xong, nút kds 64px, chỉ báo SLA. |
| `/pos-demo` | POS: sơ đồ bàn CSS grid + rail chi tiết bàn. (Tên `/pos-demo` để tránh đụng route thật `/pos`.) |
| `/dashboard-demo` | Dashboard: KPI, placeholder biểu đồ, danh sách cảnh báo. (Tránh đụng route thật `/dashboard`.) |
| `/staff-home` | Staff Home: thẻ ca hôm nay, thao tác nhanh, bottom nav. |
| `/cafe-landing` | Landing Artisan Cafe: navbar, hero, Signature Roasts, Story (wave divider + ảnh blob), Process, Menu Preview (tab), Newsletter, Footer. Copy tiếng Anh theo prompt gốc. |

Dữ liệu demo nằm ở `src/lib/demo-data.ts` và được ghi rõ là **dữ liệu mẫu**.

## 6. Cách copy demo thành trang tính năng thật

1. Copy file demo tương ứng sang route group thật, ví dụ:
   `(demo)/customer-menu/page.tsx` → `(customer)/menu/page.tsx` (ghi đè có chủ đích, theo quy
   trình PR của team — base này **không tự sửa** các trang thật).
2. Giữ nguyên layout shell và component dùng chung; chỉ thay dữ liệu mẫu bằng dữ liệu từ
   store/API thật (Zustand + `src/lib/api-client.ts` / `src/lib/stomp.ts`).
3. Giữ nguyên token và quy tắc mục 1. Nếu màn mới cần component chưa có, thêm vào
   `src/components/ui/` hoặc `src/components/layouts/` để các thành viên khác dùng chung.

## 7. Kiểm chứng base này

```bash
pnpm install
pnpm --filter frontend typecheck   # tsc --noEmit
pnpm --filter frontend build       # next build
```

Base được nghiệm thu khi typecheck và production build đều xanh, grep không thấy mã hex
hardcode ngoài `globals.css`, không thấy `rgba(0,0,0` trong code mới/sửa, và không có
import three.js nào ngoài `(staff)/pos` (base này không import three.js ở đâu cả).
