# Quy Tắc 10: Tháp Kiểm Thử & Tiêu Chuẩn Chất Lượng (Quality Gates)

## 1. Chiến Lược Tháp Kiểm Thử
Kiểm thử tự động bảo đảm cho việc định tuyến đơn hàng thời gian thực, giao dịch trừ kho và tính tiền luôn ổn định vững chắc dưới áp lực giờ cao điểm của quán.

```text
       ▲
      / \        E2E Tests (Playwright) — 3 Hành trình vàng sống còn
     /---\
    /     \      Integration & Slice Tests (@WebMvcTest, @DataJpaTest)
   /-------\
  /         \    Unit Tests (JUnit 5, Mockito, Vitest) — Định lượng BOM & State
```

---

## 2. Tiêu Chuẩn Kiểm Thử Backend (`backend/`)

### 2.1. Thư viện & Công cụ
- **Trình chạy test:** JUnit 5 (`org.junit.jupiter`).
- **Giả lập dữ liệu:** Mockito (`org.mockito`).
- **Khẳng định kết quả:** AssertJ (`org.assertj.core.api.Assertions.assertThat`).

### 2.2. Các Trường Hợp Bắt Buộc Phải Có Test
1. **Kiểm tra Định lượng BOM & Trừ kho:**
   - Unit test bắt buộc phải xác thực việc trừ định lượng nguyên liệu thô đối với đơn hàng đơn lẻ và đơn có nhiều topping.
   - Kiểm tra trường hợp biên: Khi nguyên liệu tồn kho không đủ $\rightarrow$ đơn hàng bị từ chối và giao dịch `@Transactional` tự động rollback.
2. **Kiểm tra tầng Controller (`@WebMvcTest`):**
   - Kiểm tra các ràng buộc validation (`@NotBlank`, `@Min`, `@Valid`).
   - Kiểm tra cấu trúc vỏ bọc `ApiResponse<T>`.
3. **Kiểm tra Tính lũy kế (Idempotency Replay):**
   - Xác thực việc gửi cùng một `X-Idempotency-Key` 2 lần chỉ thực thi giao dịch đúng 1 lần và trả về kết quả giống nhau.

---

## 3. Tiêu Chuẩn Kiểm Thử Frontend (`frontend/`)

### 3.1. Thư viện & Công cụ
- **Unit & Store Test:** **Vitest** + React Testing Library.
- **Tự động hóa trình duyệt E2E:** **Playwright**.

### 3.2. Các Trường Hợp Bắt Buộc Phải Có Test
1. **Zustand Slices:**
   - Kiểm tra cập nhật trạng thái tức thì (optimistic updates) trong `useCartStore` (thêm, sửa số lượng, xóa món).
   - Kiểm tra logic reconcile đồng bộ lại dữ liệu khi STOMP báo sự kiện mới.
2. **Hiển thị Component:**
   - Kiểm tra món ăn khi hết hàng phải hiển thị badge "Hết món" và vô hiệu hóa nút thêm vào giỏ.
   - Kiểm tra tiền tệ luôn được format đúng định dạng số nguyên Việt Nam Đồng (`35.000 đ`).

---

## 4. Ba Hành Trình Vàng Sống Còn E2E (Playwright)
Pipeline CI bắt buộc phải chạy thành công 3 luồng E2E sau trước khi phát hành phiên bản mới:
1. **Hành trình Khách hàng:** Truy cập `/qr/table-01` $\rightarrow$ duyệt menu $\rightarrow$ chọn topping $\rightarrow$ gửi đơn hàng $\rightarrow$ xác nhận trạng thái đơn cập nhật.
2. **Hành trình Bếp KDS:** Bếp nhận đơn mới qua STOMP $\rightarrow$ đầu bếp bấm "Nhận món" (Cooking) $\rightarrow$ bấm "Xong" (Done).
3. **Hành trình Thu ngân POS:** Mở hóa đơn bàn $\rightarrow$ chọn chế độ chia tiền theo món (Itemized Split) $\rightarrow$ xác nhận thanh toán $\rightarrow$ bàn chuyển về trạng thái `VACANT` (Trống).

---

## 5. Cổng Kiểm Soát Chất Lượng Trước Khi Merge (Quality Gates)
Một Pull Request sẽ bị chặn merge nếu không vượt qua các điều kiện sau:
- `pnpm --filter frontend type-check` (0 lỗi TypeScript)
- `pnpm --filter frontend lint` (0 lỗi Linting)
- `cd backend && ./mvnw test` (Toàn bộ Unit & Slice test đều xanh)
- Độ bao phủ kiểm thử (Coverage) đạt tối thiểu **70%** ở các Service nghiệp vụ lõi (`OrderService`, `InventoryService`).
