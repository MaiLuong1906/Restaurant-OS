# Plan UI-UX frontend — Staff chung + KDS đầu bếp (Restaurant OS)

> Phạm vi: CHỈ frontend, CHỈ thiết kế UI-UX trước. Chưa code tính năng mới, chưa nối API thật, chưa đụng backend, POS, dashboard quản lý, màn khách.
> Cơ sở đã kiểm chứng trên nhánh `dev` (ngày 2026-11-03, sau khi fetch): head `ae66277` — đã merge PR #2, tức base v6 + KDS demo v7/v7.1/v7.2 đã nằm trong `dev`.
> Phần được giao, theo inventory: Staff Portal B1–B13 (dùng chung cho đầu bếp và nhân viên) + KDS A1–A10. Tổng 23 màn.

## 0. Điểm xuất phát trên `dev` — đọc trước khi vẽ, đừng vẽ lại từ số 0

Những thứ đã có sẵn, phải tái dùng chứ không thiết kế mới:

- Design system v6 trong `frontend/src/app/globals.css`: 1 đỏ brand `#8C1D2C`, 1 đỏ cảnh báo `#D14B3A`, nền ops `#F6F4F0`, nền giấy `#F5F2EA`, font Be Vietnam Pro cho toàn bộ app vận hành (Playfair chỉ dùng cho tiêu đề website khách), bo góc 8px.
- Component UI sẵn: `Button, Card, Badge, Modal, BottomSheet, Tabs, Input, Dialog, DropdownMenu, TopBar`.
- Layout sẵn: `StaffLayout` (mobile 1 cột, bottom nav 4 mục, desktop mở tới 2xl) và `KdsLayout` (nền sáng v7.1, slot trạm / chuông / đồng hồ).
- Store KDS sẵn: `useKdsStore` — REST `GET /kds/items/active`, `PATCH /kds/items/{id}/status`, STOMP `/topic/kds/orders` (`CREATE_ITEM`, `UPDATE_STATUS`), cập nhật optimistic + rollback khi backend từ chối.
- Type sẵn: `OrderItem` có 5 trạng thái `WAITING | COOKING | READY | SERVED | REJECTED` và các trường `tableNo, stationId, allergy, slaDeadline, modifiers, notes`.

Hai lệch phải ghi rõ trong thiết kế, không được âm thầm chọn một bên:

1. **KDS thật vs KDS demo đang khác nhau.** Route thật `(staff)/kds/page.tsx` vẫn là bản cũ: nền tối `#0B0F14`, dữ liệu hardcode 4 món, chỉ 3 trạng thái, không dùng `KdsLayout` hay `useKdsStore`, header ghi “STOMP: Connected” và “REALTIME <50ms” nhưng đó là chữ tĩnh. Trong khi demo `(demo)/kds-board` đã là v7.1: nền sáng, 3 cột Chờ nấu / Đang nấu / Xong, timer đếm trực tiếp MM:SS, SLA 15 phút (bình thường <70%, sắp trễ 70–100%, quá SLA >100%), banner dị ứng, gộp theo bàn hoặc theo món, nút ≥64px, Hoàn tác 10 giây, Hết món 86, chuông demo. **Hướng thiết kế: lấy demo v7.1 làm chuẩn đích, route thật sẽ được viết lại theo chuẩn đó ở giai đoạn code sau — giai đoạn UI-UX này không sửa route thật.**
2. **Chú thích trong `globals.css` còn ghi KDS là ngoại lệ nền tối**, trong khi v7.1 đã chuyển sang nền sáng. Khi chốt thiết kế, ghi quyết định “KDS nền sáng” vào biên bản chốt, để giai đoạn code sau sửa chú thích cho khớp, tránh người sau đọc code cũ rồi vẽ lại nền tối.
3. **Staff demo chưa phải luồng thật.** `(demo)/staff-home` mới có thẻ ca hôm nay, thao tác nhanh, phiếu lương tạm tính, quỹ phép — nhưng bottom nav 4 mục đều trỏ về `/staff-home`, chưa có route thật nào cho chấm công, lịch ca, xin nghỉ, lương, tip. Thiết kế phải vẽ đủ luồng, không được lấy 4 nút placeholder đó làm xong.
4. **Đừng nhầm Staff Portal với Staff Management.** `(demo)/staff-management` là màn của Quản lý (bảng nhân viên, lịch ca tuần, chốt ca), không phải màn của nhân viên. Phần của bạn là góc nhìn nhân viên / đầu bếp tự phục vụ mình, không phải góc nhìn quản lý.

