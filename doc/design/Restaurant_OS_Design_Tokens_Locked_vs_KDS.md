# Base màu Restaurant OS — cái nào KHÓA CHUNG, cái nào ĐỔI RIÊNG CHO KDS

Nguồn đối chiếu: `frontend/src/app/globals.css` (design system v6 + KDS v7.1, nhánh `fe/huy/feature-ui-foundation`, đã merge vào `dev` head `ae66277`) và `frontend/src/components/ui/Button.tsx` (các variant nút). Kiểm tra phạm vi ảnh hưởng bằng grep trên code thật, không đoán.

Quy tắc đọc bảng: **KHÓA** = đổi mã này là đổi cả hệ thống (website, POS, dashboard, staff, menu khách). **KDS-RIÊNG** = đổi mã này chỉ đổi màn KDS, các màn khác không nhúc nhích. Chú ý: nhiều token KDS có **cùng giá trị hex** với token chung nhưng là **biến riêng** — đổi bên KDS không làm đổi bên chung và ngược lại.

## 1. KHÓA CHUNG — không đổi (nền, chữ, viền, thương hiệu, trạng thái dùng chung)

### 1a. Nền (background)
| Token | Mã | Dùng ở đâu | Đổi thì sao |
|---|---|---|---|
| `--color-cream` (nền trang, `--background`) | `#F5F2EA` | Body toàn app; `CustomerLayout`, `PosLayout`, `StaffLayout`, trang website khách, menu khách | Đổi là đổi nền website + POS + staff + menu cùng lúc |
| `--color-ops-bg` | `#F6F4F0` | `DashboardLayout`, staff-management, `Dialog`, `DropdownMenu` | Đổi là đổi nền dashboard + màn quản lý |
| `--color-surface` / card trắng | `#FFFFFF` | Card mọi màn | Đổi là đổi mọi card |
| `--color-cream-dark` | `#ECE7DA` | `Modal`, `BottomSheet` | Đổi là đổi nền modal/bottomsheet mọi màn |
| `--color-story` | `#FAF8F3` | Nền phụ tông giấy sáng | Đổi là đổi các khối nền phụ |
| `--color-sand-100` | `#F2EEE3` | Nền phụ xám be | Như trên |

### 1b. Chữ và viền
| Token | Mã | Dùng ở đâu | Ghi chú |
|---|---|---|---|
| `--color-ink` | `#141210` | Chữ chính toàn app; KDS dùng lại qua `--color-kds-text` (cùng giá trị) | Gần đen, không phải đen tuyệt đối |
| `--color-ops-ink` | `#2B2118` | Chữ của app vận hành (dashboard) | Khác `--color-ink` — đừng gộp 2 mã này lại khi chưa quyết |
| `--color-muted` | `#6F6659` | Chữ phụ chung | |
| `--color-ops-muted` / `--color-kds-muted` | `#7A6A58` | Chữ phụ app vận hành + KDS (cùng giá trị, 2 biến) | |
| `--color-ops-border` / `--color-kds-border` | `#E9E4DC` | Viền card, input, cột KDS (cùng giá trị, 2 biến) | |
| Thang `--color-sand-200` → `sand-600` | `#E4DDCC` → `#5F5546` | Viền, chữ phụ, nút phụ, trạng thái disabled | |
| Thang `--color-brown-*` / `--color-secondary` | `#1A1713` (secondary), `#241F1A` (brown-900) | Header tối, backdrop, chữ đậm | Tông espresso, thay thang nâu ấm của v2 |

### 1c. Thương hiệu và cảnh báo — MỘT mã duy nhất cho mỗi vai trò (quy tắc v6)
| Token | Mã | Dùng ở đâu | Đổi thì sao |
|---|---|---|---|
| `--color-ops-brand` / `--color-primary-500` | `#8C1D2C` | Nút chính (variant `primary` trong `Button.tsx`), CTA website, selection | Đổi là đổi nút chính MỌI màn |
| `--color-primary-600` (brand-dark) | `#6F1623` | Hover/nhấn của nút chính, thang primary | Đi theo brand |
| `--color-primary-100` / `primary-50`, `--color-ops-brand-light` | `#F5D2D6` / `#FBEDEF`, `#F7E8EA` | Tint nền nhạt quanh brand | Đi theo brand |
| `--color-ops-alert` / `--color-danger-500` | `#D14B3A` | Variant `danger`, hủy/xóa/lỗi/quá SLA; dùng ở POS, dashboard, KDS, staff-management, `Badge`, `Input` | Đổi là đổi nghĩa "nguy hiểm" khắp hệ thống |
| `--color-danger-600` | `#B23A2E` | Hover/nhấn của danger | Đi theo danger |
| `--color-danger-200` | `#FBE3DE` | Nền nhạt danger | Đi theo danger |

