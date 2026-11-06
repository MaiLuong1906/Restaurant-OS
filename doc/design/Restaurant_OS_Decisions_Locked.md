# Restaurant OS — Quyết định thiết kế đã chốt (Staff Portal + KDS)

> Bản tổng hợp từ các quyết định của Xuân Huy trong chat ngày 2026-11-04 và
> rạng sáng 2026-11-05. Chỉ ghi những gì user đã nói rõ là chốt/duyệt.
> Những mục mới chỉ giao nháp, chưa được duyệt tường minh, nằm ở mục
> "Chưa chốt" cuối file — không được tính là đã chốt.
> File này không sửa repo, plan gốc, hay bất kỳ bản nháp A/B nào.

## Đã chốt

### 1. Giai đoạn 0 đóng — 2026-11-04
- Bảng đối chiếu 23 màn trên dev head `ae66277` được chốt, không sửa.
- Kết quả bảng: 1 màn chuẩn là A3 (demo kds-board v7.1), 5 màn demo một phần
  (A4, A5, A7/A8, B2), 17 màn chưa có route.

### 2. Minimal Operations UI cho KDS — A3 v3 duyệt 2026-11-05
- Một hàng đợi ticket duy nhất, dạng lưới 3 cột desktop / 2 cột tablet ngang /
  1 cột tablet dọc (số cột của lưới, không phải cột trạng thái Kanban).
- Header 56px: chỉ tên KDS + trạng thái kết nối + đồng hồ (v4: không tên trạm).
- Thanh thống kê chỉ 4 số: ticket đang mở / quá SLA / món cần làm / vừa hoàn tất.
- Mỗi ticket chỉ 1 nút "Hoàn tất ticket": brand `#8C1D2C`, chữ trắng, cao 48px.
- SLA tính từ khi ticket đến bếp; không nút Bắt đầu nấu (chỉ thêm lại nếu cần
  tách thống kê thời gian chờ và thời gian nấu).
- Thứ tự card cố định: bàn 24px + chip SLA 12px → thời gian chờ 15px + mã
  ticket → banner dị ứng ~38px → món 18px → ghi chú 14px → nút.
- Sắp xếp: dị ứng → quá SLA → sắp đến hạn → theo thời gian nhận.
- Bỏ hẳn: mã 86 trên từng món, thanh SLA trên mọi card, phần trăm SLA,
  nhấp nháy, ảnh món trên card, tab/chuyển trạm, nút món mới demo.
- Hoàn tất: ticket biến mất, toast kèm nút Hoàn tác 5 giây, không modal.
- Icon một bộ outline Lucide duy nhất; spacing bội số 4px.

### 3. Bỏ trạm — chốt chắc chắn 2026-11-05
- Không còn khái niệm trạm trong luồng KDS: không màn A2, không dropdown
  chuyển trạm, header không tên trạm.
- A1 xong vào thẳng A3. Một ticket là toàn bộ món của một bàn.
- Chỉ xem lại khái niệm trạm nếu quán mở rộng nhiều bếp sau này.

### 4. Design System khóa chung — 2026-11-05
- Nền web/khách `#F5F2EA`, nền vận hành `#F6F4F0`, card trắng, chữ chính
  `#141210`, chữ vận hành `#2B2118`, chữ phụ `#7A6A58`/`#6F6659`,
  viền `#E9E4DC`, brand `#8C1D2C`, danger `#D14B3A`.
- Trạng thái bàn (POS/KDS/dashboard): trống `#5F7F5E`, đang dùng `#D9A441`,
  quá giờ `#D14B3A`, đang dọn `#9A8F80` — không dùng màu trạng thái bàn
  làm màu nút.
- Nút Bắt đầu nấu và Hoàn tất đều dùng brand, không dùng xanh dương/xanh lá
  làm màu hành động chính.

### 5. Trạng thái món: 4 trạng thái, bỏ COOKING — chốt 2026-11-05
- `WAITING` (hệ thống đặt khi đơn vào bếp, mốc SLA) → `READY` (đầu bếp đặt
  bằng nút Hoàn tất) → `SERVED` (phục vụ thuộc role Nhân viên đặt khi giao món)
  + nhánh `REJECTED` (đầu bếp đặt bằng đường ngoại lệ trong chi tiết).
