import json
import pytest
import httpx
from tools.real_backend_adapter import RealBackendAdapter

DISHES_MOCK_DATA = {
    "success": True,
    "message": "OK",
    "data": [
        {
            "id": "94553802-044f-4d0a-9604-958af255e010",
            "name": "Phở Bò Đặc Biệt",
            "description": "Bánh phở tươi, nạm gầu giòn, nước dùng ninh xương 24h",
            "price": 75000,
            "category": "Món nước",
            "imageUrl": "https://example.com/pho.jpg",
            "isAvailable": True
        },
        {
            "id": "b2c3d4e5-1111-2222-3333-444455556666",
            "name": "Bún Chả Hà Nội",
            "description": "Chả nướng than hoa, nước chấm đậm đà",
            "price": 60000,
            "category": "Món khô",
            "imageUrl": "https://example.com/buncha.jpg",
            "isAvailable": False  # Món hết hàng
        },
        {
            "id": "c3d4e5f6-2222-3333-4444-555566667777",
            "name": "Lẩu Riêu Cua Bắp Bò",
            "description": "Lẩu riêu cua đồng chua thanh, thịt bắp bò tươi",
            "price": 280000,
            "category": "Lẩu",
            "imageUrl": "https://example.com/lau.jpg",
            "isAvailable": True
        }
    ]
}

TABLES_MOCK_DATA = {
    "success": True,
    "message": "OK",
    "data": [
        {
            "id": "e8f7a6b5-0000-1111-2222-333344445555",
            "tableNumber": "Bàn 01",
            "capacity": 4,
            "status": "VACANT",
            "zoneId": "zone-1",
            "zoneName": "Tầng 1 - Sảnh Chính"
        }
    ]
}

def test_search_menu_filters_available_and_budget():
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/dishes":
            return httpx.Response(200, json=DISHES_MOCK_DATA)
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    # 1. Tìm món phở -> chỉ ra Phở Bò Đặc Biệt (vì isAvailable=True)
    res = adapter.search_menu(query="phở")
    assert res["status"] == "success"
    assert len(res["dishes"]) >= 1
    assert res["dishes"][0]["name"] == "Phở Bò Đặc Biệt"

    # 2. Tìm bún chả -> không ra vì isAvailable=False (hết hàng)
    res_buncha = adapter.search_menu(query="bún chả")
    # Khi món không khớp hoặc hết hàng, search_menu fallback trả top 3 món đang phục vụ
    dish_names = [d["name"] for d in res_buncha["dishes"]]
    assert "Bún Chả Hà Nội" not in dish_names, "Món hết hàng không được xuất hiện trong kết quả"

    # 3. Lọc theo budget_max 100k -> không có Lẩu Riêu Cua (280k)
    res_budget = adapter.search_menu(query="lẩu", budget_max=100000)
    for d in res_budget["dishes"]:
        assert d["price"] <= 100000

def test_get_dish_availability():
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/dishes":
            return httpx.Response(200, json=DISHES_MOCK_DATA)
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    avail = adapter.get_dish_availability(dish_name="Phở Bò")
    assert avail["status"] == "success"
    assert len(avail["items"]) == 1
    assert avail["items"][0]["available"] is True

    unavail = adapter.get_dish_availability(dish_name="Bún Chả")
    assert unavail["status"] == "success"
    assert len(unavail["items"]) == 1
    assert unavail["items"][0]["available"] is False

def test_check_table_availability_mapping():
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/reservations/available-tables":
            assert "time" in request.url.params
            assert "guestCount" in request.url.params
            return httpx.Response(200, json=TABLES_MOCK_DATA)
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    result = adapter.check_table_availability(date="2026-11-25", time="19:00", party_size=4)
    assert result["status"] == "available"
    assert len(result["available_tables"]) == 1
    t = result["available_tables"][0]
    assert t["table_id"] == "e8f7a6b5-0000-1111-2222-333344445555"
    assert "Bàn 01" in t["name"]
    assert "Sảnh Chính" in t["name"]
    assert t["capacity"] == 4

