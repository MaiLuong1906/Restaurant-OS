# Restaurant OS — Deep-dive các màn hình nội bộ (KDS, Thu ngân, Quản trị, Nhân sự, Menu & Kho)

Phần tiếp theo của `Restaurant_OS_Sprint1_Menu_DeepDive.md` (màn hình khách hàng).
Bám theo tài liệu v1.1 và stack đã chốt: Next.js 15 App Router, Tailwind v4, Zustand, STOMP WebSocket.
Cập nhật: 2026-10-16.

## 0. Nguyên tắc chung cho nhóm màn hình nội bộ

| Màn hình | Thiết bị | Ai dùng | Sprint |
|---|---|---|---|
| Quản lý menu (CRUD món, ảnh) | Desktop/tablet | Quản lý | **Sprint 1** (cần có để khách có dữ liệu menu thật) |
| KDS bếp/bar | Tablet/TV ngang, nền tối | Đầu bếp | Sprint 1 |
| Thu ngân + sơ đồ bàn | Tablet/PC ngang | Thu ngân, quản lý | Sprint 2 |
| Dashboard (bản cơ bản) | Desktop | Chủ, quản lý | Sprint 2–3 (Copilot để Sprint 5) |
| Kho (tồn kho, ngưỡng, khóa món) | Desktop | Quản lý | Sprint 3 |
| Nhân sự | Desktop + mobile cho nhân viên | Chủ, nhân sự, nhân viên | Sprint 4 |

Cây route đề xuất, tách theo nhóm quyền để middleware chặn theo RBAC:

```
app/
  (customer)/ ...                      # đã có ở deep-dive Sprint 1
  (staff)/
    kds/[stationId]/page.tsx           # bếp, bar tách station
    pos/page.tsx                       # thu ngân: sơ đồ bàn + chi tiết bàn
    pos/shift/page.tsx                 # mở ca / đóng ca, đối soát
  (admin)/
    dashboard/page.tsx
    menu/page.tsx                      # lưới món, kéo-thả danh mục
    inventory/page.tsx
    hr/
      employees/page.tsx
      schedule/page.tsx                # lịch xếp ca tuần
      attendance/page.tsx
      payroll/page.tsx                 # chỉ Chủ + Nhân sự
  (me)/                                # mobile cho nhân viên
    schedule/page.tsx                  # ca của tôi, đổi ca, xin nghỉ
    check-in/page.tsx
```

Quy tắc chung:
- Dùng chung một lớp realtime (`lib/stomp.ts`) với tự kết nối lại. **Khi kết nối lại phải gọi REST để đồng bộ trạng thái hiện tại**, vì STOMP không phát lại tin đã lỡ. Đây là chỗ hay sai nhất ở KDS và thu ngân.
- Mọi hành động đổi trạng thái (nhận món, xong món, thanh toán) gửi lên server bằng REST/STOMP kèm `idempotency key`, tránh bấm đúp hoặc mạng chập chờn tạo trùng.
- Màn hình nội bộ ưu tiên **đọc nhanh, bấm chắc** hơn hiệu ứng. Không dùng tilt/parallax như màn khách.

## 1. Màn hình bếp KDS

### 1.1. Bố cục (theo đề xuất)

- Màn ngang, nền đen/xám đậm (`#0B0F14`), chữ trắng, cỡ chữ lớn để nhìn xa.
- 3 cột: **Chờ nấu → Đang nấu → Xong**. Mỗi đơn là một thẻ.
- Trong thẻ: số bàn rất to, tên món + số lượng, ghi chú (ít đá, không nấm) **in đậm màu vàng**, vòng tròn đếm ngược cho từng món.
- Món giống nhau từ nhiều bàn gom thành 1 dòng lớn ("Mì xào bò ×3").
- Nút bấm rộng bằng cả thẻ: "Nhận món" → "Xong".

### 1.2. Chi tiết nên chốt

