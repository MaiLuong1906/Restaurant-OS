# Kịch Bản 02: Xử Lý Sự Cố Realtime STOMP & Mất Đồng Bộ (Hotfix & Diagnostics)

Kịch bản này dùng để xử lý và sửa chữa khẩn cấp các sự cố liên quan đến mất kết nối WebSocket, lệch trạng thái dữ liệu (Desync) giữa Bếp (KDS) và Khách hàng, hoặc trùng lặp giao dịch.

---

## Bước 1: Khởi Tạo Nhánh Hotfix

1. **Checkout từ nhánh `dev`:**
   ```bash
   git checkout dev && git pull origin dev
   git checkout -b fe/duy/fix-stomp-reconnect-sync
   # hoặc: git checkout -b be/nam/fix-order-idempotency
   ```

---

## Bước 2: Kiểm Tra 3 Nguyên Nhân Thường Gặp Nhất

Khi hệ thống gặp lỗi đơn hàng không nhảy hoặc trùng đơn, AI và Dev phải rà soát đúng 3 điểm sau:

### 1. Kiểm tra Luật Thép Reconnect REST Sync:
- **Triệu chứng:** Khách mất mạng 10 giây có mạng lại nhưng món vừa đặt không hiện trong giỏ, hoặc bếp không thấy đơn mới.
- **Khắc phục:** Mở store Zustand tương ứng (ví dụ `useCartStore.ts` hoặc `useKdsStore.ts`), đảm bảo trong sự kiện `stompClient.onConnect` **bắt buộc phải có lệnh gọi REST API** kéo lại snapshot mới nhất từ server:
  ```typescript
  stompClient.onConnect = async () => {
    const freshData = await apiClient.get<TableCartResponse>(`/tables/${tableId}/cart`);
    set({ items: freshData.items, lastSyncedAt: Date.now() });
  };
  ```

### 2. Kiểm tra Thiếu IdempotencyKey:
- **Triệu chứng:** Khách mạng lag bấm đúp 2 lần $\rightarrow$ tạo ra 2 đơn hàng giống hệt nhau hoặc trừ tiền 2 lần.
- **Khắc phục:** 
  - Phía Client: Đảm bảo payload gửi lên có header `X-Idempotency-Key: crypto.randomUUID()`.
  - Phía Spring Boot: Kiểm tra bộ lọc Redis/Cache đã đăng ký key trong 120s chưa.

### 3. Kiểm tra Trừ Kho BOM ngoài Transaction:
- **Triệu chứng:** Món đã xác nhận nhưng kho không trừ, hoặc kho trừ nhưng đơn bị fail.
- **Khắc phục:** Đảm bảo toàn bộ logic trong `OrderService.java` được bọc kín bởi `@Transactional(rollbackFor = Exception.class)`.

---

## Bước 3: Kiểm Thử Mô Phỏng Mất Kết Nối (Offline Simulation)

1. Mở Chrome DevTools $\rightarrow$ Tab Network $\rightarrow$ Chuyển sang **Offline** trong 5 giây.
2. Thao tác trên một máy khác cùng bàn hoặc trên trạm bếp KDS.
3. Chuyển lại sang **Online** (No throttling).
4. **Kỳ vọng:** Dữ liệu trên màn hình tự động nhảy cập nhật đồng bộ 100% trong vòng $<1$ giây mà không cần bấm F5 tải lại trang.

---

## Bước 4: Chạy Test & Mở Hotfix PR
- Chạy unit test backend: `cd backend && ./mvnw test`
- Chạy type-check frontend: `pnpm --filter frontend type-check`
- Dùng skill `audit-pr-readiness` sinh PR description và merge vào `dev`.