def test_create_booking_success_and_invariants():
    captured_request = {}

    def mock_handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/reservations" and request.method == "POST":
            captured_request["body"] = json.loads(request.content)
            captured_request["headers"] = dict(request.headers)
            return httpx.Response(201, json={
                "success": True,
                "message": "Created",
                "data": {
                    "id": "77778888-9999-aaaa-bbbb-ccccddddeeee",
                    "tableNumber": "Bàn 01",
                    "zoneName": "Tầng 1 - Sảnh Chính",
                    "status": "CONFIRMED"
                }
            })
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    res = adapter.create_booking(
        name="Nguyễn Văn A",
        phone="0912345678",
        date="2026-11-25",
        time="19:00",
        party_size=4,
        table_id="e8f7a6b5-0000-1111-2222-333344445555",
        note="Gần cửa sổ"
    )

    assert res["status"] == "success"
    # Ràng buộc: booking_code = UUID thật từ Backend, không được sinh mã PC-
    assert res["booking"]["booking_code"] == "77778888-9999-aaaa-bbbb-ccccddddeeee"
    assert not res["booking"]["booking_code"].startswith("PC-")
    # Ràng buộc: cọc qua chat = 0 VND
    assert captured_request["body"]["depositAmount"] == 0
    # Ràng buộc: có header Idempotency Key
    assert "x-idempotency-key" in captured_request["headers"]

def test_create_booking_backend_error_no_hallucination():
    def mock_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"success": False, "message": "Bàn đã có người đặt trước"})

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    res = adapter.create_booking(
        name="Trần Văn B",
        phone="0987654321",
        date="2026-11-25",
        time="19:00",
        party_size=2,
        table_id="some-table-uuid"
    )

    # Tuyệt đối không bịa bàn hay trả mã đặt khi BE lỗi
    assert res["status"] == "failed"
    assert "booking" not in res
    assert "Bàn đã có người đặt trước" in res["message"]

def test_cancel_booking():
    def mock_handler(request: httpx.Request) -> httpx.Response:
        if "/cancel" in request.url.path:
            return httpx.Response(200, json={"success": True, "message": "Cancelled"})
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    res = adapter.cancel_booking(booking_code="77778888-9999-aaaa-bbbb-ccccddddeeee", phone="0912345678")
    assert res["status"] == "success"
    assert res["booking_code"] == "77778888-9999-aaaa-bbbb-ccccddddeeee"

def test_vouchers_seed_data_in_real_adapter():
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1")
    vouchers = adapter.get_voucher()
    assert vouchers["status"] == "success"
    codes = [v["code"] for v in vouchers["vouchers"]]
    assert "PHOCO10" in codes
    assert "WELCOME15" in codes

    # Test redeem
    res1 = adapter.redeem_voucher("PHOCO10", "booking-uuid-1")
    assert res1["status"] == "success"
    assert res1["discount_vnd"] == 50000

    # Test double redeem
    res2 = adapter.redeem_voucher("PHOCO10", "booking-uuid-1")
    assert res2["status"] == "failed"

def test_create_booking_without_table_id_returns_needs_table_selection():
    post_called = False

    def mock_handler(request: httpx.Request) -> httpx.Response:
        nonlocal post_called
        if request.url.path == "/api/v1/reservations/available-tables" and request.method == "GET":
            return httpx.Response(200, json=TABLES_MOCK_DATA)
        if request.url.path == "/api/v1/reservations" and request.method == "POST":
            post_called = True
            return httpx.Response(201, json={"success": True, "data": {}})
        return httpx.Response(404)

    client = httpx.Client(transport=httpx.MockTransport(mock_handler))
    adapter = RealBackendAdapter(base_url="http://localhost:8080/api/v1", client=client)

    res = adapter.create_booking(
        name="Nguyễn Văn A",
        phone="0912345678",
        date="2026-11-25",
        time="19:00",
        party_size=4,
        table_id=""
    )

    assert post_called is False, "Không được gọi POST /reservations khi chưa có table_id hợp lệ"
    assert res["status"] == "needs_table_selection"
    assert len(res["available_tables"]) == 1
    assert res["available_tables"][0]["table_id"] == "e8f7a6b5-0000-1111-2222-333344445555"

def test_cancel_without_booking_code_returns_none():
    from services.chat_engine import ChatEngine
    engine = ChatEngine()
    decision = engine._simulate_tool_decision("Hủy bàn vừa đặt giúp mình")
    assert decision is None, "Không được sinh tool call với mã giả khi chưa có mã đặt bàn"