## Giai đoạn 0 — Khóa phạm vi và audit (1 buổi)

Mục tiêu: trước khi vẽ một màn nào, phải biết màn nào đã có khung, màn nào chưa có gì, và câu hỏi nào cần team trả lời.

1. Đối chiếu inventory với `dev`, lập bảng 23 màn, mỗi màn ghi: đã có demo / đã có route thật / chưa có gì, thiết bị chính, nguồn (use case / wireframe cũ).
   - KDS: A1 PIN Login, A2 Station Select, A3 KDS Main Board, A4 Batch Cooking View, A5 Item Status Update, A6 Order Cancel / Edit Alert, A7 Sold-out List, A8 Sold-out Confirm, A9 Waste Log (chỉ Bếp trưởng), A10 Waste Confirm.
   - Staff: B1 Login (JWT), B2 Staff Home, B3 Attendance, B4 Geofence Verify, B5 Attendance Result, B6 Shift Schedule, B7 Shift Register, B8 Shift Swap, B9 Leave List, B10 Leave Request Form, B11 Payslip List, B12 Payslip Detail, B13 Tip Detail.
2. Ghi 6 câu hỏi mở, thiết kế theo giả định tạm và đánh dấu “chờ chốt”, không tự chốt thay team:
   - KDS vào bằng PIN (A1) hay tài khoản nhân viên (B1)? Đầu bếp dùng chung tablet thì PIN hợp lý, nhưng chuyển sang Staff Portal trên điện thoại riêng thì dùng JWT — hai luồng này gặp nhau ở đâu?
   - Chấm công dùng PIN / QR cũ, hay Geofence + FaceID như sơ đồ use case mới gửi? B3–B5 vẽ theo luồng nào?
   - Bếp trưởng vắng mặt thì ai duyệt Waste Log A9 và Hết món A7–A8?
   - Trạng thái món dùng 3 trạng thái của route KDS cũ, hay 5 trạng thái của type hiện tại (thêm SERVED / REJECTED)? Thiết kế A5 phải thể hiện đủ 5, vì type đã chốt 5.
   - Topic realtime dùng `/topic/kds/orders` như code `useKdsStore` đang dùng, hay tên khác? Thiết kế không phụ thuộc tên topic, nhưng ghi chú để giai đoạn code khỏi vẽ lại.
   - Khu vực / trạm bếp thật của quán là gì (Bếp Nướng, Bếp Lẩu trong demo chỉ là ví dụ)? A2 và bộ lọc trạm trên A3 phải chờ tên thật.
3. Kết quả chốt của giai đoạn 0: 1 bảng mapping 23 màn + 1 danh sách giả định tạm. Chưa vẽ wireframe ở đây.

## Giai đoạn 1 — Luồng UX và kiến trúc thông tin (1–2 buổi)

Mục tiêu: vẽ luồng trước, vẽ màn sau. Vẽ màn trước khi có luồng là nguyên nhân chính gây ra nav placeholder như demo hiện tại.

