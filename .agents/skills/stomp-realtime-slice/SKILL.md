---
name: stomp-realtime-slice
description: >-
  Sử dụng kỹ năng này khi người dùng yêu cầu tạo hoặc chỉnh sửa một Zustand store slice kết nối STOMP WebSocket thời gian thực (như giỏ hàng nhóm cartStore, màn hình bếp kdsStore, sơ đồ bàn posStore). Tự động cài đặt luật Reconnect REST sync và IdempotencyKey.
---

# Kỹ Năng: Khởi Tạo Zustand Store Kết Nối STOMP Realtime (stomp-realtime-slice)

Quy trình chuẩn để tạo một Store Zustand quản lý trạng thái thời gian thực bám sát Rule 03.

---

## Bước 1: Khởi Tạo Cấu Trúc Store Slice Chuẩn

Tạo file trong `frontend/stores/[domain]Store.ts` với đầy đủ 4 thành phần:
1. **State Interface:** Định nghĩa kiểu dữ liệu khớp 100% với DTO Backend trong `types/`.
2. **Action Interface:** Các hàm thay đổi state (thêm món, đổi trạng thái bếp).
3. **Idempotency Key:** Mọi hàm hành động (mutation) bắt buộc tự sinh một mã UUID `crypto.randomUUID()`.
4. **Optimistic Update:** Cập nhật state cục bộ ngay lập tức trước khi server phản hồi.

---

## Bước 2: Cài Đặt "Luật Thép Reconnect REST Sync" (BẮT BUỘC)

Trong hàm khởi tạo lắng nghe sự kiện (`subscribeToTopic`):
- Khi đăng ký Topic qua STOMP Client (ví dụ `/topic/tables/{tableId}/cart`):
  ```typescript
  // 1. Gọi REST API đồng bộ dữ liệu tác nghiệp mới nhất trước
  const initialData = await apiClient.get<TableCartResponse>(`/tables/${tableId}/cart`);
  set({ items: initialData.items, lastSyncedAt: Date.now() });

  // 2. Lắng nghe luồng STOMP frames
  const subscription = stompClient.subscribe(`/topic/tables/${tableId}/cart`, (message) => {
    const event = JSON.parse(message.body);
    get().handleIncomingEvent(event);
  });

  // 3. Xử lý khi STOMP bị rớt mạng và kết nối lại
  stompClient.onConnect = async () => {
    // Tự động gọi lại REST API để reconcile dữ liệu đã bị bỏ lỡ
    const resyncedData = await apiClient.get<TableCartResponse>(`/tables/${tableId}/cart`);
    set({ items: resyncedData.items, lastSyncedAt: Date.now() });
  };
  ```

---

## Bước 3: Đảm Bảo Tiền Tệ & Định Dạng Số Nguyên
- Mọi giá tiền tính tổng hoặc đơn giá trong Store đều là **số nguyên VND**.
- Tuyệt đối không dùng phép chia số thực làm phát sinh số thập phân lẻ.
