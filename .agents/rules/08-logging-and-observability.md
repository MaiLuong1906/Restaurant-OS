# Quy Tắc 08: Logging, Truy Vết Phân Tán & Khả Năng Quan Sát

## 1. Truy Vết Xuyên Suốt Hệ Thống (`X-Request-ID`)
Để dễ dàng định vị các sự cố trễ mạng hoặc đơn hàng bị thất lạc trong giờ cao điểm xuyên qua chuỗi tương tác (Mobile Khách $\rightarrow$ Next.js $\rightarrow$ Spring Boot $\rightarrow$ STOMP Broker $\rightarrow$ KDS Bếp), mọi luồng trao đổi **bắt buộc** phải gắn kèm một mã định danh truy vết.

### Cơ Chế Lan Truyền:
1. **Qua HTTP REST:**
   - Client tự sinh hoặc chuyển tiếp header: `X-Request-ID: req_<uuid-v4>`.
   - Spring Boot đón nhận mã này qua `CorrelationIdFilter` và nạp vào SLF4J **MDC (Mapped Diagnostic Context)**:
     ```java
     MDC.put("requestId", requestId);
     ```
   - Phía Backend gắn trả lại `X-Request-ID` trong Header phản hồi HTTP và trong thân JSON của `ApiResponse`.
2. **Qua WebSocket / STOMP:**
   - Header của frame STOMP bắt buộc gửi kèm: `requestId: req_<uuid-v4>`.
   - Khi phát tán (broadcast) sự kiện sang các Topic, log nội bộ phải đính kèm `requestId` này.

---

## 2. Tiêu Chuẩn Ghi Log Có Cấu Trúc (Structured Logging)

### Quy định về Cấp độ Log (Log Levels):
- **`INFO` (Dấu mốc nghiệp vụ quan trọng):**
  - Chuyển trạng thái đơn hàng (`PLACED` $\rightarrow$ `COOKING` $\rightarrow$ `COMPLETED`).
  - Mở ca / đóng ca thu ngân kèm tóm tắt đối soát tiền mặt.
  - Lệnh in hoá đơn nhiệt ESC/POS được gửi thành công đến máy in.
- **`WARN` (Hiệu năng suy giảm / Thử lại):**
  - Mất kết nối STOMP / Bắt đầu chu kỳ tự động kết nối lại.
  - Máy in nhiệt sắp hết giấy hoặc timeout kết nối socket tạm thời.
  - Phát hiện và chặn xung đột do trùng lặp idempotency key.
- **`ERROR` (Sự cố cần can thiệp):**
  - Giao dịch database bị rollback.
  - Ngoại lệ thiếu hàng trong kho khi đang đặt đơn.
  - Ngoại lệ chưa bắt và lỗi webhook cổng thanh toán.
- **`DEBUG` (Chỉ dùng lúc lập trình cục bộ):**
  - Nghiêm cấm bật ở môi trường Production.

### Định Dạng Log Đầu Ra (Single-Line JSON):
Ở môi trường Production, log phát ra qua Logback phải là JSON một dòng:
```json
{
  "timestamp": "2026-10-21T04:22:00.123Z",
  "level": "INFO",
  "logger": "com.restaurantos.service.OrderService",
  "thread": "http-nio-8080-exec-4",
  "requestId": "req_8f1a2b3c4d5e",
  "tableId": 12,
  "action": "ORDER_CONFIRMED",
  "message": "Đã xác nhận đơn hàng #482 cho Bàn 12, tổng tiền: 320000 VND"
}
```

---

## 3. Bảo Vệ Dữ Liệu Riêng Tư (PII Sanitization)
- **TUYỆT ĐỐI CẤM** ghi log thông tin định danh cá nhân của khách hàng như số điện thoại, số tài khoản ngân hàng.
- Che mờ (mask) các chuỗi nhạy cảm: token xác thực (`Bearer eyJ...` $\rightarrow$ `Bearer [MASKED]`).
