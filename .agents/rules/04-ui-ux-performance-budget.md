# Quy Tắc 04: Ngân Sách Hiệu Năng & Thiết Kế Công Thái Học (UI/UX)

## 1. Ngân Sách Hiệu Năng Cho Web Mobile Khách Hàng

Màn hình khách hàng chạy trên điện thoại thông minh phổ thông qua mạng 4G/WiFi. Độ mượt mà (60fps) và tốc độ phản hồi là yếu tố sống còn.

### Ràng buộc kỹ thuật cứng:
1. **Chỉ Animate Bằng Phần Cứng (GPU-Accelerated):**
   - **BẮT BUỘC:** Chỉ animate 2 thuộc tính: `transform` (`scale`, `translate`, `rotate`) và `opacity`.
   - **TUYỆT ĐỐI CẤM:** Animate các thuộc tính gây tính toán lại bố cục (Reflow) như `width`, `height`, `top`, `left`, `margin`, `padding` (thủ phạm gây giật lag trên mobile).
2. **Quy Chuẩn Hiệu Ứng 3D Tilt Thẻ Món:**
   - Góc nghiêng bị khóa cứng trong khoảng $\pm 5^\circ$ đến $\pm 8^\circ$.
   - Dùng lò xo vật lý của Framer Motion (`stiffness: 300, damping: 25`).
   - Xoay thẻ theo cử chỉ vuốt/chạm `onPointerMove` trên điện thoại và theo tọa độ chuột trên máy tính.
3. **Tối Ưu Hóa Hình Ảnh:**
   - Định dạng: Chuẩn **WebP** hoặc **AVIF** lưu trên Supabase Storage.
   - Thẻ `<img>` hoặc `<Image>` phải có:
     - `loading="lazy"` (trừ banner đầu trang)
     - Thuộc tính `sizes` khớp kích thước hiển thị thực tế
     - Hiệu ứng làm mờ nhẹ khi đang tải (blur placeholder)
   - Trải nghiệm "xoay 360°" của món ăn dùng chuỗi 3–5 ảnh chụp các góc (sprite); **CẤM tải mô hình 3D thật hoặc nạp thư viện Three.js**.
4. **Phản Hồi Rung Nhẹ (Haptic Feedback):**
   - Kích hoạt rung vi mô (`navigator.vibrate(15)`) trên điện thoại khi khách thêm món vào giỏ hoặc xác nhận chia tiền.

---

## 2. Thiết Kế Công Thái Học Màn Hình Nội Bộ (KDS & POS)

Nhân viên nhà hàng và đầu bếp làm việc dưới áp lực cao, ánh sáng phức tạp, ngón tay dính nước/dầu mỡ. Giao diện ưu tiên **nhìn nhanh, bấm chắc**, không màu mè.

### Ràng buộc kỹ thuật cứng:
1. **Bảng Màu & Độ Tương Phản:**
   - Nền KDS: Tông màu tối sâu `#0B0F14` hoặc `#121820` để chống chói mắt.
   - Chữ chính: Trắng tương phản cao `#FFFFFF` với cỡ chữ lớn để đứng cách xa 2m vẫn đọc được.
   - Ghi chú tùy chọn: **In đậm màu vàng nổi bật `#FACC15`** (ví dụ: **"Ít đá, không hành"**).
   - Cảnh báo trễ món: Màu cam `#F97316` khi món chờ $>15$ phút; Đỏ rực `#EF4444` khi chờ $>25$ phút.
2. **Kích Thước Vùng Bấm Cảm Ứng (Touch Target):**
   - Mọi nút bấm tác nghiệp ("Nhận món", "Xong", "Đóng bàn") phải đạt kích thước tối thiểu **$48 \times 48\text{px}$** (ưu tiên dạng nút trải dài toàn bộ thẻ trên KDS).
   - Không dùng menu dropdown nhỏ li ti hay icon khó bấm.
3. **Thuật Toán Gom Món 5 Phút (Kitchen Batching Display):**
   - Tự động gom các món giống hệt nhau từ nhiều bàn trong **cửa sổ trượt 5 phút**.
   - Điều kiện gom: Cùng `dishId` + **cùng tùy chọn modifiers JSONB**.
   - Ví dụ: 3 đĩa "Mì xào bò" nhưng có 1 đĩa "không hành" $\rightarrow$ Hiển thị: `Mì xào bò ×3 (1 không hành)`.
   - **Lưu ý:** Gom món chỉ diễn ra ở tầng giao diện hiển thị. Trong database, mỗi đĩa vẫn là một dòng riêng biệt để tính thời gian và trừ kho chính xác cho từng bàn.
4. **Nói Không Với Hiệu Ứng Thừa:**
   - Tuyệt đối không dùng 3D tilt, parallax hay animation chuyển cảnh rườm rà trên màn hình bếp KDS và quầy thu ngân POS.
