# Quy Tắc 06: Chuẩn Hóa Envelope Phản Hồi API & Xử Lý Lỗi Toàn Cục

## 1. Vỏ Bọc Phản Hồi Thống Nhất (`ApiResponse<T>`)
Mọi REST API endpoint của Backend và các hàm gọi API phía Frontend **bắt buộc** phải tuân theo một cấu trúc vỏ bọc (envelope) có thể dự đoán được. Nghiêm cấm trả về mảng dữ liệu hoặc kiểu nguyên thủy dạng thô (un-enveloped).

### Đặc tả JSON chuẩn:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy dữ liệu thành công",
  "data": { ... },
  "timestamp": "2026-10-21T04:22:00.000Z",
  "requestId": "req_8f1a2b3c4d5e"
}
```

### Cài đặt Java 21 Record (Backend):
```java
public record ApiResponse<T>(
    boolean success,
    String code,
    String message,
    T data,
    Instant timestamp,
    String requestId
) {
    public static <T> ApiResponse<T> ok(T data, String message, String requestId) {
        return new ApiResponse<>(true, "SUCCESS", message, data, Instant.now(), requestId);
    }

    public static <T> ApiResponse<T> ok(T data, String requestId) {
        return ok(data, "Thao tác hoàn tất thành công", requestId);
    }
}
```

---

## 2. Vỏ Bọc Báo Lỗi Thống Nhất (`ApiErrorResponse`)
Khi xảy ra ngoại lệ, hệ thống phải trả về payload lỗi sạch theo tinh thần RFC 7807. **Tuyệt đối không để lộ vết ngăn xếp (Stack trace) ra ngoài client**.

### Cấu trúc JSON báo lỗi:
```json
{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "Không đủ số lượng nguyên vật liệu trong kho để hoàn tất đơn hàng",
  "errors": [
    {
      "field": "ingredients.beef_rib",
      "reason": "Yêu cầu 300g nhưng tồn kho chỉ còn 120g"
    }
  ],
  "timestamp": "2026-10-21T04:22:00.000Z",
  "requestId": "req_8f1a2b3c4d5e"
}
```

---

## 3. Bộ Xử Lý Ngoại Lệ Toàn Cục (`@RestControllerAdvice`)
Spring Boot bắt toàn bộ ngoại lệ ứng dụng tại một điểm tập trung:

1. **Lỗi kiểm tra tính hợp lệ dữ liệu (`MethodArgumentNotValidException`):**
   - HTTP Status: `400 Bad Request`
   - Bóc tách danh sách lỗi của từng trường đưa vào mảng `errors`.
2. **Lỗi vi phạm quy tắc nghiệp vụ (`BusinessException`, `InsufficientStockException`):**
   - HTTP Status: `422 Unprocessable Entity` hoặc `409 Conflict`.
   - Cung cấp mã lỗi miền cụ thể (ví dụ: `ORDER_ALREADY_PAID`, `TABLE_NOT_VACANT`).
3. **Lỗi xác thực & phân quyền (`AccessDeniedException`):**
   - HTTP Status: `401 Unauthorized` hoặc `403 Forbidden`.
4. **Ngoại lệ hệ thống chưa bắt (`Exception`):**
   - HTTP Status: `500 Internal Server Error`
   - Ghi log nội bộ kèm đầy đủ stack trace và `requestId`.
   - Trả thông báo an toàn: *"Đã xảy ra sự cố hệ thống, vui lòng thử lại sau."*

---

## 4. Bóc Tách Dữ Liệu Phía Frontend (`frontend/lib/api-client.ts`)
Bộ thư viện gọi API phía client phải tự động xử lý `ApiResponse<T>`:
- Nếu `success === true`, trả thẳng phần `data` cho component/store sử dụng.
- Nếu `success === false` hoặc HTTP status $\ge 400$, ném ra một đối tượng lỗi `AppError` chứa `code`, `message`, và `errors` để tự động hiển thị thông báo Toast hoặc gán vào Form.
