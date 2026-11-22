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

## 4. Chạy kiểm thử & Eval Harness 20 câu Golden

### Chế độ Mock (CI / Local không cần key / không cần mạng)
```bash
source .venv/bin/activate
PYTHONPATH=. pytest tests/eval_golden.py -v
```

### Chế độ Live (Dùng Groq LLM Key thật)
Điền `LLM_API_KEY` vào file `.env`, sau đó chạy:
```bash
source .venv/bin/activate
PYTHONPATH=. pytest tests/eval_golden.py -v -m live
```
Báo cáo đánh giá được ghi nhận dựa trên 4 chỉ số cốt lõi:
1. Tỉ lệ hiểu đúng ý định & tách đúng thông tin (ngày/giờ/số người/khu vực) $\ge 90\%$.
2. Tỉ lệ đặt bàn thành công ngay lần đầu không hỏi lại quá 2 lần $\ge 85\%$.
3. **Tỉ lệ bịa bàn/voucher không qua tool: = 0 (Gate merge bắt buộc)**.
4. Tỉ lệ phản hồi lỗi thân thiện khi provider gặp sự cố: 100%.
