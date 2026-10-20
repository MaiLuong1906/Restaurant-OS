---
name: create-feature-screen
description: >-
  Sử dụng kỹ năng này khi người dùng yêu cầu tạo mới một màn hình, trang (page), giao diện hoặc cụm component trong ứng dụng Next.js 15 frontend. Đảm bảo tuân thủ đúng Route Group, phân tầng Dumb/Smart component và ngân sách hiệu năng.
---

# Kỹ Năng: Khởi Tạo Màn Hình Mới Chuẩn Kiến Trúc (create-feature-screen)

Quy trình chuẩn từng bước để tạo một màn hình mới trong `frontend/app/`.

---

## Bước 1: Xác Định Đúng Route Group Phù Hợp

Hỏi hoặc xác định rõ màn hình thuộc phân hệ nào:
1. **Khách hàng (`app/(customer)/`):** Dành cho khách quét QR tại bàn. 
   - *Bắt buộc:* Giao diện di động, vuốt chạm mượt mà, dùng WebP lazy load, chỉ animate `transform` và `opacity`. CẤM dùng Three.js.
2. **Tác nghiệp nội bộ (`app/(staff)/`):** Dành cho bếp KDS, quầy thu ngân POS.
   - *Bắt buộc:* Nền tối `#0B0F14`, độ tương phản cao, phím bấm $\ge 48\times 48\text{px}$. Không dùng animation 3D hay parallax màu mè.
3. **Quản trị văn phòng (`app/(admin)/`):** Dashboard, Quản lý Menu, Kho BOM, Nhân sự.
   - *Bắt buộc:* Giao diện Desktop nhiều cột, thanh điều hướng sidebar, bảng biểu dữ liệu lớn.
4. **Nhân viên cá nhân (`app/(me)/`):** Xem ca làm việc, chấm công QR/GPS.

---

## Bước 2: Tra Cứu Trí Tuệ Thiết Kế Từ `ui-ux-pro-max` (Design Intelligence)
Trước khi code giao diện, AI kích hoạt `ui-ux-pro-max` để lấy phong cách, bảng màu và typography chuẩn:
```bash
# Tra cứu phong cách & bảng màu F&B chuẩn
python .agents/skills/ui-ux-pro-max/scripts/search.py "restaurant food menu" --domain product
python .agents/skills/ui-ux-pro-max/scripts/search.py "restaurant" --domain color
python .agents/skills/ui-ux-pro-max/scripts/search.py "modern luxury" --domain typography
```
- Sử dụng đúng mã màu Semantic token đã tra cứu (ví dụ: Primary `#DC2626`, Accent `#A16207`).
- Sử dụng đúng font chữ đề xuất (ví dụ: Playfair Display + Plus Jakarta Sans).

---

## Bước 3: Phân Tách Cấu Trúc File Chuẩn Mực

Khi tạo màn hình `[feature-name]`, KHÔNG dồn toàn bộ code vào `page.tsx`. Bắt buộc tách làm 3 tầng:

```text
frontend/
├── app/(customer)/[feature-name]/
│   └── page.tsx                    # Smart Container: kết nối store/API, bọc layout
├── components/[domain]/
│   └── [FeatureView].tsx           # Component nghiệp vụ hiển thị dữ liệu
└── components/ui/                  # Các UI primitive dùng chung (Button, Input, Modal)
```

### Nguyên tắc bất biến:
- `components/ui/` chỉ chứa *Dumb Component* nhận `props` và bắn `event`. CẤM gọi Zustand store hay fetch API trong `components/ui/`.
- Tiền tệ hiển thị bắt buộc định dạng số nguyên VND (`formatVndCurrency(amount)`).

---

## Bước 4: Kiểm Tra Ngân Sách Hiệu Năng (Self-Check)
- Nếu có hiệu ứng xoay 3D (ví dụ thẻ món): Khóa cứng góc nghiêng $\pm 8^\circ$, dùng Framer Motion spring (`stiffness: 300, damping: 25`).
- Nếu có hình ảnh: Kiểm tra đã có `loading="lazy"`, thuộc tính `sizes` và blur placeholder chưa.

---

## Bước 5: Xác Nhận & Báo Cáo
Sau khi tạo file xong, giải thích ngắn gọn:
- Đường dẫn file đã tạo.
- Thuộc Route Group nào và các ràng buộc hiệu năng đã được áp dụng.
