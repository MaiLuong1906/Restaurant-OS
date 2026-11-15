# Restaurant OS — Deep-dive màn hình khách hàng (Sprint 1)

Chuẩn bị cho: menu QR + thẻ món 3D tilt, theo tài liệu v1.1 và stack đã chốt
(Next.js 15 App Router, Tailwind v4, Zustand, STOMP WebSocket <50ms).
Cập nhật: 2026-10-16.

## 1. Mục tiêu Sprint 1 (phía khách hàng)

Tài liệu chốt: "Giao diện Mobile Web cho khách: Quét QR xem menu, chọn món, gửi đơn đặt."
Bàn giao = demo hoàn chỉnh luồng: điện thoại quét QR → gọi món → đơn hiện ngay trên KDS.

## 2. Cây route (App Router)

```
app/
  qr/[tableId]/page.tsx        # xác thực bàn + animation chào
  menu/page.tsx                # danh mục sticky, tìm kiếm, filter còn/hết realtime
  dish/[dishId]/page.tsx       # chi tiết món (hoặc bottom-sheet trong menu)
  cart/page.tsx                # giỏ hàng nhóm realtime
  checkout/page.tsx            # chia đều / ai gọi nấy trả, QR MoMo/VietQR
```

## 3. Chi tiết từng màn hình

### 3.1. `/qr/[tableId]` — xác thực bàn + màn chào (wow đầu tiên)

- Gọi `GET /api/v1/tables/{id}` để xác thực bàn còn hợp lệ, lấy tên bàn + nhà hàng.
- Animation chào: logo nhà hàng xoay 3D nhẹ bằng CSS `perspective` + `rotateY` theo
  nghiêng điện thoại (`deviceorientation`), kèm sóng lan tỏa (ripple).
- Rất nhẹ, không cần Three.js. Tự tắt sau ~1.2s hoặc khi user chạm để vào menu.

### 3.2. Menu — màn quan trọng nhất (đi sâu)

**Bố cục:** danh mục sticky bên trái/trên, tìm kiếm, filter "còn món" realtime
(khi kho chạm ngưỡng, backend đẩy qua STOMP → khóa món ngay, không cần reload).

**Thẻ món 3D tilt (điểm ấn tượng chính):**
- Dùng Framer Motion, giới hạn góc nghiêng 5–8°. Tilt theo touch/drag trên mobile,
  theo chuột trên desktop. Tuyệt đối chỉ animate `transform` + `opacity` (GPU lo).
- Ảnh món hơi parallax so với khung + bóng đổ mềm động theo góc nghiêng.
- Ảnh: WebP (Supabase Storage), blur placeholder, `loading="lazy"`, `sizes` đúng
  kích thước thẻ. Ảnh là thủ phạm lag số 1 trên mobile.
- Code mẫu (sketch):

```tsx
// components/DishCard.tsx
import { motion, useMotionValue, useTransform } from "framer-motion";

export function DishCard({ dish }: { dish: Dish }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  // giới hạn ±8 độ
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const shadowX = useTransform(x, [-0.5, 0.5], [-12, 12]);

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* ảnh + tên + giá + badge hết món */}
    </motion.div>
  );
}
```

- Khi món hết (sold-out realtime): thẻ mờ dần, badge "Hết món", nút thêm bị disable.

### 3.3. Chi tiết món — bottom-sheet

- Modal trượt lên kiểu bottom-sheet, đóng bằng vuốt xuống.
- "Xoay 360°" giả: dùng 3–5 ảnh chụp góc khác nhau, kéo ngang để đổi ảnh
  (không cần model 3D thật, không tốn GPU).
- Topping/độ cay/ngọt (JSONB theo tài liệu): chip chọn nảy lên có spring khi chạm.
- Chọn số lượng → nút "Thêm vào giỏ nhóm" có haptic nhẹ (nếu thiết bị hỗ trợ).

### 3.4. Giỏ hàng nhóm realtime (tính năng khác biệt)

- WebSocket STOMP: topic `/topic/tables/{tableId}/cart`. Mỗi người trong bàn thêm
  món → avatar của họ "bay" vào giỏ kèm pulse, mọi máy cùng bàn thấy ngay (<50ms).
- Zustand slice `cartStore`: items theo từng người, optimistic update + reconcile
  khi server trả về.
- Chat nhanh trong giỏ: "thêm đá nhé" — tin nhắn ngắn, không cần full chat.

### 3.5. Thanh toán

- 2 chế độ chia: **Chia đều** (Equal Split) / **Ai gọi nấy trả** (Itemized Split).
- Hiển thị trạng thái đã trả của từng người realtime.
- QR MoMo/VietQR theo tài liệu; fallback: gọi nhân viên.

## 4. Ngân sách hiệu năng (không lag trên mobile)

1. Chỉ animate `transform` + `opacity`. Không animate width/height/top/left.
2. Ảnh WebP + blur placeholder + lazy load + `sizes` chuẩn.
3. Code splitting theo route: menu load trước, cart/checkout load sau.
   Mục tiêu: quét QR → thấy menu dưới 2 giây.
4. `prefers-reduced-motion`: tắt tilt/parallax trên máy yếu hoặc user yêu cầu.
5. Nếu dùng Three.js thật (chỉ 1 điểm nhấn, ví dụ hero banner):
   react-three-fiber, model low-poly, tắt shadow, pixel ratio ≤ 1.5,
   có nút fallback 2D. Không dùng cho danh sách món.

## 5. State + realtime (Zustand + STOMP)

```ts
// stores/customer.ts
tableStore:   { tableId, tableName, status }        // từ /qr/[tableId]
menuStore:    { categories, dishes, soldOutIds }    // + subscribe /topic/menu
cartStore:    { itemsByUser, myItems, addOptimistic } // + /topic/tables/{id}/cart
checkoutStore:{ mode: "equal" | "itemized", paidBy } // + /topic/tables/{id}/bill
```

Luồng: QR → join topic bàn → menu (realtime sold-out) → thêm món (optimistic)
→ cart đồng bộ nhóm → checkout chia bill → server khóa bàn + trừ kho (Sprint 3).

## 6. Definition of Done — Sprint 1 (phía khách)

- [ ] Quét QR thật trên điện thoại → vào menu < 2s (mạng 4G).
- [ ] Tilt thẻ món mượt 60fps trên máy tầm trung (test trên 1 máy Android yếu).
- [ ] 2 điện thoại cùng bàn: người A thêm món → máy B thấy avatar + món < 1s.
- [ ] Backend khóa món (hết kho) → menu khóa ngay không reload.
- [ ] Checkout chia đều + ai gọi nấy trả, hiện QR thanh toán.
- [ ] Đơn từ điện thoại hiện trên KDS kèm chuông báo.
- [ ] Bật `prefers-reduced-motion` → không còn tilt/parallax, vẫn dùng được.

## 7. Việc cần chuẩn bị trước khi code

- Backend Sprint 1: API menu (danh mục, món, topping, trạng thái), API QR bàn,
  STOMP topics cho cart/menu/bill (theo tài liệu: Spring Boot 3 + Java 21).
- Ảnh món mẫu trên Supabase Storage (WebP, nhiều kích thước).
- Mock data menu để frontend code song song khi backend chưa xong.