**Gom món (batch):**
- Gom theo `dishId` + **cùng tùy chọn/ghi chú** trong cửa sổ 5 phút (theo tài liệu). Hai đĩa "Mì xào bò" mà một đĩa "không hành" thì **không gộp chung một dòng**; hiển thị dạng "×3 (1 không hành)" để bếp biết.
- Gom chỉ ở tầng hiển thị. Trong DB mỗi dòng order item vẫn riêng, để trừ kho và tính giờ từng bàn đúng.
- Bấm "Nhận món" trên dòng gom → áp dụng cho tất cả item trong nhóm. Có nút nhỏ "Tách" nếu bếp chỉ làm một phần.

**Thứ tự thẻ (cần cân nhắc):** đề xuất là đơn mới nhất nhảy lên đầu cột "Chờ nấu". Rủi ro: đơn cũ bị đẩy xuống cuối và trễ SLA 15 phút mà không ai thấy. Gợi ý kết hợp:
- Đơn mới nhất vẫn lên đầu, nhấp nháy 2–3 giây + chuông.
- Đơn **quá 70% thời gian SLA hoặc đã trễ** tự ghim lên đầu cột, viền đỏ.
- Hoặc cho bếp trưởng đổi chế độ sắp xếp (mới nhất / cũ nhất / gần trễ nhất) ngay trên màn hình.

**Đếm ngược:**
- Mỗi món có `prepTimeSeconds` cấu hình trong menu (quản lý nhập ở màn Menu).
- Màu xanh → vàng → đỏ, **kèm số phút/giây và icon**, không chỉ dựa vào màu (đèn bếp và người mù màu dễ nhầm).
- Đếm ngược tính ở client từ mốc `acceptedAt` của server, tránh lệch khi tablet bị đơ.

**Tay ướt, tay bẩn:**
- Vùng bấm tối thiểu cao 64px, nút "Nhận/Xong" cao ≥ 72px, cách nhau đủ xa.
- Bấm "Xong" có **toast hoàn tác 5 giây** thay vì hộp xác nhận (nhanh hơn nhưng vẫn cứu được bấm nhầm).
- Không dùng thao tác vuốt/kéo làm hành động chính.

**Âm thanh và màn hình:**
- Trình duyệt chặn tự phát âm thanh nếu người dùng chưa chạm màn hình. Cần màn "Bắt đầu ca bếp — chạm để bật chuông" khi mở KDS.
- Dùng Screen Wake Lock API để màn hình không tự tắt; có hiện biểu tượng trạng thái kết nối (xanh/đỏ) ở góc.
- Chuông khác nhau: đơn mới, đơn trễ, món bị hủy/sửa từ bàn.

**Station:** tài liệu có "Bếp/Bar". Mỗi món gắn `stationId`; KDS bếp và KDS bar subscribe topic riêng.

### 1.3. Realtime và state

```
/topic/kds/{stationId}            # server → KDS: đơn mới, đơn sửa/hủy
/app/kds/items/{itemId}/accept    # KDS → server
/app/kds/items/{itemId}/done
/topic/waiter/{restaurantId}      # server → bồi bàn: món xong, cần mang ra bàn
```

Trạng thái item: `PENDING → COOKING → DONE → SERVED` (có thêm `CANCELLED`). Cột "Xong" nên tự ẩn thẻ sau khi bồi bàn xác nhận `SERVED` hoặc sau X phút để cột không phình.

```ts
// stores/kds.ts
kdsStore: { stationId, tickets, groupedView, connection, soundEnabled, sortMode }
```

### 1.4. Definition of Done

- [ ] Đơn từ điện thoại khách hiện trên KDS < 1s, có chuông.
- [ ] Gom đúng "×N" và **không gộp** món khác ghi chú.
- [ ] Tắt wifi 30 giây rồi bật lại → KDS tự đồng bộ đủ đơn, không mất, không trùng.
- [ ] Bấm "Xong" nhầm → hoàn tác được trong 5 giây.
- [ ] Đơn trễ SLA tự ghim lên đầu, viền đỏ.
- [ ] Màn hình không tự tắt sau 30 phút để yên.