### 1d. Màu trạng thái dùng chung — POS / KDS / dashboard PHẢI đồng nghĩa
| Token | Mã | Ý nghĩa |
|---|---|---|
| `--color-table-empty` | `#5F7F5E` | Bàn trống (cùng giá trị với `sage-700`) |
| `--color-table-inuse` | `#D9A441` | Bàn đang dùng (cùng giá trị với `honey-500`) |
| `--color-table-overdue` | `#D14B3A` | Bàn quá giờ (cùng giá trị với danger) |
| `--color-table-cleaning` | `#9A8F80` | Bàn đang dọn |
| `--color-ops-tint-empty` | `#EAF2EB` | Nền nhạt bàn trống |
| `--color-ops-tint-inuse` | `#FDF3D7` | Nền nhạt bàn đang dùng |
| `--color-ops-tint-overdue` | `#FDEAE6` | Nền nhạt bàn quá giờ (KDS dùng lại giá trị này qua `--color-kds-overdue-bg`, biến riêng) |
| `--color-ops-tint-cleaning` | `#F0EDE8` | Nền nhạt bàn đang dọn |
| Thang `--color-sage-100/200/500/700` | `#E7EEE5` / `#CFDFCC` / `#8FAF8F` / `#5F7F5E` | Xanh chức năng: thành công / SLA ổn — KHÔNG phải accent brand |
| `--color-honey-500` | `#D9A441` | Vàng ấm: đang dùng / cảnh báo nhẹ |

### 1e. Quy tắc chung không phải màu — cũng khóa theo
- **Bo góc:** 8px thống nhất mọi nút, thẻ, modal, input (`--radius-card`, `--radius-playful`).
- **Bóng:** nhẹ `0 1px 3px rgba(0,0,0,0.08)` làm chuẩn (`--shadow-warm-sm`, `--shadow-warm`); bóng lớn `0 4px 12px rgba(0,0,0,0.1)` chỉ cho modal/lớp nổi.
- **Font:** chỉ 2 họ — Playfair Display cho tiêu đề website khách, Be Vietnam Pro cho mọi thứ còn lại (body web, toàn bộ app vận hành, menu khách, staff). Số vận hành luôn `tabular-nums`.
- **Nút phụ (secondary / ops-outline):** nền trắng + viền xám + chữ ink, KHÔNG viền đỏ (quy tắc v6). Đổi kiểu nút phụ là đổi mọi màn.
- **Sidebar active, tab đang chọn, badge vai trò:** trung tính (ink), không đỏ — quy tắc v6.
- **Vàng đồng (bronze):** đã xóa khỏi mọi trang ở v6, không dùng lại.

## 2. KDS-RIÊNG — đổi được, chỉ ảnh hưởng màn KDS

Những token này chỉ xuất hiện ở `app/(demo)/kds-board` (và variant nút KDS trong `Button.tsx`). Đổi chúng không chạm tới website, POS, dashboard hay staff.

| Token | Mã hiện tại | Vai trò trong A3 v2 |
|---|---|---|
| `--color-kds-bg` | `#F5F2EA` | Nền board KDS (chỉ `KdsLayout` dùng) — cùng giá trị với cream nhưng biến riêng |
| `--color-kds-surface` / `--color-kds-card` | `#FFFFFF` | Nền vùng / card ticket KDS |
| `--color-kds-text` | `#141210` | Chữ KDS (cùng giá trị với ink, biến riêng) |
| `--color-kds-accent` | `#8C1D2C` | Điểm nhấn KDS (cùng giá trị với brand, biến riêng) |
| `--color-kds-action` | `#2563EB` | **Nút "Bắt đầu nấu"** (variant `kds-action` trong `Button.tsx`) — xanh dương trung tính, không dùng đỏ brand cho hành động |
| `--color-kds-soon` | `#9A6B12` | **Trạng thái "Sắp trễ"** — đậm hơn `honey-500` để đủ tương phản trên nền trắng (`honey-500` giữ nguyên cho các màn khác) |
| `--color-kds-warning` | `#D9A441` | Thanh SLA sắp trễ (cùng giá trị với `honey-500`, biến riêng) |
| `--color-kds-danger` | `#D14B3A` | Quá SLA / dị ứng trên KDS (cùng giá trị với danger, biến riêng) |
| `--color-kds-overdue-bg` | `#FDEAE6` | Nền card quá SLA (cùng giá trị với `ops-tint-overdue`, biến riêng) |

### Trường hợp đặc biệt: nút "Báo hoàn tất"
- Trong `Button.tsx`, variant `kds-success` hiện dùng **`bg-sage-700`** — tức đang ăn theo token **chung** `sage-700` (cùng token còn dùng ở `Badge` và staff-management).
- Muốn đổi màu nút "Báo hoàn tất" mà **không** đổi các chỗ khác: đừng sửa `sage-700`. Cách sạch là đổi variant `kds-success` sang một token riêng (ví dụ thêm `--color-kds-success: <mã mới>`) rồi mới đổi mã đó. Đây là việc code, làm ở giai đoạn viết lại route `(staff)/kds` thật, không làm trong file nháp HTML.
- Tương tự: muốn đổi màu "Bắt đầu nấu" thì chỉ cần đổi `--color-kds-action` — token này đã là riêng của KDS.

