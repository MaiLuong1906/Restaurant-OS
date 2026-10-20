# Quy Tắc 03: Giao Thức STOMP Realtime & Toàn Vẹn Dữ Liệu

## 1. Giao Thức Realtime (STOMP qua WebSocket)
Cơ chế Realtime là "hệ thần kinh" của Restaurant OS, đòi hỏi độ trễ lan truyền sự kiện $<50\text{ms}$ giữa Khách hàng, Bếp (KDS) và Quầy thu ngân.

### Các Topic Tiêu Chuẩn:
- **Giỏ hàng nhóm tại bàn:** `/topic/tables/{tableId}/cart` — Bắn sự kiện khi có khách cùng bàn thêm/bớt món hoặc gửi tin nhắn ghi chú.
- **Màn hình bếp KDS:** `/topic/kds/{stationId}` — Luồng đơn hàng vào trạm bếp (`ORDER_PLACED`, `ITEM_COOKING`, `ITEM_DONE`).
- **Trạng thái sơ đồ bàn & Thu ngân:** `/topic/pos/tables` — Khách vào bàn, yêu cầu thanh toán, cảnh báo thu ngân.
- **Khóa món hết hàng:** `/topic/inventory/stock` — Khi kho chạm ngưỡng an toàn, backend bắn sự kiện lập tức làm mờ và khóa món trên menu khách hàng mà không cần tải lại trang.

---

## 2. Luật Thép Khi Mất Kết Nối & Kết Nối Lại (CRITICAL)
> **Quy tắc:** Broker STOMP WebSocket **KHÔNG** tự động phát lại các tin nhắn đã bị lỡ trong thời gian client mất mạng.

Do đó, mỗi khi kết nối STOMP bị đứt và kết nối lại thành công:
1. **TUYỆT ĐỐI KHÔNG** coi trạng thái hiện tại trên máy client là chuẩn xác.
2. Client **BẮT BUỘC phải gọi ngay một lệnh REST API** để kéo bản chụp trạng thái mới nhất từ server về:
   - KDS: `GET /api/v1/kds/{stationId}/orders`
   - Giỏ hàng: `GET /api/v1/tables/{tableId}/cart`
   - Thu ngân POS: `GET /api/v1/pos/floor-status`
3. Sau khi đồng bộ xong dữ liệu từ REST API vào Zustand store, client mới tiếp tục xử lý các frame STOMP tiếp theo.

---

## 3. Ràng Buộc Tính Lũy Kế (Idempotency)
> **Quy tắc:** Mọi yêu cầu thay đổi dữ liệu (đặt món, đổi trạng thái bếp, thanh toán) bắt buộc phải gửi kèm một mã UUID `idempotencyKey` do client sinh ra.

Nhằm loại bỏ hoàn toàn rủi ro tạo đơn trùng lặp, trừ tiền 2 lần khi mạng lag bấm đúp:
- Trong Header REST: `X-Idempotency-Key: <UUID-v4>`
- Trong Header frame STOMP: `idempotencyKey: <UUID-v4>`
- Phía Backend: Đăng ký key này vào Redis / DB Cache trong 120 giây. Nếu nhận được cùng một key, trả về kết quả của giao dịch trước đó thay vì xử lý lại từ đầu.

---

## 4. Giao Dịch Toàn Vẹn ACID & Trừ Kho BOM (Spring Boot)
1. **Định lượng nguyên vật liệu (BOM - Bill of Materials):**
   - Khi đơn hàng chuyển sang trạng thái `CONFIRMED` hoặc `COOKING`, toàn bộ nguyên liệu cấu thành (thịt, rau, sốt) phải được tự động trừ trong kho.
   - Toàn bộ chuỗi thao tác này **bắt buộc** phải nằm trong khối `@Transactional`:
     ```java
     @Transactional(rollbackFor = Exception.class)
     public OrderResponse confirmOrder(Long orderId, String idempotencyKey) {
         // 1. Khóa trạng thái bàn & kiểm tra idempotency
         // 2. Lưu các dòng chi tiết đơn hàng
         // 3. Trừ tồn kho nguyên liệu thô theo công thức định lượng BOM
         // 4. Phát sự kiện STOMP đến KDS và màn hình khách
     }
     ```
   - Nếu tồn kho nguyên liệu thiết yếu không đủ, phải ném ra `InsufficientStockException` và tự động rollback toàn bộ giao dịch.

---

## 5. Xử Lý Tùy Chọn Món Đa Dạng Bằng `JSONB`
- Các tùy biến của món (topping, mức đường, lượng đá, độ cay, ghi chú đặc biệt) được lưu trữ dạng **PostgreSQL `JSONB`**.
- Không tạo các bảng quan hệ phức tạp chỉ để lưu thuộc tính tùy biến linh hoạt.
- Cấu trúc mẫu của trường `modifiers` dạng JSONB:
  ```json
  {
    "modifiers": [
      { "id": "top_01", "name": "Trân châu hoàng kim", "price": 10000, "qty": 1 },
      { "id": "opt_sugar", "name": "Đường", "value": "50%" },
      { "id": "opt_ice", "name": "Đá", "value": "Ít đá" }
    ],
    "specialNote": "Không hành lá, chia 2 tô"
  }
  ```
