# Frontend Base Structure — Restaurant OS

> **Mẫu nền dùng chung cho mọi thành viên.** Mọi màn hình tính năng mới đều bắt đầu từ base
> này thay vì mỗi người tự chế một mẫu FE khác nhau.

> **QUYẾT ĐỊNH THEME v3 — ĐỌC TRƯỚC KHI DÙNG (thay đổi có chủ đích, không lặng lẽ):**
> Nhánh này áp dụng theme **"Bombay Palace Minimal"** làm theme duy nhất, **THAY THẾ**
> theme "Warm Earth Organic" của bản v2 (nền kem `#FAF7F2`, terracotta `#C4714A`,
> font Lora — bản v2 vẫn còn trong lịch sử commit của nhánh, không mất).
> Theme v3 lấy cảm hứng style từ trang chủ bombay-palace.co.uk — **chỉ cảm hứng về màu,
> font và nhịp trình bày, KHÔNG sao chép ảnh, logo hay văn bản của trang đó**:
> nền giấy sáng `#F5F2EA`, điểm nhấn đỏ gạch `#C1272D` (thang 50–900), chữ gần đen
> `#141210`, font **Cormorant Garamond** (heading serif, nét mảnh, in hoa, giãn chữ rộng
> cho trang website) + **Source Sans 3** (body, button; đều hỗ trợ tiếng Việt).
> Font nạp bằng `next/font/google` trong `layout.tsx` (self-hosted, không `@import`
> Google Fonts) — build lần đầu cần mạng để tải font, sau đó chạy offline được.
> Token nằm gọn trong block `@theme` của `frontend/src/app/globals.css`
> nên muốn revert chỉ cần sửa lại đúng block đó.
>
> **NGOẠI LỆ KDS:** shell/board KDS **GIỮ nền tối** `#0B0F14` để đọc được trong bếp,
> nhưng nút và accent đã chuyển sang đỏ gạch sáng (brick-400 `#CF5252`).
>
> **TÁCH BIỆT WEBSITE — QR ORDER:** trang demo `/restaurant-website` là website giới
> thiệu của quán. Khách đang ngồi tại quán quét mã QR trên bàn sẽ vào luồng gọi món
> riêng (xem `/customer-menu`), **không phải** trang website này. Trang website ghi rõ
> sự tách biệt này ở footer.
>
> > **QUYẾT ĐỊNH v4 — MÀN QUẢN LÝ VIẾT LẠI, BẢN CŨ KHÔNG TÍNH:**
> Bản v3 chỉ đổi token cho dashboard/POS nên nhìn vẫn là mẫu cũ (lưới thẻ KPI có
> shadow, cột biểu đồ tô đầy đỏ, bàn tô đầy màu trạng thái, sidebar pill tô nền).
> Bản v4 **viết lại cấu trúc** `/dashboard-demo` và `/pos-demo` theo Bombay Minimal,
> **không dựa mẫu cũ** — bản cũ chỉ còn trong lịch sử commit, không dùng làm mẫu nữa:
> - Số liệu quản lý trình bày dạng **hàng + dotted leader** như thực đơn trên website:
>   nhãn trái, giá trị serif phải, ngăn cách bằng viền be mỏng, không còn lưới thẻ KPI.
> - Biểu đồ giờ chỉ là **thanh mỏng**: chỉ giờ cao điểm tô đỏ gạch, các giờ còn lại
>   là thanh be nhạt. Tốc độ trạm cũng là hàng dotted leader, quá SLA mới in đỏ gạch.
> - Sơ đồ bàn: mỗi bàn là **ô trắng viền be mỏng**, trạng thái chỉ là **chấm tròn nhỏ +
>   chữ in hoa**, không tô đầy ô. Bàn đang chọn viền đỏ gạch + nền kem. Bàn quá SLA:
>   chỉ chấm đỏ nhấp nháy, không nhấp nháy cả ô.
> - Sidebar quản lý: chữ in hoa nhỏ có tracking, mục active chỉ gạch đỏ gạch, không tô nền.
> - Dữ liệu mẫu (DEMO_KPIS, DEMO_ALERTS, DEMO_TABLES) giữ nguyên — chỉ đổi cách trình bày.
>
> > **QUYẾT ĐỊNH v5 — APP VẬN HÀNH ≠ WEBSITE (trang website GIỮ NGUYÊN, KHÔNG ĐỔI):**
> `/restaurant-website` vẫn đúng như v3 (Cormorant, primary `#C1272D`, cream `#F5F2EA`);
> user tự đổi data mock trong web đó sau. Các trang vận hành tách hẳn sang token
> `ops-*` + font `font-ops` (Be Vietnam Pro) riêng, KHÔNG sửa token/font website:
> nền `#F7F3EC`, viền `#E8E0D2`, chữ `#2B2118`, chữ phụ `#7A6A58`, nút chính đỏ rượu
> `#8C1D2C`, gạch chân/viền vàng đồng `#B08D57`, cảnh báo SLA `#D14B3A` (chỉ dùng
> cho lỗi). Tiêu đề lớn trong app KHÔNG in hoa, KHÔNG tracking rộng; tiêu đề nhỏ
> mới in hoa. Số dùng `.ops-nums` (lining-nums + tabular-nums, căn phải trong bảng).
> - Dashboard v5: KPI card trên cùng kèm xu hướng, cảnh báo lên đầu và bấm đi thẳng
>   tới KDS/POS, biểu đồ cột đứng + cột so sánh cùng kỳ tuần trước, lọc Hôm nay /
>   Tuần / Tháng + chọn chi nhánh ở topbar, skeleton khi tải, empty state ở POS và
>   tìm kiếm nhân viên, badge "Demo" gọn ở topbar thay cho dòng demo lặp lại.
> - POS v5: bàn to/nhỏ theo số chỗ (6–8 chỗ chiếm 2 cột), nền tint nhẹ theo trạng
>   thái + chấm + ký hiệu + chữ (không chỉ màu), thời gian ngồi, nhân viên phụ trách,
>   số món đang chờ, đồng hồ quá SLA màu đỏ; lọc trạng thái kèm số lượng + tab khu
>   vực (Tầng 1 / Tầng 2 / Sân vườn); panel phải có danh sách món + trạng thái;
>   kéo-thả chuyển bàn hoặc chỉnh sơ đồ; hủy món/đơn có toast Hoàn tác 5 giây;
>   modal thanh toán có tổng tiền, phương thức, tiền thừa tự tính; drawer trượt phải
>   trên mobile; phím tắt `/` tìm bàn, `N` đơn mới; nút tối thiểu 44–48px.
> - Nhân viên v5 (`/staff-management`, tách khỏi Staff Portal `/staff-home`): bảng
>   tìm kiếm + lọc vai trò/trạng thái, badge vai trò màu riêng, lịch ca tuần kéo-thả,
>   cảnh báo thiếu người giờ cao điểm, chốt ca hiển thị chênh lệch kèm dấu +/−.
> - Layout v5: sidebar có icon, thu gọn được, mục chọn có nền + viền trái đậm;
>   topbar có chuông kèm số, tên + vai trò, ca hiện tại, Đổi ca / Đăng xuất;
>   mobile sidebar thành drawer hamburger.
> - CHƯA LÀM trong v5 (nói rõ để team không tưởng đã có): realtime thật bằng
>   WebSocket/polling (demo chỉ có nút giả lập), nhấn giữ bàn trên mobile, date picker
>   Tùy chọn thật cho dashboard, lưu layout sơ đồ / lịch ca thật, chế độ tối ca tối,
>   và viết lại `/customer-menu` + `/kds-board` + `/staff-home` theo ops (3 màn này
>   vẫn là bản cũ, chỉ chưa đụng tới trong v5).
>
> > **QUYẾT ĐỊNH v6 — MỘT DESIGN SYSTEM CHO MỌI TRANG (thay cho 3 "sản phẩm" ở v5):**
> v5 tách website (Cormorant + đỏ gạch `#C1272D`) khỏi app vận hành (Be Vietnam Pro +
> đỏ rượu `#8C1D2C` + vàng đồng) nên 7 màn nhìn như 3 sản phẩm khác nhau. v6 chốt:
> - Font: CHỈ 2 họ — Playfair Display cho tiêu đề website khách, Be Vietnam Pro cho
>   mọi thứ còn lại (body website, app vận hành, menu khách, staff). Số luôn
>   lining-nums + tabular-nums (`.ops-nums`).
> - Màu: MỘT đỏ brand `#8C1D2C` (nút chính duy nhất, kể cả website), MỘT đỏ cảnh báo
>   `#D14B3A` (chỉ lỗi / quá SLA / hủy). Nút phụ = viền xám + chữ ink, KHÔNG viền đỏ.
>   Sidebar active, tab đang chọn, badge vai trò = trung tính, không đỏ. Vàng đồng
>   (bronze) đã XÓA khỏi mọi trang. Nền: website kem `#F5F2EA`, app vận hành xám ấm
>   rất nhạt `#F6F4F0`. KDS giữ nền tối `#0B0F14`, nút chính vẫn brand, chữ nhấn trên
>   nền tối dùng tint sáng của brand.
> - Radius thống nhất 8px, bóng nhẹ `0 1px 3px rgba(0,0,0,.08)`. Thẻ chính có bóng nhẹ,
>   vùng phụ chỉ có viền — phân cấp bằng bóng + cỡ chữ, không phải bằng màu.
> - Thư viện chuẩn theo hướng shadcn (Radix primitives + `cn`): `Dialog` (modal thanh
>   toán POS) và `DropdownMenu` (menu ⋯ nhân viên) mới; icon Lucide thay ký hiệu tự
>   vẽ (○ ◐ ! ◇); biểu đồ dashboard dùng Recharts (cột + sparkline). KHÔNG chạy
>   shadcn CLI ghi đè toàn bộ component cũ vì sẽ phá 7 trang đang chạy — primitive
>   mới tương đương, migrate dần ở sprint sau nếu team chốt. Toast hoàn tác vẫn tự
>   viết (cần nút Hoàn tác trong 5 giây, Radix Toast chưa thay).
> - Đơn giản hóa: card bàn POS chỉ còn tên, trạng thái, thời gian ngồi (nhân viên /
>   món chờ / tạm tính sang panel phải); bảng nhân viên chỉ còn menu ⋯ mỗi hàng;
>   dashboard KPI số to + sparkline, bỏ gạch vàng dưới mọi tiêu đề.
> - Dọn UI: ghi chú dev không còn lẫn trong nội dung trang — trạng thái demo chỉ
>   còn badge "Demo" ở topbar/header. Menu khách có ảnh món mẫu (local, team thay
>   bằng ảnh thật của quán), bộ chọn số lượng +/−, desktop 2 cột thay cho cột hẹp
>   kẹt giữa màn hình. Hero website không còn 4 link menu phóng to: có headline thật,
>   câu chốt và CTA "Đặt bàn" nổi bật.
> - Lưu ý cho reviewer: trang dashboard dùng Recharts nên JS của riêng trang đó tăng
>   (First Load ~233 kB, các trang khác không đổi); repo dùng pnpm nên sau khi giải
>   nén phải chạy `pnpm install` để cập nhật `pnpm-lock.yaml` (VM không có pnpm nên
>   lockfile chưa cập nhật trong bộ commit này).
> - CHƯA LÀM trong v6: realtime thật, nhấn giữ mobile, date picker Tùy chọn thật,
>   lưu layout/lịch thật, dark mode ca tối — giống v5, không thay đổi.
>
> > **QUYẾT ĐỊNH v7 — KDS VIẾT LẠI THEO SPEC BẾP (chỉ chạm `/kds-board`, không đổi trang khác):**
> Card (trên → dưới): banner dị ứng đỏ đặc chữ trắng đậm 18px → bàn 30px + timer
> đếm trực tiếp MM:SS 24px tabular-nums → "SL × tên món" 24px → ghi chú 18px →
> thanh tiến độ theo SLA → nút cao 64px. Trạng thái SLA: viền trái dày 6px + tint
> nền + icon (✓ <70%, ⏱ 70–100%, ⚠ >100%), quá SLA nền đỏ tối + timer nhấp nháy.
> Nút đúng ngữ nghĩa: Nhận món xanh dương (`kds-action`), Báo xong xanh lá
> (`kds-success`); đỏ chỉ cho cảnh báo. Trong mỗi cột, ticket trễ nhất lên đầu.
> Ticket gộp món cùng bàn (mặc định) hoặc cùng món ("Nhóm theo món"); badge "Lô"
> cũ đổi thành "Nấu theo lô · gộp N bàn". Cột Xong: đếm thời gian chờ lên, vàng
> sau 3 phút, đỏ sau 5 phút (món nguội), chữ "Chờ phục vụ" xám (không hồng), nút
> Hoàn tác 10 giây sau khi báo xong. Header: tab trạm kèm số món đang làm + badge
> đỏ khi có món trễ, thống kê "Trễ · TB chờ", SLA 15 phút chỉ còn trong tooltip.
> Nút chuông thành icon Bell/BellOff. Món mới (demo): âm báo Web Audio + nháy
> viền + badge MỚI. Hết món (86) theo deep-dive cũ: món 86 gạch ngang + badge
> HẾT, card hết món nét đứt, nút chính bị khóa khi cả ticket hết món. Chạm cả
> card để nhận món (cột Chờ nấu), vuốt trái để báo xong (cột Đang nấu).
>
> > **QUYẾT ĐỊNH v7.1 — KDS NỀN SÁNG, ĐỒNG BỘ VỚI WEB (bỏ ngoại lệ nền tối):**
> Ngoại lệ nền tối #0B0F14 ở v6/v7 đã bỏ theo quyết định của user (bếp cũng
> không dùng màu đen nữa, KDS không được lệch pha với web). Token `kds-*` đổi
> sang nền sáng: nền giấy #F5F2EA (đúng nền website), card trắng, viền #E9E4DC,
> chữ #141210, chữ phụ #7A6A58, quá SLA nền đỏ nhạt #FDEAE6 (cùng
> ops-tint-overdue) thay cho nền đỏ tối #2B1416. Vàng "sắp trễ" dùng token mới
> `kds-soon` #9A6B12 đậm hơn honey-500 để đủ tương phản trên nền trắng
> (honey-500 giữ nguyên cho các trang khác). TopBar KDS bỏ bản tối, dùng bản
> sáng như các trang khác; tab trạm đang chọn, nút nhóm đang chọn và badge MỚI
> chuyển sang nền ink (nút trắng sẽ chìm vào topbar/card trắng); card KDS thêm
> bóng nhẹ `shadow-warm-sm` để nổi trên nền giấy. Nút, banner dị ứng, timer và
> logic SLA/timer/nhóm ticket giữ nguyên như v7.
>
> Trang demo của base nằm ở route group `(demo)` — xem mục 5.

