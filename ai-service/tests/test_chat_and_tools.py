import pytest
import uuid
import json
from main import app
from tools.backend_adapter import MockBackendAdapter
from tools.executor import ToolExecutor
from services.logger import ChatLogger
from services.chat_engine import ChatEngine

def test_chat_invalid_session_id():
    from fastapi.testclient import TestClient
    client = TestClient(app)
    response = client.post("/api/v1/chat", json={"session_id": "not-a-uuid", "message": "hello"})
    assert response.status_code == 400
    assert "UUID" in response.json()["detail"]

def test_chat_stream_sse_events():
    engine = ChatEngine(force_mock_llm=True)
    session_id = str(uuid.uuid4())
    events = list(engine.process_chat_stream(session_id, "Có bàn sân vườn tối nay không?"))
    assert len(events) >= 2
    event_names = [e["event"] for e in events]
    assert "done" in event_names

def test_backend_adapter_dedup():
    adapter = MockBackendAdapter()
    res1 = adapter.create_booking(
        name="Nguyễn Văn An",
        phone="0901234567",
        date="2026-11-22",
        time="19:00",
        party_size=4,
        table_id="TB-01"
    )
    code1 = res1["booking"]["booking_code"]

    res2 = adapter.create_booking(
        name="Nguyễn Văn An",
        phone="0901234567",
        date="2026-11-22",
        time="19:00",
        party_size=4,
        table_id="TB-01"
    )
    code2 = res2["booking"]["booking_code"]
    assert code1 == code2, "Deduplication failed: same booking parameters produced different booking codes"

def test_backend_adapter_vouchers():
    adapter = MockBackendAdapter()
    vouchers = adapter.get_voucher(phone="0901234567")
    assert vouchers["status"] == "success"
    assert len(vouchers["vouchers"]) >= 1

    redeem_res = adapter.redeem_voucher("PHOCO10", "PC-123456")
    assert redeem_res["status"] == "success"
    assert redeem_res["discount_vnd"] == 50000

    # Double redeem check
    redeem_res2 = adapter.redeem_voucher("PHOCO10", "PC-123456")
    assert redeem_res2["status"] == "failed"

def test_feedback_logging():
    from fastapi.testclient import TestClient
    client = TestClient(app)
    session_id = str(uuid.uuid4())
    res = client.post("/api/v1/chat/feedback", json={
        "session_id": session_id,
        "rating": 5,
        "note": "AI trả lời rất nhanh và chính xác"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_feedback_invalid_rating():
    from fastapi.testclient import TestClient
    client = TestClient(app)
    session_id = str(uuid.uuid4())
    res = client.post("/api/v1/chat/feedback", json={
        "session_id": session_id,
        "rating": 6
    })
    assert res.status_code == 400

def test_phone_hashing_privacy():
    phone = "0901234567"
    hashed = ChatLogger.hash_phone(phone)
    assert hashed != phone
    assert len(hashed) == 64
    assert ChatLogger.hash_phone(None) is None

def test_tool_decision_extracts_explicit_date_and_table():
    engine = ChatEngine(force_mock_llm=True)
    decision = engine._simulate_tool_decision(
        "Đặt bàn 2 người ngày 25/11 lúc 19h, bàn TB-01, tên Huy, SĐT 0912345678"
    )
    assert decision is not None
    assert decision["name"] == "create_booking"
    args = decision["arguments"]
    assert args["date"] == "2026-11-25"
    assert args["time"] == "19:00"
    assert args["party_size"] == 2
    assert args["table_id"] == "TB-01"
    assert args["name"] == "Huy"
    assert args["phone"] == "0912345678"

def test_multi_turn_booking_slot_carry_over():
    adapter = MockBackendAdapter()
    executor = ToolExecutor(adapter=adapter)
    engine = ChatEngine(tool_executor=executor, force_mock_llm=True)
    session_id = str(uuid.uuid4())

    # Lượt 1: khách cung cấp số người, ngày, giờ
    events_turn1 = list(engine.process_chat_stream(session_id, "Tôi muốn đặt bàn 2 người ngày 25/11 lúc 19h"))
    event_names_1 = [e["event"] for e in events_turn1]
    assert "booking_card" not in event_names_1
    assert "done" in event_names_1

    # Lượt 2: khách chỉ cung cấp bàn, tên, SĐT (không nhắc lại ngày/giờ/số người)
    events_turn2 = list(engine.process_chat_stream(session_id, "TB-01, tên Huy, SĐT 0912345678"))
    event_names_2 = [e["event"] for e in events_turn2]
    assert "booking_card" in event_names_2, "Lượt 2 phải gộp slot từ lượt 1 và phát booking_card"

    booking_event = next(e for e in events_turn2 if e["event"] == "booking_card")
    booking_data = json.loads(booking_event["data"])
    assert booking_data["date"] == "2026-11-25"
    assert booking_data["time"] == "19:00"
    assert booking_data["party_size"] == 2
    assert booking_data["table_id"] == "TB-01"
    assert booking_data["name"] == "Huy"

    # Kiểm tra AI không hỏi lại ngày/giờ/số người ở lượt 2
    text_turn2 = "\n".join(e["data"] for e in events_turn2 if e["event"] == "text")
    assert "?" not in text_turn2

def test_multi_turn_menu_history_carry_over():
    captured_messages = []

    class FakeLLMProvider:
        def chat(self, messages, model=None):
            captured_messages.append(list(messages))
            return "Dạ ngoài Phở Bò Tái 75.000 VND bạn vừa hỏi, quán còn có Bún Chả Hà Nội 65.000 VND cũng rất ngon ạ!"

    adapter = MockBackendAdapter()
    executor = ToolExecutor(adapter=adapter)
    engine = ChatEngine(llm_provider=FakeLLMProvider(), tool_executor=executor)
    session_id = str(uuid.uuid4())

    # Lượt 1: hỏi giá phở bò
    list(engine.process_chat_stream(session_id, "Phở bò tái giá bao nhiêu?"))
    # Lượt 2: hỏi câu nối tiếp phụ thuộc ngữ cảnh lượt 1
    events_turn2 = list(engine.process_chat_stream(session_id, "Còn món nào tương tự?"))

    assert len(captured_messages) == 2
    turn2_llm_messages = captured_messages[1]
    roles = [m["role"] for m in turn2_llm_messages]
    # Phải có history của lượt 1 (user + assistant) trước tin nhắn user của lượt 2
    assert roles.count("user") >= 2
    assert "assistant" in roles
    assert any("Phở bò tái giá bao nhiêu?" in m["content"] for m in turn2_llm_messages if m["role"] == "user")
    assert any(e["event"] == "dish_card" for e in events_turn2)
