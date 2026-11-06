# Restaurant OS — Code Phase Plan (Frontend thật, từ 23 màn đã duyệt)

> Plan riêng cho giai đoạn code (không gộp vào plan UI-UX). Đầu vào: 23 bản
> nháp hi-fi đã duyệt + `ROUTE_AUDIT.md` (Antigravity kiểm tra ngày
> 2026-11-06 trên máy local, nhánh `dev` @ `ae66277`) + bảng quyết định
> `Restaurant_OS_Decisions_Locked.md`.
>
> Nguyên tắc: **UI thật với mock service trước, nối API thật sau.** Backend
> hiện chỉ có 2 controller (Health, Dish) nên không màn nào nối API thật
> được ngay — code UI đúng spec trước, chờ backend theo sau.

## 0. Kết quả audit — đã đối chiếu và hiệu chỉnh

Audit nhìn chung **đúng và dùng được**: nhánh/commit khớp, bảng route khớp
với audit giai đoạn 0, không phát hiện tài khoản demo hardcode, CVE xác nhận
đúng. Đã kiểm chứng lại các điểm chính trên bản clone
(`fe/huy/feature-ui-foundation` @ `d96c385`, merge `ae66277` đã có trong
clone): `next 15.1.7`, `COOKING` vẫn trong `OrderItemStatus`, chưa có type
`Ticket`/`Batch`, route `(staff)/kds` dùng `INITIAL_KDS_ITEMS` hardcode với
type 3 trạng thái riêng (không dùng `useKdsStore`), demo `kds-board` không
dùng store, `staff-home` hardcode "Chào buổi tối, Minh Anh", token trong
`globals.css` khớp hệ đã khóa, không có `0901234567` trong `frontend/src/`.

**3 điểm audit sai — phải sửa theo quyết định đã khóa (không theo audit):**

| # | Audit ghi | Đúng theo quyết định đã khóa |
|---|---|---|
| 1 | Nền KDS: team chốt lại sáng `#F5F2EA` (v7.1) hay tối `#0B0F14` (AGENTS.md) | **Không cần chốt lại.** Đã khóa 2026-11-05 (Minimal Operations UI): nền KDS = **`#F6F4F0`** (nền vận hành). Token `--color-kds-bg: #f5f2ea` (`globals.css:112`) đang lệch; chú thích ở `globals.css:15` ("KDS giữ nền tối #0B0F14") đã lỗi thời từ v7.1. Khi code: đặt nền KDS `#F6F4F0` (dùng luôn `--color-ops-bg`), sửa chú thích cũ. |
| 2 | Hoàn tác Undo **10s** | Đã khóa ở A3 v3: toast + Hoàn tác **5 giây**. Số 10s là của demo v7.1 / plan cũ. |
| 3 | `SlaTimer` "đổi màu khi sắp quá hạn và **nhấp nháy** khi quá hạn" | Đã khóa ở A3 v3: **không thanh SLA, không phần trăm, không nhấp nháy** — chỉ chip SLA khi gần/quá hạn. Timer hiện thời gian chờ dạng MM:SS; trạng thái SLA là chip, không phải hiệu ứng. |

**1 phát hiện mới khi kiểm chứng lại (audit không ghi):**
- `useKdsStore` đang subscribe topic **`/topic/kds/orders`**
  (`frontend/src/stores/useKdsStore.ts:58`). Câu hỏi Sprint 0 "tên topic kds
  hay kitchen" coi như đã có đáp án trong code frontend: **`kds`**. Backend
  phải publish đúng `/topic/kds/orders` (hoặc team xác nhận chính thức `kds`).
  Không cần quyết lại — chỉ cần backend theo đúng.

**3 điểm audit chưa kiểm tra — làm rõ trước khi code:**
- Demo trong `(demo)/` gắn kết thế nào? Demo `kds-board` **không dùng
  `useKdsStore`** — nên "chuyển demo sang route thật" thực chất là **viết
  lại theo nháp, tham khảo demo**, không phải dời code nguyên vẹn. Kiểm tra
  tương tự với `staff-home` trước khi quyết tái sử dụng.
- B4: camera hook chưa đủ — cần chốt thư viện nhận diện trước khi code B4:
  **Human (vladmandic/human) hoặc MediaPipe Tasks Vision** chạy trên trình
  duyệt (miễn phí); `face-api.js` bản gốc đã dừng ở 0.22.2 từ 2020, không
  dùng. Ngoài ra màn **đăng ký khuôn mặt phía quản lý chưa có trong
  inventory** — cần thêm màn này (ngoài 23 màn) hoặc đặt trong module quản lý.
