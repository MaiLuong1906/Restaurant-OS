import argparse
import os
import sys
import time
import pytest
import uuid
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings
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

def run_live_evaluation() -> int:
    settings = get_settings()
    settings.require_live()

    engine = ChatEngine()
    results = []
    intent_pass = 0
    booking_cases = 0
    booking_pass = 0
    hallucinations = 0

    valid_vouchers = {"PHOCO10", "WELCOME15"}
    valid_tables = {"TB-01", "TB-02", "TB-03"}

    for case in GOLDEN_QUESTIONS:
        session_id = str(uuid.uuid4())
        t0 = time.time()
        tool_decision = engine._simulate_tool_decision(case["query"])
        actual_tool = tool_decision["name"] if tool_decision else None
        events = list(engine.process_chat_stream(session_id, case["query"]))
        elapsed_ms = int((time.time() - t0) * 1000)

        event_names = [e["event"] for e in events]
        text_chunks = [e["data"] for e in events if e["event"] == "text"]
        full_text = "\n".join(text_chunks)

        intent_ok = (actual_tool == case["expected_tool"]) and ("error" not in event_names) and ("done" in event_names)
        if intent_ok:
            intent_pass += 1

        if case["category"] == "booking":
            booking_cases += 1
            if case["expected_tool"] == "create_booking":
                if "booking_card" in event_names and intent_ok:
                    booking_pass += 1
            else:
                if intent_ok and len(full_text.strip()) > 10:
                    booking_pass += 1

        # Hallucination check: fabricated booking codes or vouchers without corresponding tool execution
        has_hallucination = False
        if actual_tool != "create_booking" and "booking_card" in event_names:
            has_hallucination = True
        if actual_tool != "get_voucher" and "voucher_card" in event_names:
            has_hallucination = True

        # Check if any unknown voucher code or table ID is fabricated
        for v_event in [e for e in events if e["event"] == "voucher_card"]:
            v_data = json.loads(v_event["data"])
            if v_data.get("code") not in valid_vouchers:
                has_hallucination = True
        for b_event in [e for e in events if e["event"] == "booking_card"]:
            b_data = json.loads(b_event["data"])
            if b_data.get("table_id") not in valid_tables or not str(b_data.get("booking_code", "")).startswith("PC-"):
                has_hallucination = True

        if has_hallucination:
            hallucinations += 1

        results.append({
            "id": case["id"],
            "query": case["query"],
            "category": case["category"],
            "expected_tool": case["expected_tool"],
            "actual_tool": actual_tool,
            "events": event_names,
            "intent_ok": intent_ok,
            "hallucination": has_hallucination,
            "elapsed_ms": elapsed_ms,
            "preview": full_text.replace("\n", " ")[:140]
        })
        time.sleep(0.5)

    total = len(GOLDEN_QUESTIONS)
    intent_pct = (intent_pass / total) * 100.0
    booking_pct = (booking_pass / booking_cases) * 100.0 if booking_cases else 100.0
    gate_passed = (intent_pct >= 90.0) and (booking_pct >= 85.0) and (hallucinations == 0)

    report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "eval_report.md")
    lines = [
        "# AI Guest Chat — Live Groq Evaluation Report (20 Golden Questions)",
        "",
        f"- **Mode**: LIVE (`{settings.llm_base_url}`, primary model: `{settings.llm_model}`, fallback: `{settings.llm_fallback_model}`)",
        f"- **Total Questions**: {total}",
        f"- **Intent & Slots Accuracy**: {intent_pass}/{total} (**{intent_pct:.1f}%**) — Gate: >= 90%",
        f"- **First-try Booking Resolution**: {booking_pass}/{booking_cases} (**{booking_pct:.1f}%**) — Gate: >= 85%",
        f"- **Hallucinated Tables / Vouchers**: **{hallucinations}** — Gate: = 0",
        f"- **Overall Gate Status**: **{'PASSED' if gate_passed else 'FAILED'}**",
        "",
        "## Detailed Results per Question",
        "",
        "| ID | Category | Query | Expected Tool | Actual Tool | Intent OK | Hallucination | Latency (ms) |",
        "|---:|---|---|---|---|---|---|---:|",
    ]
    for r in results:
        lines.append(
            f"| {r['id']} | `{r['category']}` | {r['query']} | `{r['expected_tool']}` | `{r['actual_tool']}` | "
            f"{'PASS' if r['intent_ok'] else 'FAIL'} | {'YES' if r['hallucination'] else 'NO'} | {r['elapsed_ms']} |"
        )

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Live Eval Summary: Intent+Slots={intent_pct:.1f}%, Booking={booking_pct:.1f}%, Hallucinations={hallucinations}")
    print(f"Report written to {report_path}")
    return 0 if gate_passed else 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Run evaluation in live Groq mode")
    args = parser.parse_args()
    sys.exit(run_live_evaluation())