- `COOKING` bỏ khỏi hợp đồng UI vì mô hình một nút không có gì chuyển sang
  trạng thái này. Backend giữ enum tương thích hay gộp vào `WAITING` thì quyết
  lúc code; nếu cần thống kê riêng thời gian nấu thì `COOKING` quay lại cùng
  nút Bắt đầu nấu.
- Đầu bếp ngày thường chỉ 1 thao tác (Hoàn tất → READY); `WAITING` và `SERVED`
  là 0 thao tác đối với đầu bếp. Các trạng thái không hiện lên KDS mà hiện
  trong giao diện của phục vụ/POS.

### 6. Gom mẻ nấu (Smart Batch Cooking) — chốt hướng làm 2026-11-05
- Một mẻ = cùng món + cùng ghi chú + cùng trạng thái dị ứng, từ nhiều bàn.
- Mẻ dị ứng không bao giờ gộp với mẻ không dị ứng. SLA của mẻ = ticket gấp
  nhất trong mẻ.
- Hoàn tất mẻ → món đó READY ở mọi bàn trong mẻ; ticket READY khi đủ món
  (hoặc bấm Hoàn tất ticket).
- Chế độ xem: toggle "Theo ticket / Theo mẻ nấu" ở đầu hàng đợi; user chọn
  làm trước chế độ mẻ ở hàng đợi (bản A3 v5).

### 7. Nguyên tắc Stitch — chốt 2026-11-01 (nhắc lại vì còn hiệu lực)
- Stitch chỉ lấy vibe (theme + màn hero). Wireframe + bảng inventory làm spec
  cấu trúc; code mới là execution. Figma chỉ là snapshot tùy chọn.

### 8. B2 v2 theo UX Audit + 3 quyết định nghiệp vụ — chốt tối 2026-11-05
- B2 Staff Home v2 duyệt xong (theo UX Audit 7/10: bỏ viền đỏ KDS, cảnh báo
  dị ứng thành khu vực riêng, làm rõ nhãn số liệu, xóa nội dung nội bộ khỏi UI).
- (1) Ưu tiên của đầu bếp: KDS là công việc chính, Dashboard chỉ là màn
  tổng quan (thứ tự B2: Ca → KDS → Cảnh báo lên đầu).
- (2) Cảnh báo dị ứng hiện cho tất cả nhân viên bếp có liên quan.
- (3) Dashboard dùng chung: chung layout, khu vực nghiệp vụ khác nhau theo
  role (đầu bếp có thẻ KDS; phục vụ thay bằng thẻ công việc của mình).

### 9. B3–B5 chấm công: quét mặt chính, PIN dự phòng — chốt rạng sáng 2026-11-06
- Chỉ làm UI trước (theo plan frontend-only, UI-UX trước): không nối API,
  không truy cập camera thật.
- Luồng: B3 chấm công một chạm → B4 xác minh bằng quét mặt → B5 kết quả
  (giờ chấm + đúng/trễ + ca + cách xác minh đã dùng). Quét mặt thất bại thì
  nhập mã PIN 4 số thay thế (phím cao 64px như A1). Nháp v1 đã giao:
  Restaurant_OS_B3_B5_Attendance_DRAFT.html.
- B4 ở v1 có hàng kiểm tra vị trí theo tên Geofence Verify trong inventory —
  đã bỏ hẳn ở v2, xem mục 10.

### 10. B3–B5 v2 theo UX Audit — chốt rạng sáng 2026-11-06
- Geofence bỏ hẳn (audit khuyến nghị giữ nếu nhà hàng yêu cầu chấm tại
  địa điểm — user chọn bỏ). Nhánh ngoài vùng không còn.
- PIN chấm công tách riêng khỏi PIN KDS (A1). Quét thất bại 1 lần là hiện
  nút PIN; nhập sai hiện số lần còn lại, sai 3 lần thì khóa mã PIN — quy tắc
  3 lần đã chốt tối 2026-11-06 (còn mở thời gian khóa: đến khi quản lý mở
  hay tự mở sau X phút).