- B2: dữ liệu mẫu "Minh Anh" trong demo phải thay bằng dữ liệu người đăng
  nhập thật — không mang tên mẫu sang route thật (nháp dùng "Huy" cũng chỉ
  là tên mẫu).

## 1. Bước 0 — Đưa tài liệu thiết kế vào repo

Các file nháp HTML + bảng quyết định hiện nằm trên máy Muse, **chưa có
trong repo**. Trước khi code, copy vào repo để team clone về có đủ spec:

```text
docs/design/
  Restaurant_OS_Staff_KDS_UIUX_Plan.md
  Restaurant_OS_Decisions_Locked.md
  Restaurant_OS_Design_Tokens_Locked_vs_KDS.md
  Restaurant_OS_A1_KDS_Login_DRAFT.html
  Restaurant_OS_A3_KDS_HiFi_v3_DRAFT.html        (v3 đã duyệt)
  Restaurant_OS_A3_KDS_HiFi_v4_DRAFT.html        (v4 đã duyệt, bỏ trạm)
  Restaurant_OS_A3_KDS_HiFi_v5_DRAFT.html        (v5 đã duyệt, chế độ mẻ)
  Restaurant_OS_A5_KDS_Ticket_Detail_v2_DRAFT.html
  Restaurant_OS_A6_A10_KDS_Exceptions_v2_DRAFT.html
  Restaurant_OS_B1_Login_v3_DRAFT.html
  Restaurant_OS_B2_Staff_Home_v2_DRAFT.html
  Restaurant_OS_B3_B5_Attendance_v2_DRAFT.html
  Restaurant_OS_B6_B8_Schedule_v2_DRAFT.html
  Restaurant_OS_B9_B10_Leave_v2_DRAFT.html
  Restaurant_OS_B11_B13_Payslip_Tip_v2_DRAFT.html
  ROUTE_AUDIT.md                                  (báo cáo audit route)
```

Mỗi màn code theo đúng file nháp tương ứng (bản đã duyệt), không code theo
bản demo trong `(demo)/`.

## 2. Giai đoạn 0 — Nền tảng P0 (0,5–1 buổi, chặn mọi màn khác)

| # | Việc | File / Ghi chú |
|---|---|---|
| 0.1 | **Vá CVE-2025-66478**: nhánh `fix/next-15.1.9-cve-2025-66478` từ `dev`, chỉ pin `next@15.1.9` (`frontend/package.json` + `pnpm-lock.yaml` ở gốc), build xanh, mở PR vào `dev`. Không push thẳng `dev`. | Đã có đường vá từ trước, audit xác nhận lại mức P0. Làm việc này ĐẦU TIÊN — mọi PR sau đều xây trên nền đã vá. |
| 0.2 | **Chuẩn hóa types** (`frontend/src/types/index.ts`): xóa `COOKING` khỏi `OrderItemStatus` (chỉ `WAITING \| READY \| SERVED \| REJECTED`); thêm `Ticket` (toàn bộ món của 1 bàn), `Batch` (cùng món + cùng ghi chú + cùng trạng thái dị ứng); thêm DTO `StaffUser`, `LoginRequest`, `LoginResponse`, `KdsPinAuthRequest`, `Shift`, `AttendanceRecord`, `LeaveRequest`, `Payslip`, `TipRecord`. `OrderItem` giữ `tableId`, `allergy`, `slaDeadline` (đã có). | Route `(staff)/kds` hiện dùng type 3 trạng thái riêng (`WAITING \| COOKING \| READY`) — xóa type riêng này, dùng chung type đã chuẩn hóa. |
| 0.3 | **Sửa token KDS**: nền KDS `#F6F4F0` (dùng `--color-ops-bg`); sửa chú thích cũ ở `globals.css:15` ghi nền tối `#0B0F14`. Kiểm tra không còn chỗ nào khác tham chiếu nền tối KDS. | Xem bảng hiệu chỉnh ở mục 0. |
| 0.4 | **Auth foundation**: `useAuthStore` (Zustand) quản lý JWT (B1) + PIN session (A1, tablet KDS); API client interceptor tự gắn `Authorization: Bearer <token>`. Kèm **mock auth service** (đăng nhập giả theo đúng DTO) vì backend chưa có API auth — PIN/JWT thật chỉ kiểm tra ở server khi backend sẵn, không bao giờ chỉ kiểm tra ở trình duyệt. | B1/A1 code UI trước, nối API thật sau. |
| 0.5 | **Mock service layer**: `frontend/src/services/mock/` implement đúng interface của API client tương lai (cùng DTO ở 0.2). Các màn đọc dữ liệu qua service layer — khi backend sẵn, chỉ đổi implementation, không sửa màn. Không dùng MSW trừ khi team muốn. Dữ liệu mock lấy từ các bản nháp (6 ticket/16 phần của A3 v5, lịch ca mẫu, phiếu lương mẫu...). | Đây là quyết định kiến trúc của giai đoạn code: mock có type, không hardcode rời rạc trong từng page như demo v1. |