## 2. Quầy thu ngân

### 2.1. Bố cục (theo đề xuất)

- Màn ngang, 2 vùng: **trái** sơ đồ bàn 2.5D, **phải** chi tiết bàn đang chọn.
- Bấm bàn → panel phải: danh sách món đã gọi, nút gộp/chuyển/chia bàn, nút thanh toán.
- Thanh toán: chọn chia đều / ai gọi nấy trả → QR MoMo/VietQR → xác nhận đã trả.
- Đầu ca/cuối ca: mở két, đối soát tiền mặt vs chuyển khoản.

### 2.2. Chi tiết nên chốt

**Sơ đồ bàn:**
- Canvas theo tọa độ lưu trong PostGIS; chuyển tầng/khu vực bằng tab phía trên.
- Màu theo tài liệu: xanh (trống) → vàng (đang ăn) → đỏ nhấp nháy (quá SLA 15 phút) → xám (cần dọn). **Thêm icon/nhãn nhỏ** trên bàn để không phụ thuộc màu.
- Chỉ re-render bàn đổi trạng thái (subscribe `/topic/floor/{areaId}`), không vẽ lại cả mặt bằng.
- Chế độ chỉnh sơ đồ (kéo-thả bàn) là màn quản lý riêng, không để lẫn vào màn thu ngân đang chạy.

**Gộp / chuyển / chia bàn:**
- Là thao tác trong **một transaction** ở backend (`@Transactional`), vì đụng tới bill và trạng thái bàn.
- Gộp bàn: bill hợp nhất, giữ lịch sử bàn gốc để báo cáo. Chuyển bàn: đơn trên KDS phải cập nhật số bàn ngay.
- Màn hình hiển thị bước xem trước ("Gộp bàn 5 + 6 → bill 1.250.000đ") trước khi xác nhận.

**Thanh toán:**
- Với QR, **ưu tiên tự động xác nhận** qua callback/webhook của cổng thanh toán, không dựa vào việc thu ngân tự tick. Nếu cổng không có webhook: thu ngân xác nhận thủ công, bắt buộc ghi log (ai, lúc nào, số tiền) và phân quyền.
- Mỗi phần thanh toán (chia đều/ai gọi nấy trả) có trạng thái riêng: `UNPAID / PENDING / PAID`. Bill chỉ đóng khi tất cả phần là `PAID`.
- Bước đóng bill (khóa bàn, tạo hóa đơn, trừ kho theo BOM, tích điểm, in phiếu) là một transaction, đúng như tài liệu mô tả.
- In phiếu nhiệt ESC/POS do **backend gửi** qua mạng LAN, frontend chỉ gọi API "in lại".
- Nút "Gọi nhân viên" làm fallback khi QR lỗi (đồng bộ với màn thanh toán của khách).

**Ca và két tiền:**
- Mở ca: nhập tiền đầu ca. Đóng ca: hệ thống tính `tiền mặt dự kiến = đầu ca + tiền mặt bán ra − chi/hoàn`, thu ngân nhập số đếm thực tế, hiển thị **chênh lệch** và bắt nhập lý do nếu lệch.
- Lệnh mở két gửi từ backend; mỗi lần mở két ngoài giao dịch phải ghi log.
- Chuyển khoản/QR chỉ đối soát với báo cáo cổng thanh toán, không đếm tay.

### 2.3. Realtime và state

```ts
// stores/pos.ts
posStore:   { areaId, tables, selectedTableId }        // /topic/floor/{areaId}
billStore:  { bill, splits, paidBy, status }           // /topic/tables/{id}/bill
shiftStore: { shift, openingCash, expectedCash, diff }
```