1. Vẽ 4 luồng chính, mỗi luồng ghi điểm bắt đầu, điểm kết thúc, và nhánh lỗi:
   - **Luồng nhân viên:** B1 Login → B2 Home → (B3 Chấm công → B4 Geofence → B5 Kết quả) / (B6 Lịch ca → B7 Đăng ký ca → B8 Đổi ca) / (B9 Danh sách nghỉ → B10 Form xin nghỉ) / (B11 Phiếu lương → B12 Chi tiết → B13 Tip).
   - **Luồng đầu bếp vào ca:** A1 PIN → A2 Chọn trạm → A3 Board chính. Đầu bếp cũng là nhân viên nên từ A3 phải có đường sang Staff Portal (xem ca, chấm công) và ngược lại — đây là điểm nối “staff chung”, không được thiết kế KDS và Staff Portal thành hai app rời.
   - **Luồng xử lý món trên KDS:** A3 → A5 Cập nhật trạng thái (Nhận món → Báo xong, kèm Hoàn tác 10 giây) → A6 Cảnh báo hủy / sửa đơn → A7–A8 Hết món → A9–A10 Ghi hủy (khóa theo vai trò Bếp trưởng).
   - **Luồng ngoại lệ:** mất kết nối STOMP (hiện banner, giữ dữ liệu cũ, tự sync lại bằng REST khi nối lại — đúng hành vi `useKdsStore` đã có), món quá SLA, món có dị ứng, hết món giữa ca, đổi ca giữa chừng.
2. Chốt kiến trúc nav cho Staff Portal: bottom nav 4 mục hiện tại (Trang chủ / Lịch ca / Lương & Tip / Cá nhân) có đủ chứa 13 màn B không? Nếu không, ghi rõ màn nào nằm trong tab nào, màn nào chỉ vào được từ Home hoặc từ chi tiết (ví dụ B5 chỉ xuất hiện sau B3, B12 chỉ từ B11, B13 chỉ từ B11 hoặc B2). Không thêm tab thứ 5 chỉ vì “cho đủ”.
3. Chốt kiến trúc nav cho KDS: header gồm gì (tên trạm, đồng hồ, chuông, số món trễ), bộ lọc trạm, chế độ gộp theo bàn / theo món — lấy từ demo v7.1 làm khung, chỉ bổ sung đường vào A1, A2, A6, A7, A9.
4. Kết quả: 4 sơ đồ luồng + 1 bảng map nav → màn. Tiêu chí xong: một người ngoài team đọc luồng cũng đi từ Login tới xong việc mà không bị kẹt ở màn placeholder.

## Giai đoạn 2 — Wireframe low-fi, theo thứ tự rủi ro (4–5 buổi)

Nguyên tắc: vẽ khung xám, chữ thật, số liệu ví dụ, không tô màu, không chọn ảnh. Mỗi màn ghi đủ: nội dung theo thứ tự đọc, nút chính là nút nào, trạng thái rỗng / đang tải / lỗi trông ra sao.

Thứ tự vẽ — KDS trước vì rủi ro đọc sai trong bếp cao nhất, Staff sau:

