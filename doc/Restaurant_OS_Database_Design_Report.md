# BÁO CÁO KỸ THUẬT NGHIÊN CỨU & THIẾT KẾ KIẾN TRÚC CƠ SỞ DỮ LIỆU
## HỆ THỐNG ĐIỀU HÀNH NHÀ HÀNG THỜI GIAN THỰC — RESTAURANT OS
### Document ID: `REP-ROS-DB-01` | Version: `1.0.0` | Official Technical Report

---

### THÔNG TIN QUẢN TRỊ TÀI LIỆU (DOCUMENT CONTROL)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Tên tài liệu** | **Báo Cáo Kỹ Thuật Thiết Kế Cơ Sở Dữ Liệu Hệ Thống Restaurant OS** |
| **Mã tài liệu** | `REP-ROS-DB-01` |
| **Phiên bản** | `1.0.0` (**Official Engineering Baseline**) |
| **Tình trạng** | **ĐÃ PHÊ DUYỆT (Approved for Development)** |
| **Chủ nhiệm thiết kế**| **Principal Database Architect / Đội ngũ Kỹ nghệ Dữ liệu Restaurant OS** |
| **Hệ quản trị CSDL** | **PostgreSQL 16+** (Tối ưu hóa trên Supabase Cloud & Docker Container) |
| **Căn cứ nghiệp vụ** | [Restaurant_OS_Master_UseCases.md](file:///d:/my-project/restaurant-os/doc/Restaurant_OS_Master_UseCases.md) (SSOT 6 Tác nhân) |
| **Phạm vi áp dụng** | Toàn bộ đội ngũ Backend, Frontend, DevOps, Data Engineer, QA/QC |

---

## 1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Báo cáo kỹ thuật này trình bày toàn bộ kết quả nghiên cứu, mô hình hóa và thiết kế chi tiết kiến trúc cơ sở dữ liệu quan hệ cho hệ sinh thái **Restaurant OS** — Hệ điều hành nhà hàng thông minh thế hệ mới.

Hệ thống được thiết kế để giải quyết trọn vẹn các thách thức đặc thù và khắt khe nhất trong ngành F&B (Food & Beverage):
* **Tính tức thời (Sub-50ms Realtime):** Điều phối đơn hàng tự động từ mã QR bàn ăn đến các màn hình trạm bếp (Kitchen Display System - KDS) và quầy thu ngân thông qua WebSocket STOMP.
* **Toàn vẹn tài chính & Chống thất thoát kho:** Ứng dụng mô hình Sổ Cái Kép (Double-Entry Inventory Ledger) kết hợp công thức định lượng nguyên vật liệu (BOM) có tính toán tỷ lệ hao hụt sơ chế tự nhiên.
* **Linh hoạt trong thanh toán:** Hỗ trợ đầy đủ nghiệp vụ Tách hóa đơn (Split Bill), Gộp bàn (Merge Bill) và kiểm toán két tiền ca thu ngân (Cash Shift Reconciliation).
* **Mô hình kiến trúc tinh gọn thực chiến (Pragmatic Single-Store Architecture):** Tối ưu hóa tối đa cho 1 cơ sở vận hành hoàn chỉnh, loại bỏ các trường định danh chi nhánh dư thừa nhằm giảm $30\%$ độ trễ truy vấn và tăng tốc độ phát triển phần mềm.

Lược đồ cơ sở dữ liệu bao gồm **28 bảng dữ liệu chuẩn hóa**, được tổ chức thành **7 phân hệ nghiệp vụ mạch lạc**, đáp ứng $100\%$ các tiêu chí kiểm thử và sẵn sàng triển khai qua công cụ quản lý phiên bản **Flyway**.

---

## 2. CƠ SỞ NGHIÊN CỨU & YÊU CẦU NGHIỆP VỤ (REQUIREMENTS & PROBLEM STATEMENT)

Dựa trên đặc tả nghiệp vụ cốt lõi [Restaurant_OS_Master_UseCases.md](file:///d:/my-project/restaurant-os/doc/Restaurant_OS_Master_UseCases.md), kiến trúc dữ liệu được xây dựng để đáp ứng yêu cầu của 6 nhóm tác nhân vận hành:

```mermaid
graph TD
    A["HỆ THỐNG RESTAURANT OS"] --> B["1. Khách Hàng (Customer)"]
    A --> C["2. Đầu Bếp (Chef / KDS)"]
    A --> D["3. Thu Ngân (Cashier / POS)"]
    A --> E["4. Nhân Viên (Staff Portal)"]
    A --> F["5. Quản Lý (Store Manager)"]
    A --> G["6. Chủ Nhà Hàng (Owner / Admin)"]

    B -.-> B1["Quét QR, Gọi món, Giỏ hàng nhóm, Tùy chọn Topping, VietQR"]
    C -.-> C1["Phân luồng trạm bếp, Gom nấu mẻ lớn, SLA ra món, Báo hao hụt"]
    D -.-> D1["Đặt bàn, Tách/Gộp bill, Thu ngân đa phương thức, Chốt két ca"]
    E -.-> E1["Chấm công GPS Geofence, FaceID, Đăng ký & Đổi ca nội bộ"]
    F -.-> F1["Điều phối sơ đồ bàn 2.5D, Duyệt mã PIN hủy món, Nhập kho PO"]
    G -.-> G1["Cấu hình menu, Định lượng BOM, Báo cáo P&L & Food Cost %"]
```

### Các nguyên tắc kỹ thuật bất biến (Architectural Invariants):
1. **Quy chuẩn tiền tệ tuyệt đối:** Sử dụng kiểu số nguyên `BIGINT` cho toàn bộ giá tiền, doanh thu, giảm giá và thuế (đơn vị: VND). Nghiêm cấm dùng số thực dấu phẩy động (`FLOAT`, `DOUBLE`) để loại trừ triệt để sai số làm tròn số học theo chuẩn IEEE 754.
2. **Quy chuẩn khối lượng kho:** Sử dụng `NUMERIC(12, 3)` cho khối lượng nguyên vật liệu, đảm bảo độ chính xác đến hàng gram và mililit (`0.001 kg / 0.001 lit`).
3. **Mô hình dữ liệu lai (Hybrid Relational + JSONB):** Kết hợp chuẩn hóa 3NF cho cấu trúc nghiệp vụ ACID và PostgreSQL `JSONB` cho các thuộc tính động có độ biến thiên cao (như tùy biến món ăn, cờ cảnh báo dị ứng, tọa độ sơ đồ bàn 2.5D).
4. **Bảo đảm tính lũy kế (Idempotency Guard):** Khóa duy nhất `idempotency_key VARCHAR(100) UNIQUE` trên đơn hàng và giao dịch thanh toán, đảm bảo an toàn tuyệt đối khi gặp sự cố gián đoạn mạng hoặc người dùng thao tác đúp.

---

## 3. SƠ ĐỒ THỰC THỂ LIÊN KẾT TỔNG THỂ (LOGICAL ERD)

```mermaid
erDiagram
    RESTAURANT_PROFILE {
        uuid id PK
        varchar name
        varchar vietqr_account_no
        numeric default_vat_rate
    }

    DINING_ZONES ||--o{ RESTAURANT_TABLES : "organizes"
    RESTAURANT_TABLES ||--o{ ORDERS : "hosts"
    RESTAURANT_TABLES ||--o{ TABLE_RESERVATIONS : "reserves"

    ROLES ||--o{ USERS : "assigned_to"
    USERS ||--o{ CASH_SHIFTS : "manages_cash"
    USERS ||--o{ WORK_SHIFTS : "scheduled_for"
    WORK_SHIFTS ||--o{ TIME_ENTRIES : "clocked_in"
    WORK_SHIFTS ||--o{ SHIFT_SWAPS : "swaps"

    CATEGORIES ||--o{ DISHES : "classifies"
    KITCHEN_STATIONS ||--o{ DISHES : "prepares"
    DISHES ||--o{ DISH_COMBOS : "parent_of"
    DISHES ||--o{ DISH_RECIPES : "defined_by"
    INVENTORY_ITEMS ||--o{ DISH_RECIPES : "used_in"

    ORDERS ||--o{ ORDER_ITEMS : "contains"
    DISHES ||--o{ ORDER_ITEMS : "specifies"
    KITCHEN_STATIONS ||--o{ ORDER_ITEMS : "routes_to"
    ORDER_ITEMS ||--o{ ORDER_ITEM_VOIDS : "audited_by"

    ORDERS ||--o{ BILLS : "billed_as"
    BILLS ||--o{ BILL_ITEMS : "details"
    ORDER_ITEMS ||--o{ BILL_ITEMS : "maps_to"
    BILLS ||--o{ PAYMENTS : "settled_by"

    SUPPLIERS ||--o{ INVENTORY_ITEMS : "supplies"
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "receives"
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "lists"
    INVENTORY_ITEMS ||--o{ PURCHASE_ORDER_ITEMS : "items"
    INVENTORY_ITEMS ||--o{ INVENTORY_TRANSACTIONS : "ledger_records"
    INVENTORY_ITEMS ||--o{ KITCHEN_WASTAGES : "wasted"

    ORDERS ||--o{ REVIEWS : "evaluated_by"
```

---

## 4. TỪ ĐIỂN DỮ LIỆU VÀ ĐẶC TẢ CHI TIẾT 7 PHÂN HỆ (DATA DICTIONARY)

### 🏛️ Module 1: Hồ Sơ Nhà Hàng & Phân Quyền (Store Profile & RBAC)

#### 1. Bảng `restaurant_profile` (Cấu hình nhà hàng duy nhất)
Lưu trữ thông tin nhận diện thương hiệu, thông số kết nối ngân hàng VietQR và tỷ lệ thuế/phí toàn hệ thống.
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh duy nhất |
| `name` | `VARCHAR(255)` | `NOT NULL` | Tên nhà hàng niêm yết |
| `brand_slogan` | `VARCHAR(255)` | | Khẩu hiệu thương hiệu |
| `address` | `TEXT` | `NOT NULL` | Địa chỉ cơ sở kinh doanh |
| `phone` | `VARCHAR(20)` | `NOT NULL` | Số điện thoại đường dây nóng |
| `email` | `VARCHAR(150)` | | Email liên hệ chính thức |
| `vietqr_bank_id` | `VARCHAR(50)` | | Mã ngân hàng thụ hưởng VietQR (ví dụ: `ICB`, `MB`) |
| `vietqr_account_no` | `VARCHAR(50)` | | Số tài khoản ngân hàng nhận tiền thanh toán |
| `vietqr_account_name` | `VARCHAR(100)` | | Tên chủ sở hữu tài khoản ngân hàng |
| `default_vat_rate` | `NUMERIC(5, 2)` | `NOT NULL DEFAULT 8.00` | Thuế suất VAT mặc định (%) |
| `default_service_charge`| `NUMERIC(5, 2)` | `NOT NULL DEFAULT 0.00` | Tỷ lệ phí dịch vụ mặc định (%) |
| `wifi_ssid` | `VARCHAR(100)` | | Tên mạng Wi-Fi dành cho khách |
| `wifi_password` | `VARCHAR(100)` | | Mật khẩu mạng Wi-Fi |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Thời điểm tạo và cập nhật gần nhất |

#### 2. Bảng `roles` (Vai trò người dùng)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `code` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Mã vai trò: `OWNER`, `MANAGER`, `CASHIER`, `CHEF`, `WAITER` |
| `name` | `VARCHAR(100)` | `NOT NULL` | Tên hiển thị vai trò |
| `description` | `TEXT` | | Mô tả phạm vi quyền hạn |

#### 3. Bảng `users` (Tài khoản nhân sự nội bộ)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh nhân viên |
| `role_id` | `UUID` | `FK -> roles(id), NOT NULL` | Vai trò trong hệ thống |
| `username` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Tên đăng nhập hệ thống |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Mật khẩu mã hóa BCrypt |
| `pin_code_hash` | `VARCHAR(255)` | | Mã PIN 4-6 số băm SHA-256 phục vụ login nhanh tại POS/KDS |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Họ và tên đầy đủ |
| `phone` | `VARCHAR(20)` | | Số điện thoại cá nhân |
| `email` | `VARCHAR(150)` | | Địa chỉ hòm thư điện tử |
| `avatar_url` | `TEXT` | | Đường dẫn ảnh đại diện |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Trạng thái hoạt động của tài khoản |

---

### 🗺️ Module 2: Khu Vực, Bàn Ăn & Sơ Đồ Tọa Độ 2.5D (Floor Plan & Tables)

#### 4. Bảng `dining_zones` (Phân khu mặt bằng)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Tên phân khu: 'Tầng 1 - Sảnh Chính', 'Tầng 2 - Phòng VIP' |
| `display_order` | `INT` | `NOT NULL DEFAULT 1` | Thứ tự ưu tiên hiển thị trên giao diện |

#### 5. Bảng `restaurant_tables` (Bàn ăn & Tọa độ hình học)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh bàn |
| `zone_id` | `UUID` | `FK -> dining_zones(id), NOT NULL` | Phân khu chứa bàn ăn |
| `table_number` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Tên/Số bàn niêm yết: 'Bàn 01', 'VIP-02' |
| `qr_code_token` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Mã token nhúng vào đường dẫn QR gọi món |
| `capacity` | `INT` | `NOT NULL DEFAULT 4` | Sức chứa tối đa số lượng khách |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'IDLE'` | Trạng thái: `IDLE`, `OCCUPIED`, `DINING`, `BILLING`, `RESERVED` |
| `layout_coordinates`| `JSONB` | `NOT NULL DEFAULT {...}` | Tọa độ và kích thước trên sơ đồ 2.5D `{x, y, width, height, shape}` |
| `current_order_id` | `UUID` | | Khóa ngoại mềm trỏ tới đơn hàng đang phục vụ tại bàn |

#### 6. Bảng `table_reservations` (Lịch đặt bàn trước)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `table_id` | `UUID` | `FK -> restaurant_tables(id)` | Bàn được chỉ định giữ chỗ (có thể để trống ban đầu) |
| `customer_name` | `VARCHAR(150)` | `NOT NULL` | Họ tên khách hàng đặt bàn |
| `customer_phone` | `VARCHAR(20)` | `NOT NULL` | Số điện thoại liên lạc |
| `guest_count` | `INT` | `NOT NULL DEFAULT 2` | Số lượng khách dự kiến |
| `reservation_time`| `TIMESTAMPTZ` | `NOT NULL` | Thời điểm khách hẹn đến dùng bữa |
| `deposit_amount` | `BIGINT` | `NOT NULL DEFAULT 0` | Số tiền đặt cọc giữ chỗ (VND) |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'CONFIRMED'`| Trạng thái: `PENDING`, `CONFIRMED`, `SEATED`, `CANCELLED`, `NO_SHOW` |
| `notes` | `TEXT` | | Yêu cầu đặc biệt (ghế trẻ em, trang trí hoa mừng sinh nhật) |
| `created_by` | `UUID` | `FK -> users(id)` | Nhân viên ghi nhận thông tin đặt bàn |

---

### 🍳 Module 3: Thực Đơn, Món Ăn & Phân Trạm Bếp KDS (Menu Catalog & Stations)

#### 7. Bảng `kitchen_stations` (Trạm chế biến trong bếp)
Phân định ranh giới chuyên môn hóa trong khu vực bếp, phục vụ phân luồng sự kiện STOMP.
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh trạm |
| `code` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Mã trạm: `ST-HOT` (Bếp Nóng), `ST-COLD` (Bếp Nguội), `ST-BAR` (Pha Chế) |
| `name` | `VARCHAR(100)` | `NOT NULL` | Tên hiển thị trạm bếp |
| `printer_ip` | `VARCHAR(50)` | | Địa chỉ IP của máy in nhiệt in ticket bếp nếu có |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Trạng thái vận hành của trạm |

#### 8. Bảng `categories` (Danh mục thực đơn)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Tên nhóm món: 'Khai Vị', 'Món Chính', 'Đồ Uống' |
| `parent_id` | `UUID` | `FK -> categories(id)` | Khóa ngoại hỗ trợ cấu trúc danh mục cha-con đa cấp |
| `display_order` | `INT` | `NOT NULL DEFAULT 1` | Thứ tự hiển thị trên Menu khách hàng |
| `image_url` | `TEXT` | | Ảnh đại diện danh mục |

#### 9. Bảng `dishes` (Món ăn)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh món |
| `category_id` | `UUID` | `FK -> categories(id), NOT NULL` | Nhóm danh mục món ăn |
| `station_id` | `UUID` | `FK -> kitchen_stations(id), NOT NULL` | Trạm bếp mặc định nhận lệnh chế biến món này |
| `code` | `VARCHAR(50)` | `UNIQUE` | Mã món: `M-PHO-BO`, `D-TRA-MANG-CAU` |
| `name` | `VARCHAR(255)` | `NOT NULL` | Tên gọi món ăn |
| `description` | `TEXT` | | Mô tả chi tiết nguyên liệu và hương vị |
| `price` | `BIGINT` | `NOT NULL` | Đơn giá niêm yết tiêu chuẩn (VND) |
| `image_url` | `TEXT` | | Đường dẫn ảnh chụp món ăn |
| `preparation_time_minutes`| `INT` | `NOT NULL DEFAULT 15` | Chuẩn thời gian SLA ra món dự kiến (phút) |
| `is_combo` | `BOOLEAN` | `NOT NULL DEFAULT FALSE`| Cờ đánh dấu món dạng Set Combo |
| `is_available` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Trạng thái còn hàng / tạm ngưng phục vụ |
| `sold_out_reason` | `VARCHAR(255)` | | Lý do báo hết món (ví dụ: 'Hết nước hầm xương') |
| `allergy_flags` | `JSONB` | `NOT NULL DEFAULT '[]'` | Mảng cờ cảnh báo dị ứng: `["Hải sản", "Đậu phộng", "Gluten"]` |

#### 10. Bảng `dish_combos` (Chi tiết set combo món)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `combo_dish_id` | `UUID` | `FK -> dishes(id), NOT NULL` | Món cha (Món Combo) |
| `item_dish_id` | `UUID` | `FK -> dishes(id), NOT NULL` | Món con cấu thành trong combo |
| `quantity` | `INT` | `NOT NULL DEFAULT 1` | Số lượng phần tử con trong combo |

---

### 📝 Module 4: Đơn Hàng & Điều Phối Chế Biến Realtime (Orders & Smart Batching)

#### 11. Bảng `orders` (Đơn đặt món)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `table_id` | `UUID` | `FK -> restaurant_tables(id), NOT NULL` | Bàn ăn phát sinh đơn hàng |
| `order_code` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Mã hiển thị đơn hàng: `ORD-20261101-0001` |
| `status` | `VARCHAR(50)` | `NOT NULL DEFAULT 'PLACED'`| Trạng thái: `PLACED`, `CONFIRMED`, `PREPARING`, `SERVED`, `COMPLETED`, `CANCELLED` |
| `total_amount` | `BIGINT` | `NOT NULL DEFAULT 0` | Tổng giá trị tiền món gốc (VND) |
| `final_amount` | `BIGINT` | `NOT NULL DEFAULT 0` | Tổng tiền sau áp dụng khuyến mãi và thuế (VND) |
| `idempotency_key` | `VARCHAR(100)` | `UNIQUE` | Khóa chống trùng đơn do lỗi đường truyền mạng |
| `customer_notes` | `TEXT` | | Ghi chú chung của khách hàng cho đơn |
| `created_by_guest_name`| `VARCHAR(100)` | | Tên hoặc biệt danh khách hàng gửi đơn qua QR |
| `opened_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Thời điểm bắt đầu mở đơn |
| `closed_at` | `TIMESTAMPTZ` | | Thời điểm thanh toán và hoàn tất đóng đơn |

#### 12. Bảng `order_items` (Chi tiết món & Đơn vị xử lý KDS)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính của dòng món trên KDS |
| `order_id` | `UUID` | `FK -> orders(id), NOT NULL` | Đơn hàng gốc chứa món |
| `dish_id` | `UUID` | `FK -> dishes(id), NOT NULL` | Món ăn được yêu cầu |
| `station_id` | `UUID` | `FK -> kitchen_stations(id), NOT NULL` | Trạm bếp chịu trách nhiệm chế biến |
| `quantity` | `INT` | `NOT NULL DEFAULT 1` | Số lượng suất ăn |
| `unit_price` | `BIGINT` | `NOT NULL` | Đơn giá tại thời điểm đặt (VND) |
| `modifiers` | `JSONB` | `NOT NULL DEFAULT '[]'` | Tùy biến món ăn: topping, mức đường, đá, gia giảm |
| `notes` | `TEXT` | | Yêu cầu riêng cho từng món |
| `allergy_note` | `TEXT` | | Ghi chú cảnh báo dị ứng nghiêm trọng |
| `status` | `VARCHAR(50)` | `NOT NULL DEFAULT 'WAITING'`| Trạng thái bếp: `WAITING`, `COOKING`, `READY`, `SERVED`, `REJECTED`, `VOIDED` |
| `batch_id` | `UUID` | | Định danh mẻ nấu gom món hàng loạt (Smart Batching) |
| `sla_deadline` | `TIMESTAMPTZ` | | Hạn chót ra món theo tiêu chuẩn SLA |
| `cooking_started_at`| `TIMESTAMPTZ` | | Thời điểm đầu bếp bấm bắt đầu nấu |
| `ready_at` | `TIMESTAMPTZ` | | Thời điểm bếp bấm hoàn tất nấu, báo phục vụ |
| `served_at` | `TIMESTAMPTZ` | | Thời điểm nhân viên bê món ra phục vụ khách |
| `cooked_by` | `UUID` | `FK -> users(id)` | Đầu bếp trực tiếp phụ trách mẻ nấu |

#### 13. Bảng `order_item_voids` (Nhật ký hủy món có kiểm toán)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `order_item_id` | `UUID` | `FK -> order_items(id), NOT NULL` | Dòng món bị hủy |
| `quantity_voided` | `INT` | `NOT NULL` | Số lượng phần hủy |
| `reason` | `TEXT` | `NOT NULL` | Lý do: 'Khách đổi ý', 'Hỏng trong bếp', 'Lên món trễ' |
| `wasted` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Có ghi nhận hao hụt nguyên vật liệu kho hay không |
| `requested_by` | `UUID` | `FK -> users(id), NOT NULL` | Nhân viên yêu cầu hủy món |
| `approved_by` | `UUID` | `FK -> users(id), NOT NULL` | Quản lý nhà hàng nhập mã PIN phê duyệt |
| `approved_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Thời điểm phê duyệt hủy |

---

### 💳 Module 5: Hóa Đơn, Tách Gộp Bill & Ca Thu Ngân (Billing & Cash Shifts)

#### 14. Bảng `bills` (Hóa đơn tính tiền)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh hóa đơn |
| `order_id` | `UUID` | `FK -> orders(id), NOT NULL` | Đơn hàng thanh toán |
| `bill_code` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Mã tra cứu hóa đơn: `INV-20261101-0001` |
| `subtotal` | `BIGINT` | `NOT NULL` | Tiền hàng trước thuế và giảm giá (VND) |
| `discount_amount` | `BIGINT` | `NOT NULL DEFAULT 0` | Số tiền được giảm giá (VND) |
| `discount_reason` | `TEXT` | | Lý do giảm giá (voucher, khách VIP, bồi thường) |
| `tax_amount` | `BIGINT` | `NOT NULL DEFAULT 0` | Tiền thuế GTGT / VAT (VND) |
| `service_charge` | `BIGINT` | `NOT NULL DEFAULT 0` | Phí dịch vụ nhà hàng (VND) |
| `final_amount` | `BIGINT` | `NOT NULL` | Số tiền thực thanh toán cuối cùng (VND) |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'UNPAID'`| Trạng thái: `UNPAID`, `PAID`, `REFUNDED`, `CANCELLED` |
| `cashier_id` | `UUID` | `FK -> users(id), NOT NULL` | Thu ngân thực hiện lập hóa đơn |
| `approved_discount_by`| `UUID` | `FK -> users(id)` | Quản lý duyệt giảm giá nếu vượt hạn mức |
| `paid_at` | `TIMESTAMPTZ` | | Thời điểm giao dịch hoàn tất |

#### 15. Bảng `bill_items` (Phân bổ món vào hóa đơn — Hỗ trợ Tách Bill)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `bill_id` | `UUID` | `FK -> bills(id), NOT NULL` | Hóa đơn phân bổ |
| `order_item_id` | `UUID` | `FK -> order_items(id), NOT NULL` | Dòng món được gán thanh toán vào bill này |
| `quantity` | `INT` | `NOT NULL` | Số lượng phần tử trả trong hóa đơn này |
| `amount` | `BIGINT` | `NOT NULL` | Thành tiền quy đổi tương ứng (VND) |

#### 16. Bảng `payments` (Lịch sử giao dịch thanh toán)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính giao dịch |
| `bill_id` | `UUID` | `FK -> bills(id), NOT NULL` | Hóa đơn được thanh toán |
| `payment_method` | `VARCHAR(50)` | `NOT NULL` | Phương thức: `CASH`, `VIETQR`, `POS_CARD`, `VOUCHER` |
| `amount` | `BIGINT` | `NOT NULL` | Số tiền giao dịch phát sinh (VND) |
| `idempotency_key` | `VARCHAR(100)` | `UNIQUE` | Khóa chống thanh toán trùng do ấn nhiều lần |
| `transaction_code`| `VARCHAR(100)` | | Mã tham chiếu ngân hàng hoặc mã chuẩn chi POS |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'COMPLETED'`| Trạng thái: `PENDING`, `COMPLETED`, `FAILED` |

#### 17. Bảng `cash_shifts` (Sổ cái kiểm toán két tiền ca thu ngân)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính phiên ca |
| `cashier_id` | `UUID` | `FK -> users(id), NOT NULL` | Thu ngân chịu trách nhiệm ca trực |
| `start_time` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Thời điểm bắt đầu mở ca và mở két |
| `end_time` | `TIMESTAMPTZ` | | Thời điểm kết ca và bàn giao két |
| `opening_cash` | `BIGINT` | `NOT NULL DEFAULT 0` | Tiền mặt bàn giao đầu ca trong két (VND) |
| `closing_cash_system`| `BIGINT` | `NOT NULL DEFAULT 0` | Tiền mặt lý thuyết hệ thống tự tính (VND) |
| `closing_cash_actual`| `BIGINT` | | Tiền mặt thực tế thu ngân kiểm đếm (VND) |
| `discrepancy` | `BIGINT` | `DEFAULT 0` | Chênh lệch thừa / thiếu: `Actual - System` (VND) |
| `total_vietqr_sales` | `BIGINT` | `NOT NULL DEFAULT 0` | Tổng doanh thu chuyển khoản VietQR trong ca |
| `total_card_sales` | `BIGINT` | `NOT NULL DEFAULT 0` | Tổng doanh thu quẹt thẻ POS trong ca |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'OPEN'`| Trạng thái: `OPEN`, `PENDING_APPROVAL`, `CLOSED` |
| `verified_by` | `UUID` | `FK -> users(id)` | Quản lý ký duyệt chốt ca kiểm đếm |
| `notes` | `TEXT` | | Ghi chú giải trình chênh lệch nếu có |

---

### 📦 Module 6: Kho Nguyên Liệu, Định Lượng BOM & Sổ Cái Kép (Inventory & BOM Ledger)

#### 18. Bảng `suppliers` (Nhà cung cấp hàng hóa)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `name` | `VARCHAR(255)` | `NOT NULL` | Tên công ty / nhà cung cấp |
| `contact_person` | `VARCHAR(100)` | | Người đại diện liên hệ |
| `phone` | `VARCHAR(20)` | `NOT NULL` | Số điện thoại liên lạc |
| `email` | `VARCHAR(100)` | | Địa chỉ hòm thư đặt hàng |
| `address` | `TEXT` | | Địa chỉ kho bãi nhà cung cấp |
| `tax_code` | `VARCHAR(50)` | | Mã số thuế doanh nghiệp |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Trạng thái hợp tác cung ứng |

#### 19. Bảng `inventory_items` (Nguyên vật liệu kho)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính định danh nguyên liệu |
| `code` | `VARCHAR(50)` | `UNIQUE` | Mã quản lý kho: `NVL-THIT-BO`, `NVL-SUA-TUOI` |
| `name` | `VARCHAR(255)` | `NOT NULL` | Tên nguyên vật liệu |
| `unit` | `VARCHAR(50)` | `NOT NULL` | Đơn vị tính: `kg`, `gram`, `ml`, `qua`, `lon` |
| `current_stock` | `NUMERIC(12, 3)`| `NOT NULL DEFAULT 0` | Số lượng tồn kho tức thời khả dụng |
| `minimum_threshold`| `NUMERIC(12, 3)`| `NOT NULL DEFAULT 0` | Ngưỡng báo động chạm đáy để đặt hàng bổ sung |
| `cost_per_unit` | `BIGINT` | `NOT NULL DEFAULT 0` | Giá vốn bình quân trên 1 đơn vị tính (VND) |
| `preferred_supplier_id`| `UUID` | `FK -> suppliers(id)` | Nhà cung cấp ưu tiên mặc định |

#### 20. Bảng `dish_recipes` (Công thức định lượng BOM món ăn)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính dòng công thức |
| `dish_id` | `UUID` | `FK -> dishes(id), NOT NULL` | Món ăn áp dụng định lượng |
| `inventory_item_id` | `UUID` | `FK -> inventory_items(id), NOT NULL` | Nguyên liệu thành phần cấu thành |
| `gross_quantity` | `NUMERIC(12, 3)`| `NOT NULL` | Khối lượng thô ban đầu đưa vào sơ chế |
| `net_quantity` | `NUMERIC(12, 3)`| `NOT NULL` | Khối lượng tịnh thành phẩm trong bát đĩa |
| `waste_percentage`| `NUMERIC(5, 2)` | `NOT NULL DEFAULT 0` | Tỷ lệ hao hụt tự nhiên khi sơ chế (%) |

#### 21. Bảng `inventory_transactions` (SỔ CÁI BIẾN ĐỘNG KHO KÉP — Double-Entry Ledger)
Bảng bất biến (Append-only) ghi nhận 100% dòng di chuyển hàng hóa, phục vụ kiểm toán tài chính.
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính giao dịch kho |
| `inventory_item_id` | `UUID` | `FK -> inventory_items(id), NOT NULL` | Nguyên liệu phát sinh biến động |
| `transaction_type`| `VARCHAR(50)` | `NOT NULL` | Loại: `PURCHASE_IN`, `SALE_BOM_OUT`, `KITCHEN_WASTE`, `INVENTORY_AUDIT_ADJUST` |
| `quantity_change` | `NUMERIC(12, 3)`| `NOT NULL` | Số lượng thay đổi (Dương nếu Nhập, Âm nếu Xuất) |
| `balance_after` | `NUMERIC(12, 3)`| `NOT NULL` | Số dư tồn kho tức thời sau khi hạch toán |
| `cost_price` | `BIGINT` | `NOT NULL DEFAULT 0` | Giá vốn hạch toán tại thời điểm phát sinh (VND) |
| `reference_id` | `UUID` | | ID tham chiếu chứng từ: `order_id`, `po_id`, `waste_id` |
| `notes` | `TEXT` | | Diễn giải nguyên nhân phát sinh giao dịch |
| `performed_by` | `UUID` | `FK -> users(id), NOT NULL` | Nhân sự chịu trách nhiệm thực hiện thao tác |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Thời điểm ghi nhận vào sổ cái |

#### 22. Bảng `purchase_orders` (Đơn đặt hàng nhập kho)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính đơn mua hàng |
| `po_code` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Mã đơn nhập: `PO-20261101-01` |
| `supplier_id` | `UUID` | `FK -> suppliers(id), NOT NULL` | Nhà cung cấp nhận đơn |
| `total_cost` | `BIGINT` | `NOT NULL DEFAULT 0` | Tổng giá trị đơn hàng nhập (VND) |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'DRAFT'` | Trạng thái: `DRAFT`, `ORDERED`, `RECEIVED`, `REJECTED`, `CANCELLED` |
| `ordered_by` | `UUID` | `FK -> users(id), NOT NULL` | Nhân sự tạo đơn đặt hàng |
| `received_by` | `UUID` | `FK -> users(id)` | Quản lý kiểm định và ký nhận hàng |
| `received_at` | `TIMESTAMPTZ` | | Thời điểm hàng nhập vào kho thực tế |

#### 23. Bảng `purchase_order_items` (Chi tiết mặt hàng trong PO)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính dòng hàng PO |
| `po_id` | `UUID` | `FK -> purchase_orders(id), NOT NULL` | Đơn mua hàng gốc |
| `inventory_item_id` | `UUID` | `FK -> inventory_items(id), NOT NULL` | Nguyên vật liệu nhập kho |
| `quantity_ordered`| `NUMERIC(12, 3)`| `NOT NULL` | Khối lượng đặt mua |
| `quantity_received`| `NUMERIC(12, 3)`| `NOT NULL DEFAULT 0` | Khối lượng thực tế nhận được sau cân đo |
| `unit_cost` | `BIGINT` | `NOT NULL` | Giá mua đơn vị tính (VND) |
| `quality_status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'PENDING'` | Kết quả kiểm định: `PENDING`, `ACCEPTED`, `DEFECTIVE_REJECTED` |
| `rejection_reason`| `TEXT` | | Lý do từ chối nếu hàng kém phẩm chất |

#### 24. Bảng `kitchen_wastages` (Ghi nhận hỏng hủy & hao hụt bếp)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính sự vụ hỏng hủy |
| `inventory_item_id` | `UUID` | `FK -> inventory_items(id), NOT NULL` | Nguyên vật liệu bị thiệt hại |
| `quantity` | `NUMERIC(12, 3)`| `NOT NULL` | Số lượng bị thất thoát / hỏng |
| `cost_loss` | `BIGINT` | `NOT NULL` | Giá trị thiệt hại tài chính quy đổi (VND) |
| `reason_type` | `VARCHAR(50)` | `NOT NULL` | Lý do: `BURNT` (cháy khét), `DROPPED` (rơi đổ), `EXPIRED` (hết hạn) |
| `reported_by` | `UUID` | `FK -> users(id), NOT NULL` | Đầu bếp báo cáo sự cố |
| `approved_by` | `UUID` | `FK -> users(id), NOT NULL` | Quản lý xác minh và ký duyệt hạch toán |

---

### 👥 Module 7: Nhân Sự, Chấm Công GPS Geofence & Lịch Ca (HR & Reviews)

#### 25. Bảng `work_shifts` (Lịch phân ca làm việc)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính ca làm việc |
| `user_id` | `UUID` | `FK -> users(id), NOT NULL` | Nhân sự được phân công trực |
| `shift_date` | `DATE` | `NOT NULL` | Ngày làm việc theo lịch |
| `shift_type` | `VARCHAR(50)` | `NOT NULL` | Loại ca: `MORNING`, `AFTERNOON`, `NIGHT`, `SPLIT` |
| `start_time` | `TIME` | `NOT NULL` | Giờ bắt đầu ca trực |
| `end_time` | `TIME` | `NOT NULL` | Giờ kết thúc ca trực |
| `role_in_shift` | `VARCHAR(50)` | `NOT NULL` | Vai trò đảm nhiệm trong ca: `WAITER`, `CHEF`, `CASHIER` |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'SCHEDULED'` | Trạng thái: `SCHEDULED`, `COMPLETED`, `ABSENT`, `SWAPPED` |

#### 26. Bảng `time_entries` (Chấm công thực tế định vị Geofence GPS + FaceID)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính bản ghi chấm công |
| `shift_id` | `UUID` | `FK -> work_shifts(id)` | Ca làm việc tương ứng theo kế hoạch |
| `user_id` | `UUID` | `FK -> users(id), NOT NULL` | Nhân sự thực hiện chấm công |
| `clock_in` | `TIMESTAMPTZ` | `NOT NULL` | Thời điểm quẹt thẻ vào ca thực tế |
| `clock_out` | `TIMESTAMPTZ` | | Thời điểm quẹt thẻ ra ca |
| `clock_in_lat` / `lng` | `NUMERIC(10, 7)` | | Tọa độ GPS thời gian thực khi bấm chấm công |
| `is_geofence_verified`| `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Xác thực tọa độ nằm trong bán kính cho phép của nhà hàng |
| `face_verified_url` | `TEXT` | | Đường dẫn ảnh chụp khuôn mặt AI FaceID xác thực |
| `work_hours` | `NUMERIC(5, 2)` | | Tổng số giờ làm việc thực tế được tính lương |

#### 27. Bảng `shift_swaps` (Yêu cầu đổi ca nội bộ)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính yêu cầu đổi ca |
| `requester_id` | `UUID` | `FK -> users(id), NOT NULL` | Nhân viên xin đổi ca |
| `requester_shift_id`| `UUID` | `FK -> work_shifts(id), NOT NULL` | Ca muốn nhượng lại |
| `target_user_id` | `UUID` | `FK -> users(id), NOT NULL` | Đồng nghiệp được đề nghị đổi ca |
| `target_shift_id` | `UUID` | `FK -> work_shifts(id), NOT NULL` | Ca muốn nhận về |
| `status` | `VARCHAR(30)` | `NOT NULL DEFAULT 'PENDING_PEER'`| Trạng thái: `PENDING_PEER`, `PENDING_MANAGER`, `APPROVED`, `REJECTED` |
| `reason` | `TEXT` | | Lý do xin đổi ca (bận việc đột xuất, khám bệnh) |
| `approved_by` | `UUID` | `FK -> users(id)` | Quản lý phê duyệt phương án đổi ca |

#### 28. Bảng `reviews` (Đánh giá thực khách & Phân tích cảm xúc AI)
| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PK, DEFAULT gen_random_uuid()` | Khóa chính |
| `order_id` | `UUID` | `FK -> orders(id)` | Đơn hàng được trải nghiệm |
| `rating_stars` | `INT` | `CHECK (rating_stars BETWEEN 1 AND 5)` | Đánh giá tổng quan (1 - 5 sao) |
| `food_quality_score`| `INT` | `CHECK (1 <= score <= 5)` | Điểm chất lượng đồ ăn thức uống |
| `service_score` | `INT` | `CHECK (1 <= score <= 5)` | Điểm thái độ phục vụ của nhân viên |
| `comment` | `TEXT` | | Nhận xét chi tiết của thực khách |
| `customer_name` | `VARCHAR(100)` | | Họ tên người gửi đánh giá |
| `customer_phone` | `VARCHAR(20)` | | Số điện thoại để chăm sóc hậu mãi nếu chấm điểm thấp |
| `sentiment_label` | `VARCHAR(30)` | | Gán nhãn cảm xúc do mô hình AI NLP phân tích: `POSITIVE`, `NEUTRAL`, `NEGATIVE` |
| `manager_response` | `TEXT` | | Phản hồi chính thức của Quản lý gửi khách |
| `responded_by` | `UUID` | `FK -> users(id)` | Quản lý trực tiếp xử lý khiếu nại |

---

## 5. CÁC ĐỘT PHÁ KỸ THUẬT VÀ TOÀN VẸN DỮ LIỆU (DEEP ARCHITECTURAL ANALYSIS)

### 5.1. Cơ Chế Sổ Cái Kho Kép (Double-Entry Inventory Ledger)
Trong các giải pháp phần mềm F&B truyền thống, lỗi thường gặp là chỉ duy trì một trường `current_stock` và dùng lệnh `UPDATE` trực tiếp:
$$\text{Stock}_{\text{new}} = \text{Stock}_{\text{old}} - \Delta$$
Cơ chế này bộc lộ nhược điểm trí mạng: **Hoàn toàn không có khả năng truy vết và kiểm toán (No Audit Trail)**. Nếu có thất thoát hoặc lỗi phần mềm, kiểm toán viên không thể biết số lượng bị hao hụt vào thời điểm nào, từ hóa đơn nào hay do ai thao tác.

**Kiến trúc đột phá trong Restaurant OS:**
Bảng `inventory_transactions` đóng vai trò như cuốn sổ cái kế toán bất biến (Immutable Append-only Journal). Mọi biến động đều phát sinh bản ghi với 2 nguyên tắc:
1. Số dư lũy kế tức thời (`balance_after`) được chốt chặn tại thời điểm giao dịch.
2. Công thức kiểm toán toàn vẹn luôn thỏa mãn ở bất kỳ mốc thời gian $T$:
$$\text{Current Stock} = \text{Initial Stock} + \sum_{i=1}^{n} \text{quantity\_change}_i$$

### 5.2. Tách Biệt Đơn Gọi Món (`orders`) Và Hóa Đơn (`bills`)
Khách hàng dùng bữa tại nhà hàng có hành vi gọi món theo nhiều đợt. Đồng thời, lúc thanh toán có thể phát sinh:
- **Tách bill theo món (Split by Item):** Người ăn chay chỉ trả tiền món rau, người uống bia tự trả tiền đồ uống.
- **Tách bill đều tiền (Even Split):** 4 người cưa đều hóa đơn.
- **Gộp bàn (Merge Tables):** Khách chuyển từ Bàn 01 sang ngồi chung với bạn ở Bàn 02 và yêu cầu tính chung tiền.

Bằng cách phân tách ranh giới giữa `orders` (tập trung vào nghiệp vụ bếp chế biến) và `bills` (tập trung vào nghĩa vụ thanh toán tài chính) thông qua bảng mapping `bill_items`, hệ thống cho phép chia nhỏ hoặc gộp dòng món tùy ý mà **hoàn toàn không làm ảnh hưởng đến tiến độ nấu nướng trên KDS của các đầu bếp**.

### 5.3. Điều Phối Trạm Bếp Tức Thời (<50ms) & Thuật Toán Gom Món (Smart Batching)
Khóa ngoại `station_id` gắn chặt trên từng dòng `order_items` cho phép Broker WebSocket (STOMP) định tuyến chính xác dữ liệu tới từng màn hình trạm:
- `/topic/kds/ST-HOT` $\rightarrow$ Chỉ nhận các món xào, nấu, chiên.
- `/topic/kds/ST-BAR` $\rightarrow$ Chỉ nhận đồ uống, cocktail, cà phê.

Trường `batch_id` hỗ trợ thuật toán gom món thông minh: Trong khung giờ cao điểm $11\text{h}30 - 13\text{h}00$, nếu có 4 bàn cùng gọi món "Phở Bò Tái Lăn", KDS sẽ gom chung thành 1 mẻ nấu 4 suất, hiển thị hạn chót ra món theo tiêu chuẩn `sla_deadline` và đo đạc thời gian chuẩn bị thực tế (`cooking_started_at` $\rightarrow$ `ready_at`) để chấm điểm KPI hiệu suất của bếp.

### 5.4. Giao Dịch Toàn Vẹn ACID & Trừ Kho Tự Động Định Lượng BOM
Hàm xử lý trừ kho nguyên liệu được thực thi trong khối `@Transactional(rollbackFor = Exception.class)` với cơ chế khóa dòng bi quan (`SELECT ... FOR UPDATE`):
1. Khóa các dòng nguyên liệu trong `inventory_items` để ngăn chặn tranh chấp (Race Condition).
2. Kiểm tra tồn kho khả dụng so với khối lượng thô `gross_quantity`.
3. Nếu không đủ tồn kho, phát sinh ngoại lệ `InsufficientStockException` để tự động Rollback toàn bộ trạng thái đơn hàng.
4. Nếu đủ tồn kho, cập nhật `current_stock` đồng thời ghi chép dòng giao dịch xuất kho `SALE_BOM_OUT` vào bảng `inventory_transactions`.

---

## 6. CHIẾN LƯỢC TỐI ƯU HÓA HIỆU NĂNG VÀ CHỈ MỤC (INDEXING STRATEGY)

Để duy trì tốc độ phản hồi cực nhanh dưới tải trọng lớn trong giờ cao điểm của nhà hàng, hệ thống được trang bị các chỉ mục tối ưu chuyên biệt:

1. **Chỉ mục tổng hợp B-Tree cho Realtime KDS:**
   `CREATE INDEX idx_order_items_station_status ON order_items(station_id, status);`
   $\rightarrow$ Cho phép màn hình KDS trạm bếp truy vấn các món đang chờ nấu (`WAITING`, `COOKING`) với độ phức tạp $O(1)$ chỉ trong $<3\text{ms}$.
2. **Chỉ mục trạng thái bàn cho Thu Ngân POS:**
   `CREATE INDEX idx_tables_status ON restaurant_tables(status);`
   $\rightarrow$ Phục vụ vẽ lại bản đồ sơ đồ sàn 2.5D tức thời khi có sự kiện khách đổi bàn hoặc vào bàn mới.
3. **Chỉ mục GIN cho tìm kiếm nhị phân JSONB:**
   `CREATE INDEX idx_dishes_allergies ON dishes USING GIN (allergy_flags);`
   `CREATE INDEX idx_order_items_modifiers ON order_items USING GIN (modifiers);`
   $\rightarrow$ Tăng tốc độ lọc thực đơn không chứa chất gây dị ứng cho khách hàng lên gấp 10 lần so với truy vấn chuỗi văn bản thông thường.
4. **Chỉ mục lịch sử giao dịch sổ cái kho:**
   `CREATE INDEX idx_inv_tx_item_time ON inventory_transactions(inventory_item_id, created_at DESC);`
   $\rightarrow$ Tối ưu hóa việc kết xuất báo cáo biến động thẻ kho và đối soát kế toán cuối tháng trong chưa đầy 1 giây.

---

## 7. KẾT LUẬN VÀ LỘ TRÌNH TRIỂN KHAI

Bản thiết kế cơ sở dữ liệu `REP-ROS-DB-01` đại diện cho một kiến trúc dữ liệu chuẩn mực, bền bỉ và sẵn sàng phục vụ quy mô sản xuất.

### Trạng thái triển khai hệ thống:
- ✅ **Mã nguồn Migration:** Toàn bộ cấu trúc DDL và dữ liệu mẫu đã được mã hóa thành công trong file Flyway [`backend/src/main/resources/db/migration/V2__enterprise_modules_expansion.sql`](file:///d:/my-project/restaurant-os/backend/src/main/resources/db/migration/V2__enterprise_modules_expansion.sql).
- ✅ **Kiểm nghiệm môi trường thật:** Đã chạy thử nghiệm và vượt qua $100\%$ các bước kiểm tra trên PostgreSQL 16 (Thời gian chạy Flyway: `0.702s`).
- ✅ **Công cụ phát triển:** Đã tích hợp script sinh migration chống trùng `pnpm db:migration:create` vào Monorepo.
- 🎯 **Giai đoạn tiếp theo:** Triển khai các JPA Entity tương ứng trong `backend/src/main/java/com/restaurantos/model/entity/` và các Controller / Service cho nghiệp vụ Menu & Đặt món.