Xong giai đoạn 0 mới code màn đầu tiên. Definition of done: build xanh,
không còn `COOKING`, không còn token KDS lệch, mock service chạy được.

## 3. Bản đồ route (theo đề xuất của audit, theo quy ước repo)

Route group `(staff)` không hiện trên URL. A8/A10 là modal, không phải route.
A2 đã bỏ, A4 gộp vào A3.

| Màn | Route (URL) | File route |
|---|---|---|
| B1 Login | `/login` | `frontend/src/app/(staff)/login/page.tsx` |
| B2 Staff Home | `/home` | `frontend/src/app/(staff)/home/page.tsx` |
| B3 Attendance | `/attendance` | `frontend/src/app/(staff)/attendance/page.tsx` |
| B4 Verify | `/attendance/verify` | `frontend/src/app/(staff)/attendance/verify/page.tsx` |
| B5 Result | `/attendance/result` | `frontend/src/app/(staff)/attendance/result/page.tsx` |
| B6 Shifts | `/shifts` | `frontend/src/app/(staff)/shifts/page.tsx` |
| B7 Register | `/shifts/register` | `frontend/src/app/(staff)/shifts/register/page.tsx` |
| B8 Swap | `/shifts/swap` | `frontend/src/app/(staff)/shifts/swap/page.tsx` |
| B9 Leaves | `/leaves` | `frontend/src/app/(staff)/leaves/page.tsx` |
| B10 Leave new | `/leaves/new` | `frontend/src/app/(staff)/leaves/new/page.tsx` |
| B11 Payslips | `/payslips` | `frontend/src/app/(staff)/payslips/page.tsx` |
| B12 Payslip detail | `/payslips/[id]` | `frontend/src/app/(staff)/payslips/[id]/page.tsx` |
| B13 Tips | `/tips` | `frontend/src/app/(staff)/tips/page.tsx` |
| A1 KDS Login | `/kds/login` | `frontend/src/app/(staff)/kds/login/page.tsx` |
| A3 KDS Board | `/kds` | `frontend/src/app/(staff)/kds/page.tsx` (viết lại) |
| A5 Ticket Detail | Drawer trong `/kds` | component, không route riêng |
| A6 Cancel/Edit Alert | Modal trong `/kds` | component, không route riêng |
| A7 Sold-out List | `/kds/sold-out` | `frontend/src/app/(staff)/kds/sold-out/page.tsx` |
| A8 Sold-out Confirm | Modal trong `/kds/sold-out` | component, không route riêng |
| A9 Waste Log | `/kds/waste` | `frontend/src/app/(staff)/kds/waste/page.tsx` |
| A10 Waste Confirm | Modal trong `/kds/waste` | component, không route riêng |

## 4. Giai đoạn 1 — Lõi bếp KDS (3–4 buổi)

Thứ tự theo rủi ro: A3 → A1 → A5 → A6 → A7–A10.

