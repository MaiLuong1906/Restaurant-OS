# Hướng dẫn chạy và kiểm thử AI Microservice (Restaurant OS)

Microservice này phụ trách xử lý hội thoại khách hàng thông minh cho nhà hàng Phố Cổ:
- **Streaming Chat Endpoint (SSE)**: Hỗ trợ 6 loại event chuẩn (`text`, `dish_card`, `booking_card`, `voucher_card`, `done`, `error`).
- **RAG Knowledge Retrieval**: Ingestion & tìm kiếm cosine tương đồng trên vector 1024 chiều (BGE-M3 local + PostgreSQL pgvector).
- **Function Calling & 7 Tools**:
  - `check_table_availability`: Kiểm tra bàn trống theo ngày, giờ, số người, khu vực.
  - `create_booking`: Tạo đặt bàn (kèm mã bàn hợp lệ, chống đặt trùng theo session/thông tin).
  - `get_voucher`: Tra cứu voucher ưu đãi cho khách.
  - `redeem_voucher`: Áp dụng mã giảm giá vào đơn đặt bàn.
  - `cancel_booking`: Hủy đặt bàn an toàn.
  - `search_menu`: Gợi ý thực đơn, món chay, ngân sách.
  - `get_dish_availability`: Kiểm tra tình trạng món ăn còn/hết từ kho bếp.
- **Privacy & Logging**: Lưu trữ tin nhắn, phiên trò chuyện, feedback đánh giá 1-5 sao; mã hóa SHA-256 SĐT khách hàng, tuyệt đối không lộ thông tin cá nhân hay secret key.

---

## 1. Cấu hình biến môi trường (`.env`)

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Các biến cấu hình chính:
- `LLM_BASE_URL`: Địa chỉ API provider OpenAI-compatible (mặc định: `https://api.groq.com/openai/v1`).
- `LLM_API_KEY`: API key của bạn (để trống hoặc placeholder khi chạy chế độ Mock).
- `LLM_MODEL`: Model chính (`openai/gpt-oss-120b`).
- `LLM_FALLBACK_MODEL`: Model dự phòng khi lỗi quota / 429 (`qwen/qwen3.8-27b`).
- `DATABASE_URL`: Đường dẫn PostgreSQL có hỗ trợ pgvector (ví dụ: `postgresql://postgres:postgres@localhost:5434/restaurant_os`).
- `EMBEDDING_MODEL`: `BAAI/bge-m3` (local embedding 1024 chiều).

---

## 2. Ingestion dữ liệu RAG (`ingest_knowledge.py`)

Chạy script để đồng bộ dữ liệu thực đơn từ bảng `dishes` (hoặc seed file) cùng toàn bộ chính sách nhà hàng (giờ mở cửa, chỗ để xe, chính sách đặt bàn) vào bảng `ai_documents` và `ai_chunks`:
```bash
source .venv/bin/activate
python scripts/ingest_knowledge.py
```

Các file nguồn tri thức được ingest:
- `database/dishes` (hoặc `data/dish_availability.json`): Danh mục món ăn, giá tiền số nguyên VND, tình trạng phục vụ.
- `doc/design/policy_faq.md`: Giờ mở cửa (10:00 - 22:30), chỗ đỗ xe máy & ô tô, chính sách không thu phí cọc.

---

## 3. Khởi chạy Service Local

```bash
source .venv/bin/activate
uvicorn main:app --port 8000 --reload
```
Kiểm tra sức khỏe dịch vụ:
```bash
curl http://localhost:8000/health
```

---

## 4. Chạy kiểm thử & Eval Harness 40 câu Golden

### Chế độ Mock (CI / Local không cần key / không cần mạng)
```bash
source .venv/bin/activate
python -m pytest test_config.py tests/test_chat_and_tools.py tests/test_real_backend_adapter.py tests/eval_golden.py -q
```

### Chế độ Live (Dùng Groq LLM Key thật + Backend Spring Boot thật)
Cấu hình trong file `.env`: `BACKEND_MODE=real`, `BACKEND_API_URL=http://localhost:8080/api/v1`, sau đó chạy:
```bash
source .venv/bin/activate
BACKEND_MODE=real python tests/eval_golden.py --live
```
Báo cáo đánh giá được ghi nhận dựa trên các chỉ số cốt lõi:
1. Tỉ lệ hiểu đúng ý định & tách đúng thông tin (Intent & Slots) $\ge 90\%$.
2. Tỉ lệ đặt bàn thành công ngay lần đầu không hỏi lại quá 2 lần $\ge 85\%$.
3. **Tỉ lệ bịa bàn/voucher không qua tool: = 0 (Gate bắt buộc)**.
4. Timeout tối đa 120s/câu, dọn sạch dữ liệu test sau khi hoàn tất.

---

## 5. Quy trình Review Lỗi Hàng Tuần (Weekly Failure Review Loop)

Để đảm bảo chất lượng AI liên tục nâng cao từ phản hồi thực tế của khách hàng:

1. **Chạy script trích xuất phiên lỗi:**
   ```bash
   source .venv/bin/activate
   python scripts/review_weekly_failures.py --days 7 --output review_weekly_report.md
   ```
2. **Đọc và phân loại các phiên bị gắn cờ:**
   - **Thiếu kiến thức**: Món mới hoặc câu hỏi chính sách chưa có trong tài liệu -> Bổ sung vào `policy_faq.md` hoặc kiểm tra lại ingestion backend.
   - **Sai tool**: AI gọi nhầm tool hoặc không gọi tool -> Tinh chỉnh prompt tại `prompts/system_vi.md`.
   - **Thiếu slot**: Người dùng cung cấp chưa đủ thông tin -> Kiểm tra cơ chế làm rõ (`expect_clarify`).
   - **Ngoài phạm vi**: Yêu cầu đặc biệt (đặt tiệc lớn, phàn nàn) -> Bàn giao nhân viên quản lý.
3. **Đưa câu lỗi vào bộ câu hỏi Golden Eval đợt tiếp theo.**
4. **Sửa bằng Prompt & RAG trước:** Tuyệt đối không vội fine-tune model. Fine-tune chỉ là bước cuối cùng khi eval chứng minh prompt + RAG không thể giải quyết được một nhóm lỗi đặc thù.