## 3. Vị trí / bố cục — cái nào đổi riêng được cho KDS
- **Chỉ của KDS, đổi thoải mái:** `KdsLayout`, `app/(demo)/kds-board` (sau này là `(staff)/kds`): số cột, thứ tự cột, vị trí header (tên trạm, đồng hồ, trạng thái kết nối, thống kê), vị trí banner dị ứng trên ticket, thứ tự đọc trong ticket, vị trí nút trên ticket, vị trí toast xác nhận, bản mobile xếp chồng.
- **Dùng chung, đừng đổi riêng cho KDS:** `TopBar`, `Modal`, `Dialog`, `BottomSheet`, `DropdownMenu`, `Button` (trừ 2 variant `kds-*`), `Badge`, `Input`, `StaffLayout`, `DashboardLayout`, `PosLayout`, `CustomerLayout` — đổi các component này là đổi mọi màn dùng chúng.
- **Quy tắc kích thước vẫn giữ trên KDS:** nút KDS tối thiểu 64px (`min-h-16`, size `kds` trong `Button.tsx`); cỡ chữ theo chuẩn v7.1 (bàn 30px, tên món 24px, ghi chú 18px, timer 24px tabular-nums).

## 4. Lưu ý khi sửa màu sau này
- Chú thích trong `globals.css` vẫn ghi "KDS là ngoại lệ duy nhất: giữ nền tối `#0B0F14`" — chú thích này đã **lỗi thời** từ v7.1 (KDS đã chuyển nền sáng, token `kds-*` sáng ở ngay dưới). Khi sửa màu thật, sửa cả chú thích đó cho khớp, tránh người sau đọc nhầm mà đổi ngược về nền tối.
- Đừng tạo thêm một đỏ/vàng/xanh mới cho mỗi màn: v6 chốt MỘT đỏ brand, MỘT đỏ cảnh báo, MỘT vàng honey, MỘT xanh sage cho mỗi vai trò. Màu mới cho KDS nên đi qua token `kds-*` riêng, không thêm token chung.
- File này chỉ là bảng đối chiếu để thiết kế; đổi màu thật trong code thuộc giai đoạn viết lại route `(staff)/kds`, không sửa trong file nháp HTML của A3 v2.

## Cập nhật ngày 2026-11-05 — quyết định mới, ưu tiên hơn v7.1 (bản A3 v3 Minimal Operations UI)

Những điểm dưới đây thay thế phần tương ứng ở các mục trên cho màn KDS (các màn khác không đổi). Bảng gốc giữ nguyên để đối chiếu lịch sử v7.1.

- **Nền KDS đổi từ giấy sang ops:** nền board KDS là `#F6F4F0` (nền ứng dụng vận hành, chung với Dashboard), không còn `#F5F2EA` của v7.1. Token `--color-kds-bg` khi viết lại route thật phải map về giá trị ops, hoặc bỏ token riêng và dùng thẳng `ops-bg`.
- **Nút KDS dùng brand, không dùng xanh dương/xanh lá:** nút "Hoàn tất ticket" là brand `#8C1D2C`, chữ trắng, cao 48px. Token `--color-kds-action` (`#2563EB`) và màu `sage-700` (`#5F7F5E`) từ v7 **không còn là màu nút KDS** — màu xanh của trạng thái bàn không đồng nghĩa với màu nút bấm. Khi viết lại route thật, 2 variant `kds-action`/`kds-success` trong `Button.tsx` cần xem lại theo hướng này.
- **Bố cục KDS đổi từ Kanban sang 1 hàng đợi lưới:** 3 cột desktop / 2 cột tablet ngang / 1 cột tablet dọc (số cột của lưới, không phải cột trạng thái). Nút "Bắt đầu nấu" của v2 bị bỏ — SLA tính từ khi ticket đến trạm; chỉ thêm lại nút này nếu cần thống kê riêng thời gian chờ và thời gian nấu.
- **86 bỏ hẳn khỏi card đầu bếp** (cả nút từng món của v1 lẫn dòng báo trên ticket của v2). Đường báo hết món thuộc về A7/A8 và quyền quản lý.
- **Không nhấp nháy:** bỏ hiệu ứng blink của v7 cho timer/quá SLA; quá hạn chỉ dùng viền đỏ cố định + chip.
- **Không ảnh món ăn trên card; icon một bộ outline Lucide duy nhất; spacing bội số 4px** (header 56px, thống kê 64–72px, nút 48px, bo 8px).

## 5. Tóm tắt một dòng
- **Khóa:** nền kem `#F5F2EA` + nền ops `#F6F4F0`, chữ `#141210` / `#2B2118`, viền `#E9E4DC`, brand `#8C1D2C`, danger `#D14B3A`, trạng thái bàn (xanh `#5F7F5E` / vàng `#D9A441` / đỏ `#D14B3A` / xám `#9A8F80`), bo 8px, bóng nhẹ, 2 họ font.
- **Đổi riêng cho KDS:** `kds-action #2563EB` (Bắt đầu nấu), `kds-soon #9A6B12` (Sắp trễ), `kds-overdue-bg #FDEAE6`, `kds-warning #D9A441`, `kds-bg #F5F2EA`; nút Báo hoàn tất muốn đổi riêng thì phải tách khỏi `sage-700` trước.