- Đăng ký khuôn mặt: quản lý đăng ký cho nhân viên (không tự đăng ký).
  Màn đăng ký thuộc phía quản lý, ngoài phạm vi B3–B5, chưa vẽ.
- B3 có giờ hiện tại + trạng thái "Đã vào ca lúc 07:58" chống chấm trùng;
  B5 có thêm trạng thái đã vào ca và lỗi kết nối. Nháp đã giao:
  Restaurant_OS_B3_B5_Attendance_v2_DRAFT.html (v1 giữ nguyên).
- **B3–B5 v2 duyệt xong tối 2026-11-06.** Bước tiếp theo theo plan là
  B6–B8 (lịch ca / đăng ký ca / đổi ca).

### 11. B6–B8: 4 quyết định nghiệp vụ — chốt rạng sáng 2026-11-06 (theo ảnh chốt của user)
- Ca trống: quản lý đăng thủ công (không tự sinh khi thiếu nhân sự).
- Đổi ca: người nhận xác nhận trước, sau đó quản lý duyệt (luồng 2 bước).
- Hủy yêu cầu đang chờ duyệt: tùy loại yêu cầu — đã xác nhận tối
  2026-11-06: đăng ký ca được hủy khi đang chờ duyệt; đổi ca không được hủy
  sau khi gửi, muốn hủy thì gặp quản lý.
- Đăng ký ca: luôn cần quản lý duyệt (không tự động xác nhận dù còn chỗ).
- **B6–B8 v2 duyệt xong tối 2026-11-06.** Bước tiếp theo theo plan là
  B9–B10 (xin nghỉ).

### 12. B9–B10 v2 theo review — chốt rạng sáng 2026-11-06
- Giữ 3 loại nghỉ (Phép năm/Nghỉ ốm/Việc riêng) + form có cấu trúc; không làm
  thành email tự do.
- Không chọn sẵn loại nghỉ; chỉ hiện thông tin quỹ phép khi chọn Phép năm.
- Người thay ca: bỏ khỏi form B10 (quản lý phân bổ lại nhân sự) — khác với
  đổi ca B8 (người nhận xác nhận trước).
- Đơn chờ duyệt được rút (hủy) — theo khuyến nghị trong review.
- Form hiện cả số ngày nghỉ dự kiến và số ca bị ảnh hưởng (tính từ lịch ca
  mẫu 2 tuần); quỹ phép sau khi duyệt chỉ hiện với phép năm.
- Lý do: textarea ngắn, tối đa 500 ký tự, không bắt buộc viết dài; nghỉ ốm
  không bắt buộc cung cấp chẩn đoán.
- Nháp đã giao: Restaurant_OS_B9_B10_Leave_v2_DRAFT.html (v1 giữ nguyên).

### 13. B11–B13 Phiếu lương & Tip — nháp đã giao rạng sáng 2026-11-06
- B11: danh sách phiếu lương theo tháng (thực nhận + trạng thái "Tạm tính" /
  "Đã chốt") + thẻ tip tháng 11 dẫn sang B13.
- B12: chi tiết phiếu (lương giờ, thưởng KPI, phụ cấp ăn ca, tổng thu nhập;
  BHXH, tạm ứng, tổng khấu trừ; thực nhận). Tháng 11 "Tạm tính" có banner
  cảnh báo tháng chưa kết thúc.
- B13: tip theo ngày (02–05/11) + tổng các tháng trước; tip tách riêng khỏi
  lương, không cộng vào phiếu lương.
- Số liệu khớp B2 v2: lương tháng 11 thực nhận 4.250.000đ, tip tháng 11
  320.000đ tính đến 05/11 (95.000 + 85.000 + 70.000 + 70.000).