| Màn | Việc chính | Spec (bản nháp) | Component mới | Done |
|---|---|---|---|---|
| A3 | Viết lại `(staff)/kds`: 1 hàng đợi lưới 3/2/1 cột, 1 ticket = toàn bộ món 1 bàn, 1 nút "Hoàn tất ticket" brand 48px, toggle Theo ticket / Theo mẻ nấu, chip SLA, banner dị ứng, toast + Hoàn tác **5 giây**. Nối `useKdsStore` (nhóm phẳng `OrderItem[]` → `Ticket[]`/`Batch[]`); realtime STOMP sau (mock trước). | A3 v5 (chế độ mẻ), v4 (bỏ trạm) | `KdsTicketCard`, `SlaTimer` (MM:SS, chip SLA, **không nhấp nháy**), `AllergyBanner` | Chạy được với mock; đúng 4 trạng thái; không còn `COOKING`; nền `#F6F4F0` |
| A1 | Bàn phím PIN 4 số trên tablet dùng chung; đủ 4 số mới vào; sai PIN báo inline; quên PIN → gặp Bếp trưởng/Quản lý (không tự reset); đúng → vào thẳng A3. | A1-only | `PinPad` | Vào được A3 sau khi nhập PIN (mock) |
| A5 | Drawer chi tiết ticket (tối đa 520px, 4 khu vực, footer cố định, nút "Hoàn tất ticket" + text action "Báo sự cố / Không thể chế biến", chỉ 1 nút X đóng drawer giữ nguyên trạng thái). | A5 v2 | `TicketDetailDrawer` | Mở từ card A3; hoàn tất từ drawer = hoàn tất từ card |
| A6 | Modal cảnh báo hủy/sửa phủ lên hàng đợi; ticket bị khóa nút Hoàn tất đến khi xác nhận; 2 biến thể (hủy món / sửa ghi chú, hiện Trước/Sau). | A6–A10 v2 | `OrderChangeAlert` | Khóa/mở khóa đúng; "Để sau" vẫn giữ khóa |
| A7–A8 | Danh sách hết món (đang hết + còn bán) + modal xác nhận hết món (nút danger); món trên A3 hiện badge HẾT + trạng thái "Chờ phục vụ xử lý", **không tự xóa** khỏi ticket, không gạch ngang. | A6–A10 v2 | `SoldOutList`, `SoldOutConfirmModal` | Báo hết → món vào danh sách hết + ẩn khỏi menu (mock) |
| A9–A10 | Form ghi hủy tối giản (món, số lượng tối đa theo tồn kho, lý do — "Lý do khác" bắt buộc ghi chú) + modal xác nhận (nút danger, snapshot dữ liệu, chống bấm hai lần). Chỉ Bếp trưởng (UI chặn + ghi chú backend phải kiểm tra quyền). | A6–A10 v2 | `WasteLogForm`, `WasteConfirmModal` | Ghi hủy xong trừ kho (mock) + tăng số lượt hôm nay |

## 5. Giai đoạn 2 — Staff Portal cơ bản (2 buổi)

| Màn | Việc chính | Spec | Ghi chú |
|---|---|---|---|
| B2 | Chuyển `(demo)/staff-home` → `(staff)/home`; thay dữ liệu mẫu "Minh Anh" bằng người đăng nhập thật; sửa sub-nav trỏ vòng lặp về chính nó; thêm thẻ KDS cho role bếp (dẫn sang A3). | B2 v2 | Kiểm tra `staff-home` dùng component chung nào được trước khi tái sử dụng — không copy nguyên demo. |
| B3–B5 | Chấm công 1 chạm → xác minh (quét mặt chính, PIN 4 số dự phòng, khóa sau 3 lần sai) → kết quả (giờ chấm, đúng/trễ, ca). | B3–B5 v2 | **Chặn:** cần chốt thư viện nhận diện trước (Human/MediaPipe, xem mục 0). Camera hook + khung quét mặt; liveness để production, chưa cần cho bản đầu. |

## 6. Giai đoạn 3 — Lịch ca & nghỉ phép (2 buổi)

| Màn | Việc chính | Spec |
|---|---|---|
| B6–B8 | Lịch ca 7 ngày, đăng ký ca (chờ duyệt, chặn khi hết chỗ/trùng giờ), đổi ca 2 bước (người nhận xác nhận trước → quản lý duyệt); đăng ký ca được hủy khi chờ duyệt, đổi ca không được hủy sau khi gửi. | B6–B8 v2 |
| B9–B10 | Danh sách đơn nghỉ (lọc theo trạng thái, rút đơn khi chờ duyệt) + form 3 bước (3 loại nghỉ, không chọn sẵn, bỏ người thay ca, số ngày + số ca bị ảnh hưởng, lý do tối đa 500 ký tự). | B9–B10 v2 |

Component mới: `ShiftCalendar`, `LeaveStatusBadge`.

## 7. Giai đoạn 4 — Lương, tip & đăng nhập tổng (2 buổi)

| Màn | Việc chính | Spec |
|---|---|---|
| B11–B13 | Danh sách phiếu lương theo tháng (kỳ lương + ngày thanh toán, tách trạng thái phiếu khỏi trạng thái thanh toán) + chi tiết phiếu (lương giờ/KPI/phụ cấp/khấu trừ/thực nhận, banner căn cứ tạm tính) + tip theo ngày (tách khỏi lương). | B11–B13 v2 |
| B1 | Đăng nhập số điện thoại + mật khẩu (JWT); sai mật khẩu báo inline; hết phiên hiện banner; quên mật khẩu gặp quản lý; khóa sau 3 lần sai; thành công tự chuyển sang B2. **Làm cuối cùng** vì cần API auth backend — trước đó dùng mock auth service. | B1 v3 |

Component mới: `PayslipRow`.

## 8. Quy ước làm việc