### 2.4. Definition of Done

- [ ] Bàn đổi trạng thái trên màn thu ngân < 1s sau khi khách gọi món.
- [ ] Gộp/chuyển bàn: KDS đổi số bàn ngay, không mất món.
- [ ] Hai thu ngân cùng thao tác một bàn → hệ thống chặn/cảnh báo, không tạo hai bill.
- [ ] Thanh toán QR thật → bill tự chuyển PAID; mất mạng giữa chừng không tính tiền hai lần.
- [ ] Đóng ca hiện đúng chênh lệch tiền mặt; có log mở két.

## 3. Dashboard quản trị

### 3.1. Bố cục (theo đề xuất)

- Hàng thẻ số liệu: doanh thu hôm nay, số bàn đang phục vụ, món bán chạy nhất, cảnh báo (hết nguyên liệu, nhân viên trễ).
- Biểu đồ doanh thu theo giờ/ngày/tuần; top món ế nhất.
- Copilot: ô chat góc phải, hỏi tiếng Việt ("Tuần này món nào ế nhất?").

### 3.2. Chi tiết nên chốt

- **Phụ thuộc theo sprint:** thẻ "hết nguyên liệu" cần Sprint 3 (kho), thẻ "nhân viên trễ" cần Sprint 4 (chấm công), Copilot là Sprint 5 (AI). Dashboard Sprint 2 chỉ làm doanh thu, số bàn, món bán chạy; các thẻ còn lại hiện trạng thái "Sắp có" thay vì bỏ trống.
- Số liệu cho thẻ và biểu đồ lấy từ **endpoint tổng hợp** (view hoặc bảng tổng hợp theo giờ), không để frontend tự cộng từ danh sách hóa đơn. Doanh thu hôm nay cập nhật qua STOMP hoặc polling 30–60 giây là đủ.
- Bộ lọc: chi nhánh, khoảng ngày. Mọi biểu đồ cần cùng một bộ lọc thời gian.
- "Món ế" định nghĩa rõ: bán dưới X phần/tuần hoặc thấp nhất theo doanh thu? Nên cho cả hai cách xem.
- **Copilot (Text-to-SQL) và bảo mật:** chạy bằng một **role DB chỉ đọc**, chỉ trỏ vào các view đã chọn (doanh thu, món, kho), **không cho đọc bảng lương và dữ liệu nhân sự** trừ khi người hỏi là Chủ. Câu SQL do AI sinh ra cần được kiểm (chỉ SELECT, giới hạn dòng, timeout) trước khi chạy.
- Biểu đồ: Recharts hoặc Chart.js đều đủ; tải theo từng khối (lazy) để dashboard không chặn lần vào đầu tiên.

### 3.3. Definition of Done

- [ ] Doanh thu trên dashboard khớp tổng hóa đơn đã thanh toán trong ngày (đối chiếu thủ công 1 ngày dữ liệu mẫu).
- [ ] Đổi chi nhánh/khoảng ngày → mọi thẻ và biểu đồ đổi theo.
- [ ] Quản lý chi nhánh chỉ thấy dữ liệu chi nhánh mình.
- [ ] (Sprint 5) Copilot không trả được dữ liệu lương cho người không phải Chủ.

## 4. Quản lý nhân sự

### 4.1. Bố cục (theo đề xuất)

- Danh sách nhân viên dạng bảng: ảnh, tên, vị trí, loại hợp đồng, trạng thái ca hôm nay.
- Lịch xếp ca dạng tuần, kéo-thả ca vào ô ngày, màu theo ca sáng/chiều/tối, cảnh báo đỏ khi thiếu người.
- Chấm công: bảng giờ vào/ra, tô màu trễ/về sớm.
- Bảng lương: mỗi nhân viên một dòng (lương cơ bản, tăng ca, tip được chia, thưởng/phạt). Chỉ Chủ và nhân sự được xem.