- Nháp đã giao: Restaurant_OS_B11_B13_Payslip_Tip_DRAFT.html.
- **B11–B13 v2 theo review** (rạng sáng 2026-11-06):
  Restaurant_OS_B11_B13_Payslip_Tip_v2_DRAFT.html (v1 giữ nguyên) — thêm kỳ
  lương + ngày thanh toán ở B11; tách trạng thái phiếu (Tạm tính/Đã chốt)
  khỏi trạng thái thanh toán (Dự kiến trả/Đã thanh toán) + card "Thanh toán"
  ở B12; banner ghi rõ căn cứ tính tạm tính (theo lịch ca đã xếp cả tháng);
  chip trạng thái có nền nhạt; trạng thái trả tip ở B13 ("Chưa thanh toán —
  dự kiến trả cùng kỳ lương"); ghi chú tip độc lập với phiếu lương; các
  tháng trước ở B13 chỉ đọc; laptop nới lên 720px; nút tháng có aria-label.
  5 câu hỏi nghiệp vụ trong review vẫn mở (thực nhận/tổng thu nhập; tạm
  tính theo giờ đã làm hay lịch đã xếp; cách chia tip; tip trả cùng kỳ lương
  hay riêng; có cần tải PDF không) — nháp chỉ ghi rõ giả định đang dùng,
  không tự chốt thay team.

### 14. B1 Login — nháp đã giao rạng sáng 2026-11-06
- B1 vẽ cuối cùng theo plan, khớp tone với B2 (Home).
- Đăng nhập bằng số điện thoại + mật khẩu (JWT theo inventory); sai mật khẩu
  báo inline; hết phiên hiện banner đăng nhập lại; quên mật khẩu chỉ gặp
  quản lý (cùng quy tắc với quên PIN A1/B4).
- Đường B1 → A1 cho đầu bếp dùng tablet chung (link sang nháp A1);
  B1 → B2 sau khi đăng nhập thành công (link sang nháp B2 v2).
- Tài khoản thử trong nháp: 0901234567 / 123456 → chào "Huy" (khớp B2 v2).
- Nháp đã giao: Restaurant_OS_B1_Login_DRAFT.html.
- **B1 v2 theo review "Premium Hospitality"** (rạng sáng 2026-11-06):
  Restaurant_OS_B1_Login_v2_DRAFT.html (v1 giữ nguyên) — laptop nền ảnh
  nhà hàng thật full màn hình (đã nhúng base64, 1200×655, ~73KB) + blur 4px
  trên lớp riêng + overlay gradient tối/đỏ nâu; branding trái ("Welcome to
  Restaurant OS" / "Your workspace. Your restaurant. Your team." / dòng
  tiếng Việt), form phải card trắng bo 16px (ngoại lệ đã ghi chú — riêng màn
  chào đón), rộng tối đa 420px; điện thoại giữ nền #F6F4F0 tối giản.
  Tiêu đề form "Chào mừng trở lại"; spinner khi đang xác thực; khóa tài
  khoản tạm thời sau 3 lần sai (cùng ngưỡng PIN A1/B4) + báo số lần thử còn
  lại; dòng hỗ trợ "Cần hỗ trợ đăng nhập? Liên hệ quản lý."; đăng nhập
  thành công tự chuyển sang B2 sau ~1,5 giây (vẫn giữ nút "Vào trang chủ").
- **B1 v3 theo ý user** (rạng sáng 2026-11-06):
  Restaurant_OS_B1_Login_v3_DRAFT.html (v1/v2 giữ nguyên) — điện thoại cũng
  dùng nền ảnh như laptop (review khuyên không dùng trên điện thoại vì tốc
  độ/tập trung, nhưng user muốn bớt chán nên làm theo ý user); overlay trên
  điện thoại đậm hơn (gradient dọc 62%/52%/58%) để giữ độ rõ; chữ brand/
  link/hỗ trợ chuyển sang trắng trên ảnh ở cả 2 bản; luồng đăng nhập giữ
  nguyên như v2.
- **B1 v3 duyệt xong tối 2026-11-06** (nền ảnh cả điện thoại đã chốt theo
  ý user).
- **Staff Portal B1–B13 đã vẽ đủ theo plan giai đoạn 2.** Còn lại phía
  KDS: A6 (Cancel/Edit Alert), A7–A8 (Sold-out), A9–A10 (Waste Log) chưa
  vẽ thành nháp riêng (A4 đã gộp vào A3 v5 dạng toggle Theo ticket /
  Theo mẻ nấu).

### 15. A6–A10 KDS ngoại lệ — nháp đã giao rạng sáng 2026-11-06
- A6: cảnh báo hủy/sửa phủ lên hàng đợi; ticket bị khóa nút Hoàn tất đến
  khi xác nhận (chặn thao tác nhầm); nút xác nhận brand khác nút "Để sau"
  trắng; 2 biến thể (món bị hủy / đơn bị sửa).
- A7: danh sách hết món (đang hết + còn bán); A8: xác nhận hết món bằng
  nút danger, món trên A3 gạch ngang + badge HẾT, ẩn khỏi menu khách/POS.
- A9: form ghi hủy tối giản (món, số lượng, lý do) chỉ Bếp trưởng; nhân
  viên thường thấy màn chặn quyền. A10: xem lại rồi xác nhận, ghi xong
  trừ kho.
- Đường vào từ header KDS: chuông (cảnh báo chưa xác nhận), nút "Hết món",
  nút "Ghi hủy".
- Nháp đã giao: Restaurant_OS_A6_A10_KDS_Exceptions_DRAFT.html.
- **A6–A10 v2 theo review** (rạng sáng 2026-11-06, review chấm 8/10):
  Restaurant_OS_A6_A10_KDS_Exceptions_v2_DRAFT.html (v1 giữ nguyên) — sửa
  lỗi snapshot A10 (lưu `wasteConfirm` riêng, xác nhận đọc bản đó, không
  đọc lại form; nút xác nhận có trạng thái "Đang ghi…" chống bấm hai lần;
  màn thành công hiện số liệu hôm nay mới; nút xác nhận chuyển sang màu
  danger); A8 giữ bàn chờ món hết trên ticket với trạng thái "Chờ phục vụ
  xử lý" + cảnh báo cho phục vụ/quản lý, ticket mẫu badge HẾT không gạch
  ngang (gạch ngang chỉ dùng cho món bị hủy ở A6); A6 hiện Trước/Sau, chip
  "CHỜ XÁC NHẬN", nút hoàn tất khóa kèm icon khóa, chuyển biến thể hoặc
  "Đặt lại cảnh báo" reset demo; A9 "Lý do khác" bắt buộc ghi chú, số
  lượng giới hạn theo tồn kho (món hết thì khóa), hiện vai trò "Đang ghi
  với vai trò: Bếp trưởng"; A7 mở bán lại nhập số phần (mặc định = số phần
  còn lại lúc báo hết); dữ liệu món dùng chung một nguồn cho A7/A8/A9;
  tiêu đề màn 22px/700, tên món 16px/600, metadata 13px.