- **Nhánh:** tính năng tách từ `dev` (vd `fe/huy/kds-a3-board`); PR vào `dev`, tối thiểu 1 Approved rồi Squash and merge. Không push thẳng `dev`.
- **PR:** 1 PR / giai đoạn, commit tách theo màn (1 commit / màn, message rõ màn + việc). PR đầu tiên (giai đoạn 0) nên nhỏ để team duyệt nhanh quy ước.
- **Không sửa file trong `(demo)/`** — để nguyên làm tham chiếu; chỉ đọc. Khi route thật của 1 màn đã ship và team đồng ý thì mới xóa route demo tương ứng (quyết sau, không tự xóa).
- **Không hardcode:** không tài khoản demo, không token/password, không tên mẫu ("Minh Anh", "Huy") trong code thật — dữ liệu mẫu chỉ nằm trong `services/mock/`.
- **Token:** không phát sinh màu/font mới; mọi màn dùng token đã khóa; ngoại lệ duy nhất đã ghi chú: card đăng nhập B1 bo 16px.
- **Trạng thái:** mỗi màn có đủ 3 trạng thái (có dữ liệu / rỗng / lỗi); không nút chết (không link nào trỏ về chính nó).
- **Thiết bị:** KDS test trên tablet đứng cách 1–2 m (chữ bàn, tên món, nút đọc được từ xa); Staff Portal test trên điện thoại cầm một tay (bottom nav không bị bàn phím che).

## 9. Rủi ro & điểm chặn (không thuộc plan code, cần song song)

| # | Vấn đề | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|
| 1 | Backend chỉ có 2 controller (Health, Dish). Chưa có API auth, chấm công, ca, nghỉ, lương, STOMP thật. | B1, B3–B5, realtime A3/A6 không nối thật được. | UI đi trước với mock service (giai đoạn 0.5); backend làm theo bảng Sprint 0. Không đợi backend mới code UI. |
| 2 | 3 quyết định Sprint 0 còn mở: tên topic (frontend đã dùng `/topic/kds/orders` — backend theo đúng), trạng thái món (UI dùng 4 trạng thái, backend cần xác nhận enum/gộp), security trước endpoint nghiệp vụ. | Nối realtime + API sau này lệch nhau nếu không chốt. | Nhắn team chốt trước khi nối API thật (bản nháp nhắn team đã có từ 2026-10-31, chưa gửi). |
| 3 | Supabase: project đã tạo (2026-11-01) nhưng chưa chạy migration, chưa kiểm chứng nối backend. | Chưa có DB thật cho API. | User chọn cách chạy local (`read -s`) rồi kiểm chứng; không gửi mật khẩu DB qua chat. |
| 4 | B4 cần thư viện nhận diện khuôn mặt + màn đăng ký khuôn mặt phía quản lý (chưa có trong inventory). | B4 không code xong được nếu chưa chốt thư viện. | Chốt Human/MediaPipe (miễn phí, chạy trên trình duyệt) trước giai đoạn 2; màn đăng ký mặt thêm vào module quản lý (ngoài 23 màn). |
| 5 | Các câu hỏi nghiệp vụ còn mở trong `Decisions_Locked.md` (Bếp trưởng vắng mặt thì ai duyệt; "hết món" vs "hết nguyên liệu"; ghi hủy trừ kho nào; tip chia thế nào; kỳ lương ngày mấy...) | Code theo giả định trong nháp; đổi giả định = sửa code. | Code theo đúng giả định đã ghi trong từng bản nháp; khi team chốt khác thì sửa theo — không tự đoán lại. |

## 10. Definition of done chung

- Route chạy được (`pnpm dev`, vào đúng URL, không lỗi build).
- Đúng token đã khóa, đúng spec bản nháp đã duyệt (đối chiếu file nháp).
- Đủ 3 trạng thái (có dữ liệu / rỗng / lỗi); không nút chết.
- Không dữ liệu hardcode ngoài `services/mock/`; không tài khoản demo.
- KDS đọc được từ xa 1–2 m; Staff Portal dùng được một tay.
- PR vào `dev` có 1 Approved, squash merge; working tree sạch sau merge.

## 11. Ước tính

- Giai đoạn 0: 0,5–1 buổi. Giai đoạn 1 (KDS): 3–4 buổi. Giai đoạn 2: 2 buổi. Giai đoạn 3: 2 buổi. Giai đoạn 4: 2 buổi.
- Tổng: khoảng 8–10 buổi làm bán thời gian (ước tính, có thể co giãn). Không tính thời gian chờ backend và chờ team chốt quyết định.