### 4.2. Chi tiết nên chốt

**Lịch xếp ca:**
- Dùng thư viện kéo-thả (ví dụ dnd-kit) và **kiểm tra ràng buộc ở server**, không chỉ ở giao diện: trùng ca, quá số giờ/tuần, thiếu thời gian nghỉ giữa hai ca, nhân viên đang nghỉ phép.
- Cảnh báo "thiếu người" = số người đã xếp < số người cần theo khung giờ (quản lý cấu hình số người tối thiểu từng vị trí). Sau này dùng dự báo lượng khách của AI Smart Scheduling (Sprint 5) làm số cần.
- Hiển thị cả mã màu và chữ (S/C/T) trên ô.
- Lịch có trạng thái **Nháp → Đã công bố**. Chỉ khi công bố mới thông báo cho nhân viên; sửa sau công bố phải ghi lý do.

**Chấm công:**
- Trễ/về sớm tính so với ca đã xếp cộng ngưỡng cho phép (cấu hình, ví dụ 5 phút).
- Cho phép quản lý **sửa giờ** nhưng bắt buộc ghi lý do và lưu lịch sử; không ghi đè mất dữ liệu gốc.
- Quên check-out: tự đánh dấu "thiếu giờ ra" để quản lý xử lý cuối ngày.

**Bảng lương và bảo mật:**
- Chỉ Chủ và nhân sự thấy trang `payroll`. Quản lý chi nhánh chỉ thấy danh sách nhân viên và ca.
- Ẩn số tiền mặc định (`•••`), bấm "Hiện" mới xem và **ghi log truy cập**. Số giấy tờ tùy thân và tài khoản ngân hàng ẩn một phần, mã hóa trong DB.
- Kỳ lương có trạng thái `Nháp → Đã chốt`. Sau khi chốt không sửa trực tiếp, chỉ tạo điều chỉnh ở kỳ sau.
- Các tham số bảo hiểm/thuế để dạng cấu hình có ngày hiệu lực, vì quy định thay đổi theo thời gian; nhóm nên xác nhận công thức với kế toán trước khi code.
- Dữ liệu HR đi qua backend Spring Boot, không mở cho Supabase Data API (theo mục 3.5 tài liệu v1.1).

**Mobile cho nhân viên** (route `(me)`): xem ca của mình, xin nghỉ, xin đổi ca, check-in. Nhân viên chỉ thấy phiếu lương của chính mình.

### 4.3. Definition of Done

- [ ] Kéo ca vi phạm ràng buộc → bị từ chối và nêu rõ lý do.
- [ ] Công bố lịch → nhân viên thấy trên điện thoại.
- [ ] Nhân viên thường gọi API lương của người khác → bị 403.
- [ ] Xem lương và sửa giờ công đều có log.
- [ ] Kỳ lương đã chốt không sửa được trực tiếp.

## 5. Quản lý menu & kho

### 5.1. Bố cục (theo đề xuất)

- Menu dạng lưới ảnh món, kéo-thả sắp xếp danh mục, toggle bật/tắt món khi hết hàng.
- Kho: bảng tồn kho có thanh tiến trình; dòng chạm ngưỡng tối thiểu đỏ lên và tự khóa món liên quan.

### 5.2. Chi tiết nên chốt

**Hai cờ trạng thái cho món (quan trọng):** nếu chỉ có một toggle, quản lý bật lại món thì sẽ ghi đè việc hệ thống khóa vì hết kho, hoặc ngược lại. Tách thành:
- `manualUnavailable` — quản lý tắt tay.
- `stockUnavailable` — hệ thống tự khóa theo kho.
- Món bán được khi **cả hai đều false**. Giao diện hiển thị rõ lý do ("Hết nguyên liệu: nạm bò" / "Tắt thủ công bởi An").