- **A6–A10 v2 duyệt xong tối 2026-11-06.**
- **Chốt đủ 23 màn tối 2026-11-06** — xem mục 16: A3 v5, A5 v2, B9–B10
  v2, B11–B13 v2 đều đã duyệt. Giai đoạn 2+3 coi như xong; còn lại giai
  đoạn 4 (review tổng + bàn giao).

### 16. Chốt đủ 23 màn — tối 2026-11-06
- User chốt cả 4 bản còn lửng: A3 v5 (chế độ Theo mẻ nấu), A5 v2 (drawer
  chi tiết ticket), B9–B10 v2 (xin nghỉ), B11–B13 v2 (phiếu lương & tip).
- Đã duyệt đủ 23 màn theo inventory (A2 bỏ theo quyết định; A4 gộp vào
  A3 v5). Giai đoạn 0 (audit), 1 (luồng + nav), 2+3 (nháp hi-fi bấm được)
  coi như xong.
- Còn lại giai đoạn 4 theo plan: review nội bộ theo checklist (đủ 23 màn,
  đủ luồng, nút chết, token, trạng thái rỗng/lỗi, khóa vai trò Bếp
  trưởng); review với người dùng thật nếu có thể (1 đầu bếp xem A3 từ xa,
  1 nhân viên đi luồng chấm công → lịch → xin nghỉ); gói bàn giao (spec
  từng màn, danh sách component mới, câu hỏi mở còn lại); điểm dừng: team
  duyệt gói bàn giao thì mới sang giai đoạn code (plan riêng, không gộp
  vào plan này).
- Xung đột nguồn đã nêu: A5 v2 ghi ticket "Báo sự cố" xử lý ở A7/A8, nhưng
  A7/A8 theo inventory là màn hết món — nháp này theo inventory, còn chờ
  chốt nơi xử lý ticket báo sự cố.

