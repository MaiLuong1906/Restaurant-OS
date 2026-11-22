import pytest
import uuid
import json
from services.chat_engine import ChatEngine

chat_engine = ChatEngine()

GOLDEN_QUESTIONS = [
    # Nhóm 1: Hỏi thực đơn & món ăn
    {"id": 1, "query": "Quán có món chay nào không?", "category": "menu", "expected_tool": "search_menu"},
    {"id": 2, "query": "Ăn chay có những món gì ngon?", "category": "menu", "expected_tool": "search_menu"},
    {"id": 3, "query": "Phở bò tái giá bao nhiêu?", "category": "menu", "expected_tool": "search_menu"},
    {"id": 4, "query": "Lẩu cua đồng hôm nay còn phục vụ không?", "category": "menu", "expected_tool": "search_menu"},
    {"id": 5, "query": "Nhà hàng có chỗ để xe ô tô không?", "category": "info", "expected_tool": None},
    
    # Nhóm 2: Đặt bàn (Hỏi trống & Giữ bàn)
    {"id": 6, "query": "Tối nay 7h đặt bàn 4 người, ngồi chỗ thoáng giúp mình", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 7, "query": "Mai trưa đặt bàn 2 ng", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 8, "query": "Cuối tuần đặt bàn 6 người", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 9, "query": "7 giờ tối đặt bàn, chỗ yên tĩnh", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 10, "query": "dat ban 2 ng toi nay 7h", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 11, "query": "Có bàn sân vườn tối nay không?", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 12, "query": "Tối nay còn bàn không, nhà mình đi 3 người lớn 2 trẻ em", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 13, "query": "Cho mình bàn gần cửa sổ, 2 người, 18h30", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 14, "query": "Đặt bàn 10 người, có phòng riêng không?", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 15, "query": "Đặt bàn 4 người lúc 7h tối, tên An, 0901234567", "category": "booking", "expected_tool": "create_booking"},

    # Nhóm 3: Voucher & Khuyến mãi
    {"id": 16, "query": "Tôi có voucher gì không?", "category": "voucher", "expected_tool": "get_voucher"},
    {"id": 17, "query": "Lấy voucher giảm giá cho lần đặt đầu tiên", "category": "voucher", "expected_tool": "get_voucher"},
    {"id": 18, "query": "Voucher PHOCO10 có dùng được tối nay không?", "category": "voucher", "expected_tool": "get_voucher"},

    # Nhóm 4: Hủy / Đổi bàn
    {"id": 19, "query": "Hủy bàn tối nay giúp mình mã PC-123", "category": "cancel", "expected_tool": "cancel_booking"},
    {"id": 20, "query": "Đổi bàn tối nay sang 8h được không mã PC-456", "category": "booking", "expected_tool": "check_table_availability"}
]

@pytest.mark.parametrize("case", GOLDEN_QUESTIONS)
def test_golden_eval_mock(case):
    session_id = str(uuid.uuid4())
    events = list(chat_engine.process_chat_stream(session_id, case["query"]))
    
    event_names = [e["event"] for e in events]
    assert "error" not in event_names, f"Query '{case['query']}' resulted in an error event"
    assert "done" in event_names, f"Query '{case['query']}' did not emit done event"
    assert "text" in event_names or "dish_card" in event_names or "voucher_card" in event_names or "booking_card" in event_names