1. **A3 KDS Main Board (P0, vẽ đầu tiên).** Đây là màn khó nhất: đọc từ xa 1–2 m, liếc 2 giây phải thấy món trễ. Giữ nguyên thứ tự đọc của demo v7.1: banner dị ứng → số bàn lớn → timer MM:SS → “SL × tên món” → ghi chú → thanh SLA → nút ≥64px. Vẽ đủ 3 cột, trạng thái SLA bằng viền + icon + chữ chứ không chỉ màu, cột Xong đếm thời gian nguội (vàng sau 3 phút, đỏ sau 5 phút). Vẽ thêm bản mobile của A3 (inventory yêu cầu màn chính có thêm 1 bản ở cỡ còn lại).
2. **A1 PIN Login + A2 Station Select (P0).** A1: bàn phím số lớn, sai PIN thì báo sao, quên PIN thì gặp ai; A2: chọn 1 trạm hay tất cả trạm, đổi trạm giữa ca có mất board đang xem không.
3. **A5 Item Status Update (P0).** Thực chất A5 là hành vi trên từng ticket của A3 (chạm card để nhận món, vuốt / bấm để báo xong), nên vẽ A5 như một lớp tương tác phủ lên A3, không vẽ thành màn riêng rời rạc. Ghi rõ: nút nào ở cột nào, Hoàn tác 10 giây ở đâu, trạng thái SERVED / REJECTED đi đường nào (phục vụ xác nhận hay bếp từ chối).
4. **A4 Batch Cooking View (P1).** Chế độ “Nhóm theo món” của demo v7.1 chính là A4: badge phải ghi rõ “Nấu theo lô · gộp N bàn”, không ghi “Lô xN” khó hiểu. Vẽ cách chuyển qua lại giữa gộp theo bàn và gộp theo món mà không mất vị trí đang xem.
5. **A6 Cancel / Edit Alert + A7–A8 Sold-out (P1).** A6: cảnh báo phải chặn được thao tác nhầm (món đang nấu mà đơn bị hủy thì sao), nút xác nhận khác màu nút hủy. A7: danh sách hết món, A8: xác nhận hết món trước khi công bố cho khách / POS — vẽ rõ ai được bấm và bấm xong thì món trên A3 đổi ra sao (gạch ngang + badge HẾT).
6. **A9–A10 Waste Log (P2, khóa vai trò).** Chỉ Bếp trưởng thấy. Vẽ form ghi hủy tối giản (món, số lượng, lý do) và màn xác nhận; nhân viên thường vào nhầm thì thấy gì.
7. **B2 Staff Home (P0 của nhóm Staff).** Lấy demo hiện tại làm khung nhưng sửa lại: thẻ ca hôm nay (giờ ca, khu vực, bàn phụ trách, lưu ý dị ứng), thao tác nhanh phải dẫn tới màn thật (không phải nút chết), phiếu lương tạm tính và quỹ phép chỉ là tóm tắt dẫn sang B11 / B9. Vẽ thêm bản laptop của B2.
8. **B3–B5 Attendance (P1).** B3: nút chấm công lớn, một chạm; B4: xác minh vị trí (nếu chốt Geofence) thì khi ngoài vùng cho phép sẽ báo sao, có cho chấm tay kèm lý do không; B5: kết quả phải ghi giờ chấm, đúng / trễ bao nhiêu phút, ca nào.
9. **B6–B8 Schedule (P1).** B6: lịch ca theo tuần, xem được ca của mình và ca trống; B7: đăng ký ca (chọn ngày, ca, gửi chờ duyệt); B8: đổi ca (chọn người đổi, lý do, trạng thái chờ duyệt / đã duyệt / bị từ chối).
10. **B9–B10 Leave (P2).** B9: danh sách đơn nghỉ kèm trạng thái duyệt; B10: form tối giản (loại nghỉ, từ ngày, tới ngày, lý do, người thay ca nếu có).
11. **B11–B13 Payslip & Tip (P2).** B11: danh sách phiếu lương theo tháng; B12: chi tiết (lương giờ, KPI, phụ cấp, khấu trừ, thực nhận); B13: tip theo ca / theo tháng, tách khỏi lương để không nhầm.
12. **B1 Login (P1, vẽ cuối dù đứng đầu luồng).** Vẽ sau khi đã biết Home trông ra sao, để form login không lệch tone. Ghi rõ: đăng nhập bằng gì (JWT theo inventory), sai mật khẩu / hết phiên thì sao, và đường từ B1 sang A1 cho đầu bếp dùng tablet chung.

Tiêu chí xong giai đoạn 2: đủ 23 wireframe, mỗi màn có đủ 3 trạng thái (có dữ liệu / rỗng / lỗi), không còn nút chết trỏ về chính nó.

## Giai đoạn 3 — UI high-fi và prototype bấm được (3–4 buổi)