### 17. Route audit + plan giai đoạn code — 2026-11-06
- Antigravity kiểm tra repo trên máy local (nhánh `dev` @ `ae66277`,
  working tree clean), báo cáo `ROUTE_AUDIT.md`: B2 chỉ có demo
  (`(demo)/staff-home`, hardcode "Minh Anh", sub-nav trỏ vòng lặp); route
  `(staff)/kds` chỉ là placeholder v1 (`INITIAL_KDS_ITEMS`, type 3 trạng
  thái riêng, không dùng `useKdsStore`); demo `kds-board` v7.1 không dùng
  store; B1, B3–B13, A1, A7–A10 chưa có route thật; token trong
  `globals.css` khớp hệ đã khóa; `OrderItemStatus` vẫn còn `COOKING`;
  chưa có type `Ticket`/`Batch`; `useKdsStore` đã có (Zustand + STOMP)
  nhưng quản lý mảng phẳng, chưa có undo; chưa có auth; backend chỉ có 2
  controller (Health, Dish); CVE-2025-66478 xác nhận (`next 15.1.7`);
  không phát hiện tài khoản demo hardcode trong `frontend/src/`.
- **3 điểm audit sai, đã hiệu chỉnh theo quyết định đã khóa:** (1) nền KDS
  không phải chốt lại sáng `#F5F2EA` hay tối `#0B0F14` — đã khóa `#F6F4F0`
  (Minimal Operations UI 2026-11-05); token `--color-kds-bg: #f5f2ea` đang
  lệch, chú thích nền tối ở `globals.css:15` đã lỗi thời; (2) hoàn tác 5
  giây, không phải 10s; (3) `SlaTimer` không nhấp nháy khi quá hạn (đã khóa:
  không thanh SLA, không phần trăm, không nhấp nháy — chỉ chip SLA).
- **Phát hiện mới khi kiểm chứng lại:** `useKdsStore` subscribe topic
  `/topic/kds/orders` (`useKdsStore.ts:58`) — câu hỏi Sprint 0 "topic kds
  hay kitchen" coi như đã có đáp án trong code frontend: **`kds`**; backend
  phải publish đúng topic này.
- **Plan giai đoạn code đã giao:** `Restaurant_OS_Code_Phase_Plan.md` —
  bước 0 đưa tài liệu thiết kế vào repo (`docs/design/`); giai đoạn 0 nền
  tảng P0 (vá CVE lên 15.1.9, chuẩn hóa types, sửa token KDS, auth
  foundation, mock service layer); giai đoạn 1 KDS (A3 → A1 → A5 → A6 →
  A7–A10); giai đoạn 2 Staff cơ bản (B2 → B3–B5); giai đoạn 3 lịch & nghỉ
  (B6–B8 → B9–B10); giai đoạn 4 lương & đăng nhập (B11–B13 → B1 cuối);
  bản đồ route theo đề xuất của audit (`(staff)/...`); quy ước PR (1 PR /
  giai đoạn, commit theo màn, 1 Approved + squash merge); không sửa file
  trong `(demo)/`; ước tính 8–10 buổi.
- Bản đồ route và plan code chờ user/team xác nhận trước khi code.

## Chưa chốt — đừng ghi là đã quyết

- **A3 v5 (chế độ Theo mẻ nấu):** đã duyệt xong tối 2026-11-06 (cùng 3 bản
  còn lại).
- **B2 Staff Home:** v1/v2 đã duyệt xong tối 2026-11-05 — xem mục 8 (còn lại: nội dung tab Cá nhân và thẻ thay KDS cho role phục vụ vẫn chưa chốt, xem 2 dòng dưới).
- **B3–B5:** đã duyệt xong v2 — xem mục 9 và 10. Còn mở: khóa PIN sau 3
  lần sai thì khóa bao lâu (đến khi quản lý mở hay tự mở sau X phút); mã
  giao dịch chấm công có cần không; màn đăng ký khuôn mặt phía quản lý nằm
  ở đâu; chống giả mạo bằng ảnh (liveness) cho production; trạng thái "Ca
  đã kết thúc" ở B3.
