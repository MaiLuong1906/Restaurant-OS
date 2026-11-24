# AI Guest Chat — Live Groq Evaluation Report (40 Golden Questions)

- **Backend Mode**: `REAL (Spring Boot port 8080)`
- **LLM Provider**: LIVE (`https://api.groq.com/openai/v1`, model: `openai/gpt-oss-120b`, fallback: `qwen/qwen3.8-27b`)
- **Total Questions**: 40
- **Intent & Slots Accuracy**: 40/40 (**100.0%**) — Gate: >= 90%
- **First-try Booking Resolution**: 13/13 (**100.0%**) — Gate: >= 85%
- **Hallucinated Tables / Vouchers**: **0** — Gate: = 0
- **Slowest Question**: Câu 1 (26614 ms)
- **Overall Gate Status**: **PASSED**

## Detailed Results per Question

| ID | Category | Query | Expected Tool | Actual Tool | Intent OK | Hallucination | Latency (ms) | Preview |
|---:|---|---|---|---|---|---|---:|---|
| 1 | `menu` | Quán có món chay nào không? | `search_menu` | `search_menu` | PASS | NO | 26614 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, theo thông tin hiện có trong thực đơn của nhà hàng, ba món đang được liệt kê là:  1. |
| 2 | `menu` | Ăn chay có những món gì ngon? | `search_menu` | `search_menu` | PASS | NO | 3027 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, trong danh sách thực đơn hiện tại mà hệ thống trả về chưa có món nào được đánh dấu l |
| 3 | `menu` | Phở bò tái giá bao nhiêu? | `search_menu` | `search_menu` | PASS | NO | 1012 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, món **Phở Bò Đặc Biệt** (phở bò tái) hiện có giá **75.000 VND**. |
| 4 | `menu` | Lẩu cua đồng hôm nay còn phục vụ không? | `search_menu` | `search_menu` | PASS | NO | 1211 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, trong danh sách các món hôm nay của nhà hàng hiện có **Phở Bò Đặc Biệt**, **Bún Chả  |
| 5 | `info` | Nhà hàng có chỗ để xe ô tô không? | `None` | `None` | PASS | NO | 822 | Có chỗ để xe ô tô ngay gần nhà hàng. Bãi đỗ xe ô tô cách nhà hàng khoảng 50 m và có bảo vệ trông giữ an toàn. 🚗 |
| 6 | `booking` | Tối nay 7h đặt bàn 4 người, ngồi chỗ thoáng giúp mình | `check_table_availability` | `check_table_availability` | PASS | NO | 1819 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình đã kiểm tra tình trạng chỗ ngồi cho 4 người vào lúc 19:00 và có một số bàn khả  |
| 7 | `booking` | Mai trưa đặt bàn 2 ng | `check_table_availability` | `check_table_availability` | PASS | NO | 2354 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Chào anh/chị!   Anh/chị muốn đặt bàn cho 2 người vào **trưa mai** – tức là **ngày 2026‑1 |
| 8 | `booking` | Cuối tuần đặt bàn 6 người | `check_table_availability` | `check_table_availability` | PASS | NO | 3424 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Chào anh/chị! Để mình sắp xếp chỗ cho 6 người vào cuối tuần, anh/chị muốn đặt vào ngày n |
| 9 | `booking` | 7 giờ tối đặt bàn, chỗ yên tĩnh | `check_table_availability` | `check_table_availability` | PASS | NO | 4213 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, để mình hỗ trợ đặt bàn chính xác hơn, xin hỏi thêm một chút nhé:  - Quý khách muốn đ |
| 10 | `booking` | dat ban 2 ng toi nay 7h | `check_table_availability` | `check_table_availability` | PASS | NO | 3029 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình đã kiểm tra thấy có bàn trống cho 2 người vào lúc 19:00 hôm nay. Để mình hoàn t |
| 11 | `booking` | Có bàn sân vườn tối nay không? | `check_table_availability` | `check_table_availability` | PASS | NO | 4115 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình đã kiểm tra phòng cho tối nay (ngày 2026‑11‑26, 19:00) và hiện tại hệ thống khô |
| 12 | `booking` | Tối nay còn bàn không, nhà mình đi 3 người lớn 2 trẻ em | `check_table_availability` | `check_table_availability` | PASS | NO | 2565 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình đã kiểm tra xong.    - **Ngày:** 26/11/2026 (tối nay)   - **Giờ:** 19:00   - ** |
| 13 | `booking` | Cho mình bàn gần cửa sổ, 2 người, 18h30 | `check_table_availability` | `check_table_availability` | PASS | NO | 2312 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình đã kiểm tra tình trạng bàn cho ngày 26/11/2026 lúc 20:00 và có một số bàn còn t |
| 14 | `booking` | Đặt bàn 10 người, có phòng riêng không? | `check_table_availability` | `check_table_availability` | PASS | NO | 1901 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình vừa kiểm tra lịch cho ngày **26/11/2026** lúc **19:00** cho nhóm **10 người** v |
| 15 | `booking` | Đặt bàn 4 người lúc 7h tối, tên An, 0901234567 | `create_booking` | `create_booking` | PASS | NO | 1868 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  ✅ Đặt bàn của Quý khách đã được xác nhận!  - **Mã đặt bàn:** 82387464-4fb2-4d8a-a185-6af |
| 16 | `voucher` | Tôi có voucher gì không? | `get_voucher` | `get_voucher` | PASS | NO | 13978 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, hiện tại quý khách có các voucher sau:  1. **Mã voucher:** PHOCO10      **Giảm:** 50 |
| 17 | `voucher` | Lấy voucher giảm giá cho lần đặt đầu tiên | `get_voucher` | `get_voucher` | PASS | NO | 11037 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, hiện tại nhà hàng Phố Cổ có 2 chương trình voucher dành cho lần đặt đầu tiên của quý |
| 18 | `voucher` | Voucher PHOCO10 có dùng được tối nay không? | `get_voucher` | `get_voucher` | PASS | NO | 7901 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, voucher **PHOCO10** vẫn còn hiệu lực và có thể sử dụng tối nay.   - Giảm 50.000 VND  |
| 19 | `cancel` | Hủy bàn tối nay giúp mình mã PC-123 | `cancel_booking` | `cancel_booking` | PASS | NO | 8495 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Xin lỗi anh/chị, mình đã thử hủy đặt bàn **PC-123** nhưng hệ thống trả về lỗi:  > “Tham  |
| 20 | `booking` | Đổi bàn tối nay sang 8h được không mã PC-456 | `check_table_availability` | `check_table_availability` | PASS | NO | 5836 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, mình đã kiểm tra tình trạng bàn cho ngày **26/11/2026** lúc **20:00** (8 h tối) và h |
| 21 | `allergy` | Mình dị ứng đậu phộng, quán có món nào an toàn không? | `search_menu` | `search_menu` | PASS | NO | 10481 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, trong thực đơn hiện tại mình chỉ tìm thấy món **Nem Lụi Nướng Sả** (Set 5 xiên nem l |
| 22 | `allergy` | Phở bò tái có chứa gluten không? | `search_menu` | `search_menu` | PASS | NO | 5458 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, hiện tại nhà hàng chưa có thông tin chi tiết về dị ứng gluten cho món Phở Bò Đặc Biệ |
| 23 | `allergy` | Món chay nào không có đậu nành? | `search_menu` | `search_menu` | PASS | NO | 9790 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, theo dữ liệu hiện có trong hệ thống, các món được liệt kê đều không phải là món chay |
| 24 | `allergy` | Bé nhà mình dị ứng hải sản, gợi ý món cho bé | `search_menu` | `search_menu` | PASS | NO | 6561 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dưới đây là một vài món trong thực đơn của Nhà hàng Phố Cổ không có hải sản, phù hợp cho |
| 25 | `budget` | Ăn 2 người khoảng 200k thì gọi món gì? | `search_menu` | `search_menu` | PASS | NO | 13476 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dựa trên thực đơn hiện có và ngân sách khoảng 200 000 VND cho 2 người, mình gợi ý một và |
| 26 | `budget` | Có món nào dưới 100k không? | `search_menu` | `search_menu` | PASS | NO | 14240 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dưới 100 000 VND, nhà hàng hiện đang có các món sau:  \| Món \| Giá \| Mô tả \| \|---\|---\|--- |
| 27 | `budget` | Gia đình 4 người, tầm 500k ăn gì ngon? | `search_menu` | `search_menu` | PASS | NO | 9731 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, dựa trên thực đơn hiện có và mức ngân sách **tối đa 500.000 VND** cho 4 người, mình  |
| 28 | `clarify` | Đặt bàn tối nay | `None` | `None` | PASS | NO | 7668 | Chào anh/chị! Để mình có thể tạo đặt bàn chính xác nhất, anh/chị vui lòng cho mình biết:  1. Số người dự kiến sẽ có mặt? 2. Thời gian muốn đ |
| 29 | `clarify` | Đặt bàn 4 người | `None` | `None` | PASS | NO | 3565 | Chắc chắn rồi! Để mình tiến hành đặt bàn cho 4 người, bạn vui lòng cho mình biết:  - Ngày muốn đặt bàn là ngày nào?   - Thời gian dự kiến đế |
| 30 | `clarify` | Muốn đặt bàn cuối tuần | `None` | `None` | PASS | NO | 1558 | Chào bạn! Để mình có thể đặt bàn cho cuối tuần cho bạn, mình cần một vài thông tin nữa nhé:  1. Bạn muốn đặt vào ngày nào trong cuối tuần (v |
| 31 | `clarify` | Đặt bàn 2 người lúc 7h | `None` | `None` | PASS | NO | 5443 | Dạ, mình sẽ hỗ trợ đặt bàn luôn ạ!   Bạn muốn đặt vào ngày nào và thời gian là 19:00 chiều đúng không? 🙂 |
| 32 | `booking` | dat ban toi nay 2 nguoi 7h | `check_table_availability` | `check_table_availability` | PASS | NO | 9350 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, để mình xác nhận lại một chút nhé: quý khách muốn đặt bàn **cho 2 người vào lúc 19:0 |
| 33 | `menu` | pho bo bao nhieu tien | `search_menu` | `search_menu` | PASS | NO | 10486 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, Phở Bò Đặc Biệt hiện có giá **75.000 VND**. Nếu quý khách muốn biết thêm thông tin c |
| 34 | `voucher` | voucher nao giam gia cho don dau | `get_voucher` | `get_voucher` | PASS | NO | 8010 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Dạ, hiện tại hệ thống có 2 mã voucher mà bạn có thể áp dụng cho đơn đầu (đơn đặt hàng ba |
| 35 | `info` | Quán có wifi không? | `None` | `None` | PASS | NO | 3329 | Dạ, quán có wifi miễn phí tốc độ cao phủ sóng toàn bộ không gian. Mật khẩu wifi là **phoco2026** ạ. Nếu có bất kỳ thắc mắc nào khác, mình rấ |
| 36 | `info` | Đặt tiệc sinh nhật 30 người được không? | `None` | `None` | PASS | NO | 3996 | Chào anh/chị! 🎉   Với nhóm từ 10 – 50 khách, nhà hàng Phố Cổ có không gian riêng và bàn dài ghép nối, rất thích hợp cho tiệc sinh nhật 30 ng |
| 37 | `handover` | Gọi quản lý giúp mình | `None` | `None` | PASS | NO | 1268 | Dạ, mình đã ghi nhận yêu cầu của bạn. Mình sẽ thông báo với quản lý ngay để anh/chị hỗ trợ bạn sớm nhất có thể. Cảm ơn bạn! |
| 38 | `cancel` | Hủy bàn vừa đặt giúp mình | `cancel_booking` | `cancel_booking` | PASS | NO | 5492 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  ✅ Hủy đặt bàn 82387464-4fb2-4d8a-a185-6afee65e8f0d thành công rồi ạ!   Bạn có thể yên tâ |
| 39 | `booking` | Đổi bàn tối nay sang 8h được không? | `check_table_availability` | `check_table_availability` | PASS | NO | 4903 | Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...  Chào anh/chị, mình đã kiểm tra và có bàn trống vào **20:00** hôm nay cho **2 khách**. Cá |
| 40 | `info` | Quán mở cửa mấy giờ cuối tuần? | `None` | `None` | PASS | NO | 5880 | Quán mở cửa từ **10:00** đến **22:30** mọi ngày trong tuần, bao gồm cả **cuối tuần** (Thứ Bảy và Chủ Nhật). 😊 |