## 1. Quy tắc bắt buộc của base

1. **Chỉ dùng token.** Mọi màu sắc, font đều qua token trong `@theme` (`bg-primary-500`,
   `text-ink`, `bg-table-empty`, `bg-kds-bg`…). **Cấm hardcode mã hex ngoài `globals.css`.**
   Cần màu mới → thêm token vào `globals.css` rồi mới dùng.
2. **Luôn dùng component dùng chung** trong `src/components/ui/` thay vì tự viết nút, thẻ,
   input, modal riêng. Cần biến thể mới → mở rộng component chung, không fork.
3. **Dùng đúng layout shell theo role** (mục 4). Không tự dựng khung trang mới khi đã có shell.
4. **Không dùng Three.js ngoài `(staff)/pos`.** POS trong base dùng CSS grid (xem demo
   `/pos-demo`). Tuyệt đối không dùng Three.js ở `(customer)`, dashboard, HR, KDS.
5. **Spacing lưới 8px, không ngoại lệ.** Ưu tiên `padding` và `gap` (Flex/Grid), tránh
   `margin`. Section padding 96px desktop / 64px mobile, không bao giờ ít hơn. Gap giữa
   các card 24px; padding trong card 24–32px; gap giữa các phần tử trong card ≥ 16px.
   Container max-width 1280px, padding ngang 24px mobile / 48px desktop, đặt trên
   container con bên trong — **KHÔNG đặt padding trực tiếp lên thẻ `<section>`**.