**Quy tắc tự khóa:** khóa khi nguyên liệu trong BOM **không đủ cho 1 phần** (tồn < định lượng một phần), và/hoặc chạm ngưỡng tối thiểu theo cấu hình. Chỉ chạm ngưỡng mà vẫn còn đủ thì nên cảnh báo vàng, chưa khóa, để không mất doanh thu sớm. Quyết định này cần chủ nhà hàng chốt.

**Đẩy realtime:** khi trạng thái món đổi, backend phát `/topic/menu` → menu khách và POS bồi bàn khóa ngay (khớp DoD Sprint 1 phía khách).

**Menu:**
- Form món: tên, giá, danh mục, ảnh, `prepTimeSeconds` (cho KDS), station (bếp/bar), nhóm tùy chọn (topping, độ cay, độ ngọt; lưu JSONB theo tài liệu), công thức BOM (Sprint 3).
- Ảnh: tải lên Supabase Storage qua backend (hoặc signed URL), giới hạn dung lượng, **tự chuyển WebP và tạo nhiều kích thước** để menu khách nhẹ (khớp ngân sách hiệu năng Sprint 1).
- Thứ tự danh mục/món lưu bằng trường `sortOrder`; kéo-thả xong gửi một request cập nhật cả danh sách, không gửi từng món.
- Đổi giá không ảnh hưởng đơn đã gọi: lưu giá tại thời điểm gọi vào order item.

**Kho:**
- Cột: nguyên liệu, tồn, đơn vị, ngưỡng tối thiểu, thanh tiến trình (tồn/mức tối đa), món bị ảnh hưởng.
- Màu thanh: xanh → vàng (gần ngưỡng) → đỏ (≤ ngưỡng), kèm chữ trạng thái.
- Thao tác: nhập kho, kiểm kê, ghi hao hụt (Waste Tracking theo tài liệu) với lý do; mọi thay đổi tồn đều là một dòng sổ kho (không sửa số trực tiếp).
- Báo cáo xuất – nhập – tồn lấy từ sổ kho.

### 5.3. Definition of Done

- [ ] Tạo món mới + ảnh → xuất hiện trên menu khách < 5s.
- [ ] Bán đến khi nguyên liệu không đủ → món tự khóa trên menu khách, không reload.
- [ ] Quản lý bật tay món đang bị khóa do kho → món vẫn khóa, giao diện nêu lý do.
- [ ] Kéo-thả đổi thứ tự danh mục → khách thấy thứ tự mới.
- [ ] Mọi thay đổi tồn kho có dòng sổ kho kèm người thực hiện.

## 6. Việc cần chuẩn bị trước khi code nhóm màn hình này

- Thống nhất danh sách trạng thái (order item, bill, shift, payroll period) thành enum dùng chung giữa backend và frontend.
- Chốt cổng thanh toán và xem cổng có webhook xác nhận hay không (ảnh hưởng thiết kế màn thanh toán).
- Tablet thật để thử KDS và POS (kiểm tra chuông, wake lock, cỡ nút khi tay ướt).
- Mock data cho dashboard (khoảng 30 ngày doanh thu giả) để frontend dựng biểu đồ song song.
- Seed role/tài khoản mẫu: Chủ, Quản lý, Thu ngân, Đầu bếp, Bồi bàn, Nhân sự, để thử phân quyền sớm.

## 7. Các điểm cần nhóm quyết định

1. KDS: đơn mới nhất lên đầu hay ưu tiên đơn gần trễ nhất (mục 1.2)?
2. Món tự khóa khi chạm ngưỡng tối thiểu hay chỉ khi không đủ một phần (mục 5.2)?
3. Cổng thanh toán nào, có webhook không (mục 2.2)?
4. Ai được sửa giờ chấm công và có cần người duyệt thứ hai không (mục 4.2)?
5. Có dùng một màn POS chung cho bồi bàn (gọi món hộ khách) hay chỉ thu ngân? Tài liệu có "POS của bồi bàn" nhưng chưa mô tả màn này.