1. Áp token v6 lên toàn bộ wireframe, không phát sinh màu / font mới. Ngoại lệ duy nhất cần ghi chú: KDS giữ quy tắc đọc xa (chữ bàn 30px, tên món 24px, ghi chú 18px, nút ≥64px như demo v7.1), còn Staff Portal dùng cỡ chữ và nút chuẩn app mobile.
2. Rà soát component: đối chiếu với component UI đã có, lập danh sách component mới chỉ thiết kế ở giai đoạn này, chưa code: `KdsTicketCard, SlaTimer, AllergyBanner, StationTabs, ShiftCalendar, PayslipRow, LeaveStatusBadge`… Mỗi component ghi các biến thể (trạng thái SLA, có / không dị ứng, ca chờ duyệt / đã duyệt…).
3. Nối prototype bấm được theo đúng 4 luồng giai đoạn 1, test trên thiết bị thật: KDS mở trên tablet đứng cách 1–2 m, Staff mở trên điện thoại cầm một tay. Sửa những chỗ: chữ nhỏ không đọc được từ xa, nút chạm trượt, bottom nav bị bàn phím che, timer không tabular-nums gây nhảy số.
4. Kiểm tra tiếp cận tối thiểu: tương phản chữ trên nền sáng KDS, trạng thái không chỉ dùng màu (luôn kèm icon + chữ), nút hủy / ghi hủy khác hẳn nút chính, tránh bấm nhầm trong bếp.

## Giai đoạn 4 — Review, chốt và bàn giao thiết kế (1–2 buổi)

1. Review nội bộ theo checklist: đủ 23 màn? đủ luồng? còn nút chết không? token có lệch không? trạng thái rỗng / lỗi đã vẽ chưa? vai trò Bếp trưởng đã khóa đúng chỗ chưa?
2. Review với người dùng thật nếu có thể: 1 đầu bếp xem A3 từ xa, 1 nhân viên đi hết luồng chấm công → xem lịch → xin nghỉ trên điện thoại. Ghi lại 5–10 điểm sửa, sửa trong file thiết kế, không sửa trực tiếp code `dev`.
3. Gói bàn giao (chỉ thiết kế, chưa phải code): file thiết kế (Figma / Stitch tùy team chốt — lưu ý: Stitch chỉ lấy vibe, Figma chỉ là snapshot, không phải pipeline tự động), bảng spec từng màn (bố cục, trạng thái, tương tác, trường dữ liệu lấy từ `types/index.ts`), danh sách component mới, và danh sách câu hỏi mở còn lại từ giai đoạn 0.
4. Ghi rõ điểm dừng của giai đoạn UI-UX: khi team duyệt gói bàn giao này thì mới sang giai đoạn code (viết lại route KDS thật theo chuẩn demo v7.1, dựng route Staff thật từ demo `staff-home`, nối `useKdsStore` và API khi backend sẵn). Giai đoạn code là plan riêng, không gộp vào plan này.

## Những gì KHÔNG nằm trong plan này (để khỏi loãng phạm vi)

- Backend, API bàn trống / đặt bàn, STOMP topic thật, Supabase, JWT / PIN phía server.
- POS thu ngân, dashboard quản lý, màn khách, AI chat đặt bàn — đó là các phần khác, chỉ tham chiếu khi cần đường nối (ví dụ hết món trên KDS ảnh hưởng tới menu khách ra sao thì ghi chú, không thiết kế luôn).
- Tối ưu hiệu năng, dark mode ca tối, Three.js — đã có quyết định trước đó là không làm trong base này.

## Tổng thời gian ước tính (làm bán thời gian, có thể co giãn)

- Giai đoạn 0: 1 buổi. Giai đoạn 1: 1–2 buổi. Giai đoạn 2: 4–5 buổi. Giai đoạn 3: 3–4 buổi. Giai đoạn 4: 1–2 buổi.
- Tổng: khoảng 10–14 buổi làm việc tập trung. Nếu chỉ có ít buổi hơn, cắt theo thứ tự: giữ A3, A1–A2, A5, B2, B3–B5; lùi A9–A10, B11–B13 sang đợt sau — không cắt giai đoạn 0 và 1 để lấy thời gian vẽ, vì đó là chỗ chống nút chết và luồng kẹt.