6. **Typography.** Heading dùng Cormorant Garamond, body/button dùng Source Sans 3.
   Riêng trang website: heading serif **in hoa, giãn chữ rộng** (tracking) theo style
   trang mẫu. Thang cỡ dùng biến clamp: display `clamp(2.5rem, 6vw, 5rem)`/600/1.1;
   h1 `clamp(1.75rem, 4vw, 3rem)`/600/1.2; h2 `clamp(1.25rem, 2.5vw, 2rem)`/600/1.3;
   h3 `clamp(1rem, 2vw, 1.5rem)`/600; body `1rem`/400/1.6; small `0.875rem`/400.
7. **Shadow phẳng, tối giản.** Shadow tông trung tính nhạt `rgba(20,18,16,0.08)` trở
   xuống; **viền mới là yếu tố tách lớp chính**, không dùng shadow đậm. Radius: card
   4px, nút 2px (góc gần vuông theo trang mẫu).
8. **Nút bấm.** Min-height 48px, padding `12px 32px`, radius 2px, `cursor: pointer`,
   hover = scale nhẹ + tăng shadow, active = nhấn xuống (chuyển động xác nhận hành động).
   Nút KDS tối thiểu 64px (`size="kds"`). Target chạm phía khách tối thiểu 44px.
9. **Selection.** `::selection` nền primary, chữ trắng. **Không dùng noise texture**
   (v3 tối giản, bỏ lớp phủ noise của v2).
