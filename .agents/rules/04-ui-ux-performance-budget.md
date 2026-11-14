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

---

## 3. Hệ Thống Thiết Kế UI/UX & Công Thái Học Admin Portal

Giao diện quản trị Admin phục vụ chủ nhà hàng và quản lý ca làm việc liên tục với bảng dữ liệu lớn và báo cáo tài chính. Giao diện phải đảm bảo tính rõ ràng, phân cấp thị giác mạch lạc và không gây mỏi mắt:

### Ràng buộc kỹ thuật cứng:
1. **Phân Tách Tuyệt Đối Màu Brand Primary & Destructive Actions:**
   - **Màu thương hiệu chính (`bg-ops-brand` `#8C1D2C`):** Chỉ dùng cho các hành động chính tích cực (Primary Action: Ký số, Tạo món mới, Tab đang chọn, Điểm nhấn thương hiệu).
   - **Màu nguy hiểm / Phá hoại (`bg-rose-600` / `#DC2626`):** Bắt buộc dùng riêng cho các hành động hủy, hoàn tiền, xóa dữ liệu, cảnh báo rủi ro. Tuyệt đối không dùng màu đỏ brand cho nút hủy giao dịch để tránh nhầm lẫn nhận thức của người thao tác.
2. **Phân Cấp Nút Bấm Trong Modal (Button Hierarchy):**
   - Mỗi Modal chỉ có **duy nhất 1 nút Primary** mang màu nhận diện rõ rệt.
   - Các nút phụ trợ (Đóng, Gửi Zalo/In) phải là **Secondary Action** với tông màu trung tính (`bg-stone-100` hoặc outline xám). Nút "Đóng" tuyệt đối không mang viền đỏ nổi bật tranh chấp sự chú ý với nút hành động chính.
3. **Quy Chuẩn Sử Dụng Font Chữ (Mono vs Sans):**
   - `font-mono` (JetBrains Mono) **chỉ dùng cho:** Số tiền (VND), số lượng, tỷ lệ phần trăm KPI, mã bill/bàn, timestamp giờ/phút.
   - Các nhãn (label), tiêu đề, văn bản hướng dẫn phải dùng `font-ops` (Be Vietnam Pro) với định dạng **Sentence case** thay vì lạm dụng ALL-CAPS font mono gây khó đọc.
4. **Tính Nhất Quán Giữa Toolbar & Bảng Dữ Liệu:**
   - Cột dữ liệu căn lề nào (căn trái hay căn phải) thì tiêu đề Header của cột đó **bắt buộc phải căn lề đồng bộ** tương ứng.
   - Ô tìm kiếm (Search Input), Dropdown Select và Filter Pills trên cùng thanh công cụ phải có chung chiều cao, độ dày viền (`border-stone-200`) và phong cách thị giác.
5. **Độ Tương Phản & Biểu Mẫu Nhập Liệu:**
   - Placeholder text phải đảm bảo độ tương phản đọc được (tối thiểu `text-stone-400` / `text-stone-500`).
   - Mọi trường bắt buộc trong form phải có dấu `*` đánh dấu rõ ràng.
   - Định dạng thời gian tác nghiệp trong nhà hàng thống nhất chuẩn 24 giờ (ví dụ `19:30`), không trộn lẫn định dạng 12h AM/PM.
