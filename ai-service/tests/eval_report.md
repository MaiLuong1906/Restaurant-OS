# AI Guest Chat — Live Groq Evaluation Report (20 Golden Questions)

- **Mode**: LIVE (`https://api.groq.com/openai/v1`, primary model: `openai/gpt-oss-120b`, fallback: `qwen/qwen3.8-27b`)
- **Total Questions**: 20
- **Intent & Slots Accuracy**: 20/20 (**100.0%**) — Gate: >= 90%
- **First-try Booking Resolution**: 11/11 (**100.0%**) — Gate: >= 85%
- **Hallucinated Tables / Vouchers**: **0** — Gate: = 0
- **Overall Gate Status**: **PASSED**

## Detailed Results per Question

| ID | Category | Query | Expected Tool | Actual Tool | Intent OK | Hallucination | Latency (ms) |
|---:|---|---|---|---|---|---|---:|
| 1 | `menu` | Quán có món chay nào không? | `search_menu` | `search_menu` | PASS | NO | 19908 |
| 2 | `menu` | Ăn chay có những món gì ngon? | `search_menu` | `search_menu` | PASS | NO | 1840 |
| 3 | `menu` | Phở bò tái giá bao nhiêu? | `search_menu` | `search_menu` | PASS | NO | 2132 |
| 4 | `menu` | Lẩu cua đồng hôm nay còn phục vụ không? | `search_menu` | `search_menu` | PASS | NO | 1354 |
| 5 | `info` | Nhà hàng có chỗ để xe ô tô không? | `None` | `None` | PASS | NO | 3200 |
| 6 | `booking` | Tối nay 7h đặt bàn 4 người, ngồi chỗ thoáng giúp mình | `check_table_availability` | `check_table_availability` | PASS | NO | 1835 |
| 7 | `booking` | Mai trưa đặt bàn 2 ng | `check_table_availability` | `check_table_availability` | PASS | NO | 2997 |
| 8 | `booking` | Cuối tuần đặt bàn 6 người | `check_table_availability` | `check_table_availability` | PASS | NO | 1846 |
| 9 | `booking` | 7 giờ tối đặt bàn, chỗ yên tĩnh | `check_table_availability` | `check_table_availability` | PASS | NO | 1934372 |
| 10 | `booking` | dat ban 2 ng toi nay 7h | `check_table_availability` | `check_table_availability` | PASS | NO | 3318 |
| 11 | `booking` | Có bàn sân vườn tối nay không? | `check_table_availability` | `check_table_availability` | PASS | NO | 4546 |
| 12 | `booking` | Tối nay còn bàn không, nhà mình đi 3 người lớn 2 trẻ em | `check_table_availability` | `check_table_availability` | PASS | NO | 1929 |
| 13 | `booking` | Cho mình bàn gần cửa sổ, 2 người, 18h30 | `check_table_availability` | `check_table_availability` | PASS | NO | 1914 |
| 14 | `booking` | Đặt bàn 10 người, có phòng riêng không? | `check_table_availability` | `check_table_availability` | PASS | NO | 1828 |
| 15 | `booking` | Đặt bàn 4 người lúc 7h tối, tên An, 0901234567 | `create_booking` | `create_booking` | PASS | NO | 2243 |
| 16 | `voucher` | Tôi có voucher gì không? | `get_voucher` | `get_voucher` | PASS | NO | 2506 |
| 17 | `voucher` | Lấy voucher giảm giá cho lần đặt đầu tiên | `get_voucher` | `get_voucher` | PASS | NO | 1953 |
| 18 | `voucher` | Voucher PHOCO10 có dùng được tối nay không? | `get_voucher` | `get_voucher` | PASS | NO | 3562 |
| 19 | `cancel` | Hủy bàn tối nay giúp mình mã PC-123 | `cancel_booking` | `cancel_booking` | PASS | NO | 1777 |
| 20 | `booking` | Đổi bàn tối nay sang 8h được không mã PC-456 | `check_table_availability` | `check_table_availability` | PASS | NO | 3690 |