10. **Code sạch & accessibility.** HTML5 semantic, không inline style, SVG inline cho
    divider/icon. Phân bổ màu demo khoảng 70% giấy sáng, 20% neutral/chữ, 10% đỏ gạch
    primary.
11. **Responsive mobile-first** (375 / 768 / 1024 / 1440). Mobile luôn 1 cột, đa cột chỉ
    bật bằng media query trên desktop. Card KHÔNG đặt chiều cao cố định gây cắt nội dung
    (chỉ min-height, cho giãn dọc). `word-break: break-word` để chữ dài không phá khung.
    Không có trang demo nào được scroll ngang.
12. **Tilt thẻ món tối đa ±8°** nếu có dùng tilt (chỉ animate bằng `transform`, `opacity`).
13. **SLA bếp 15 phút.** Chỉ báo quá SLA dùng `Badge` variant `sla-overdue` (nhấp nháy).
14. **Tiền tệ là số nguyên VND.** Hiển thị bằng hàm `formatVND` trong `src/lib/utils.ts`.
15. **Copy tiếng Việt** trên mọi trang demo.
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
| `Button` | Mọi nút bấm. Variants: `primary` (solid đỏ gạch), `secondary` (outline), `ghost`, `danger`. Sizes: `sm`, `md`, `lg` (min-height 48px), `kds` (tối thiểu 64px). |
| `Card` | Thẻ nội dung, KPI, chi tiết đơn. Nền trắng, shadow neutral nhẹ, radius 4px, padding 24px, hover nhấc lên, không chiều cao cố định. |
| `Badge` | Nhãn trạng thái: `table-empty`, `table-inuse`, `table-overdue`, `table-cleaning` (đúng token trạng thái bàn), `sla-ok`, `sla-warning`, `sla-overdue`, `default`, `success`, `warning`, `danger`, `neutral`. Prop `blink` để nhấp nháy. |
| `Input` | Ô nhập liệu có label + thông báo lỗi, cao tối thiểu 48px, focus ring tông đỏ gạch. |
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
| `/customer-menu` | Menu khách (luồng QR order): tab danh mục, thẻ món, bottom-sheet chi tiết món, thanh giỏ hàng. Tách riêng khỏi website. |
| `/kds-board` | Bảng KDS: 3 cột Chờ nấu / Đang nấu / Xong, nút kds 64px, chỉ báo SLA. Nền tối, accent đỏ gạch sáng. |
| `/pos-demo` | POS v5: bàn to/nhỏ theo chỗ ngồi, tint + ký hiệu trạng thái, lọc trạng thái/khu vực, panel món, kéo-thả, toast hoàn tác, modal thanh toán, drawer mobile. CSS grid, không Three.js. (Tên `/pos-demo` để tránh đụng route thật `/pos`.) |
| `/dashboard-demo` | Dashboard quản lý v5: KPI kèm xu hướng, cảnh báo lên đầu, biểu đồ cột + so sánh, lọc thời gian/chi nhánh, skeleton. (Tránh đụng route thật `/dashboard`.) |
| `/staff-management` | Quản lý nhân viên v5 (mới): bảng tìm kiếm/lọc, lịch ca tuần kéo-thả, chốt ca chênh lệch két. Tách khỏi Staff Portal. |
| `/staff-home` | Staff Home: thẻ ca hôm nay, thao tác nhanh, bottom nav. (Chưa viết lại theo ops trong v5.) |
| `/restaurant-website` | Website khách hàng: header trong suốt, hero ảnh toàn màn hình + liên kết serif in hoa, thực đơn nổi bật (dotted leader), câu chuyện, đặt bàn, footer 3 cột. Copy tiếng Việt, toàn bộ nội dung là mẫu. Ảnh hero là ảnh tạo mẫu — thay bằng ảnh thật của quán khi làm thật. |

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
hardcode ngoài `globals.css`, không có import three.js nào ngoài `(staff)/pos` (base này
không import three.js ở đâu cả). Ảnh nghiệm thu v4 cho dashboard/POS ở
`files/screenshots-v4/`; ảnh v3 còn lại (website, KDS, menu, staff) vẫn ở `files/screenshots-v3/`.