- **A5 drawer v2:** đã duyệt xong tối 2026-11-06 (cùng 3 bản còn lại).
- **Chế độ mặc định của app thật** (ticket hay mẻ, hay nhớ lựa chọn lần trước)
  và **cửa sổ 5 phút cũ** (đã đề xuất bỏ sang gộp theo thời gian thực) —
  chờ team xác nhận.
- **Thông tin mẻ trong drawer A5** và **nút Báo sự cố cho cả mẻ** — chưa vẽ.
- **Nội dung tab Cá nhân** trong bottom nav Staff Portal và **thẻ thay thế
  thẻ KDS cho role phục vụ** trên B2 — chưa chốt.
- **Hoàn tất theo ticket hay từng món trong drawer:** v2 đề xuất giữ hoàn tất
  theo ticket; fact quyết định là quán giao món cùng lúc cả ticket hay giao
  theo đợt (mẻ nấu đã trả lời một phần: cần trạng thái theo món).
- **B9–B10:** v2 theo review — xem mục 12. Còn mở: chính sách quỹ phép
  (ốm/việc riêng có trừ quỹ không); tính ngày nghỉ theo ngày lịch hay ca
  thực tế (cái nào là căn cứ duyệt/trừ quỹ); trường đính kèm (chỉ khi chính
  sách yêu cầu); hạn gửi đơn; màn quản lý duyệt đơn nghỉ (ngoài inventory
  B1–B13); thông báo kết quả duyệt; mã đơn (tùy chọn).
- **B11–B13:** v2 theo review — xem mục 13. Còn mở (5 câu hỏi trong
  review): số lương là thực nhận hay tổng thu nhập; phiếu tạm tính tính
  theo giờ đã làm hay dự kiến cả tháng; cách chia tip; tip trả cùng kỳ
  lương hay riêng; có cần tải/xuất PDF phiếu lương không. Ngoài ra: tỷ lệ
  khấu trừ (BHXH, thuế TNCN, giới hạn tạm ứng); kỳ lương (trả ngày mấy —
  nháp đang giả định ngày 10); tháng không có phiếu hiện thế nào; nút quay
  lại B13 từ B2 (về màn trước đó trong luồng).
- **B1 Login:** v2 theo review — xem mục 14. Còn mở: đăng nhập bằng số
  điện thoại, mã nhân viên hay email; quên mật khẩu chỉ gặp quản lý hay tự
  đặt lại qua SMS/OTP; khóa tài khoản sau 3 lần sai đã chốt ngưỡng, nhưng
  khóa bao lâu và ai mở thì chưa chốt; phiên hết hạn sau bao lâu; đầu bếp
  đã đăng nhập B1 rồi sang A1 có cần nhập PIN lại không; đăng nhập sinh
  trắc học; "Ghi nhớ đăng nhập" trên máy dùng chung; ảnh nền bản thật
  (nháp dùng ảnh mẫu đã nhúng base64, bản thật nên dùng ảnh thật của quán).
- **A6–A10:** nháp đã giao v2 theo review — xem mục 15. Còn mở: Bếp
  trưởng vắng mặt thì ai duyệt A9/A7–A8; ghi hủy trừ kho nào (tồn kho
  món/nguyên liệu) và thời điểm nào; "hết món" và "hết nguyên liệu" có
  phải một khái niệm không; ticket "Báo sự cố" xử lý ở đâu (xung đột với
  A5 v2); hủy ticket đã nấu dở có ghi vào waste log luôn không; 1 món
  không làm được thì xử lý cả ticket hay chỉ món đó; kênh báo phục vụ khi
  có bàn chờ món hết; waste log có cần duyệt không. Đã vẽ theo đề xuất
  của review, chờ team chốt thành quy tắc: "Lý do khác" bắt buộc ghi chú;
  mở bán lại thì bếp nhập số phần còn lại.

- **B6–B8:** 4 quyết định nghiệp vụ đã chốt + v2 đã duyệt — xem mục 11.
  Còn mở: điều kiện đủ để đổi ca với nhau (cùng khu vực/kỹ năng/không trùng
  lịch/giới hạn giờ — backend kiểm tra); có cần màn "Yêu cầu của tôi" không;
  mã yêu cầu (tùy chọn); hạn đăng ký/đổi ca; thông báo kết quả duyệt.
