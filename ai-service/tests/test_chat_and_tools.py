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
    engine = ChatEngine()
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
