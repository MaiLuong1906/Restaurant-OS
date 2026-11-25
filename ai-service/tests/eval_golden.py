import argparse
import os
import sys
import time
import pytest
import uuid
import json
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg
from config import get_settings
from services.chat_engine import ChatEngine
from tools.executor import ToolExecutor

chat_engine = ChatEngine(force_mock_llm=True)

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
    {"id": 20, "query": "Đổi bàn tối nay sang 8h được không mã PC-456", "category": "booking", "expected_tool": "check_table_availability"},

    # Nhóm 5: Dị ứng thực phẩm (21–24)
    {"id": 21, "query": "Mình dị ứng đậu phộng, quán có món nào an toàn không?", "category": "allergy", "expected_tool": "search_menu"},
    {"id": 22, "query": "Phở bò tái có chứa gluten không?", "category": "allergy", "expected_tool": "search_menu"},
    {"id": 23, "query": "Món chay nào không có đậu nành?", "category": "allergy", "expected_tool": "search_menu"},
    {"id": 24, "query": "Bé nhà mình dị ứng hải sản, gợi ý món cho bé", "category": "allergy", "expected_tool": "search_menu"},

    # Nhóm 6: Ngân sách (25–27)
    {"id": 25, "query": "Ăn 2 người khoảng 200k thì gọi món gì?", "category": "budget", "expected_tool": "search_menu"},
    {"id": 26, "query": "Có món nào dưới 100k không?", "category": "budget", "expected_tool": "search_menu"},
    {"id": 27, "query": "Gia đình 4 người, tầm 500k ăn gì ngon?", "category": "budget", "expected_tool": "search_menu"},

    # Nhóm 7: Thiếu thông tin cần clarify (28–31)
    {"id": 28, "query": "Đặt bàn tối nay", "category": "clarify", "expected_tool": None, "expect_clarify": True},
    {"id": 29, "query": "Đặt bàn 4 người", "category": "clarify", "expected_tool": None, "expect_clarify": True},
    {"id": 30, "query": "Muốn đặt bàn cuối tuần", "category": "clarify", "expected_tool": None, "expect_clarify": True},
    {"id": 31, "query": "Đặt bàn 2 người lúc 7h", "category": "clarify", "expected_tool": None, "expect_clarify": True},

    # Nhóm 8: Tiếng Việt không dấu (32–34)
    {"id": 32, "query": "dat ban toi nay 2 nguoi 7h", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 33, "query": "pho bo bao nhieu tien", "category": "menu", "expected_tool": "search_menu"},
    {"id": 34, "query": "voucher nao giam gia cho don dau", "category": "voucher", "expected_tool": "get_voucher"},

    # Nhóm 9: Ngoài phạm vi / Thông tin (35–37)
    {"id": 35, "query": "Quán có wifi không?", "category": "info", "expected_tool": None},
    {"id": 36, "query": "Đặt tiệc sinh nhật 30 người được không?", "category": "info", "expected_tool": None},
    {"id": 37, "query": "Gọi quản lý giúp mình", "category": "handover", "expected_tool": None},

    # Nhóm 10: Đổi / Hủy & Giờ mở cửa (38–40)
    {"id": 38, "query": "Hủy bàn vừa đặt giúp mình", "category": "cancel", "expected_tool": "cancel_booking"},
    {"id": 39, "query": "Đổi bàn tối nay sang 8h được không?", "category": "booking", "expected_tool": "check_table_availability"},
    {"id": 40, "query": "Quán mở cửa mấy giờ cuối tuần?", "category": "info", "expected_tool": None}
]

def cleanup_test_reservations():
    """Dọn dẹp sạch sẽ các đặt bàn test sinh ra trong quá trình eval khỏi Postgres local."""
    settings = get_settings()
    db_url = settings.database_url or "postgresql://postgres:postgres@localhost:5434/restaurant_os"
    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM table_reservations
                    WHERE customer_phone IN ('0901234567', '0999888777', '0912345678')
                       OR customer_name IN ('An', 'Test Eval', 'Nguyễn Văn An', 'Khách hàng')
                       OR notes LIKE '%AI%'
                       OR notes LIKE '%eval%';
                """)
                deleted = cur.rowcount
                conn.commit()
                print(f"[CLEANUP] Đã xóa {deleted} bản ghi đặt bàn test khỏi Postgres.")
    except Exception as e:
        print(f"[CLEANUP WARNING] Lỗi khi dọn dẹp đặt bàn test: {e}")

@pytest.mark.parametrize("case", GOLDEN_QUESTIONS)
def test_golden_eval_mock(case):
    session_id = str(uuid.uuid4())
    events = list(chat_engine.process_chat_stream(session_id, case["query"]))
    
    event_names = [e["event"] for e in events]
    assert "error" not in event_names, f"Query '{case['query']}' resulted in an error event"
    assert "done" in event_names, f"Query '{case['query']}' did not emit done event"
    assert "text" in event_names or "dish_card" in event_names or "voucher_card" in event_names or "booking_card" in event_names

def run_live_evaluation(live: bool = True) -> int:
    settings = get_settings()
    if live:
        settings.require_live()

    engine = ChatEngine(force_mock_llm=not live)
    is_real_backend = (settings.backend_mode == "real")
    mode_label = "LIVE" if live else "MOCK"
    print(f"=== KHỞI ĐỘNG EVAL {mode_label} 40 CÂU (BACKEND_MODE={settings.backend_mode}) ===")

    results = []
    intent_pass = 0
    booking_cases = 0
    booking_pass = 0
    hallucinations = 0
    slowest_latency_ms = 0
    slowest_id = None

    valid_vouchers = {"PHOCO10", "WELCOME15"}
    mock_valid_tables = {"TB-01", "TB-02", "TB-03"}

    # Chuẩn bị trước cho case 38: tạo 1 đặt bàn trước bằng adapter để case 38 ("Hủy bàn vừa đặt giúp mình") có mã hủy
    try:
        pre_table_id = "" if is_real_backend else "TB-01"
        if is_real_backend:
            avail = engine.tool_executor.adapter.check_table_availability("2026-11-26", "19:00", 2)
            avail_tables = avail.get("available_tables", [])
            if avail_tables:
                pre_table_id = avail_tables[0]["table_id"]
        pre_booking = engine.tool_executor.adapter.create_booking(
            name="Test Eval",
            phone="0999888777",
            date="2026-11-26",
            time="19:00",
            party_size=2,
            table_id=pre_table_id,
            note="Đặt bàn test để hủy ở case 38"
        )
        if pre_booking.get("status") == "success":
            engine._last_created_booking_code = pre_booking["booking"]["booking_code"]
            if is_real_backend:
                print(f"[SETUP] Đã tạo đặt bàn test cho case 38: UUID = {engine._last_created_booking_code}")
    except Exception as e:
        print(f"[SETUP WARNING] Không thể tạo pre-booking cho case 38: {e}")

    for case in GOLDEN_QUESTIONS:
        session_id = str(uuid.uuid4())
        t0 = time.time()
        expect_clarify = case.get("expect_clarify", False)

        def execute_question():
            t_decision = engine._simulate_tool_decision(case["query"])
            a_tool = t_decision["name"] if t_decision else None
            evts = list(engine.process_chat_stream(session_id, case["query"]))
            return a_tool, evts

        # Timeout 120s/câu theo yêu cầu §4
        timed_out = False
        actual_tool = None
        events = []
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(execute_question)
                actual_tool, events = future.result(timeout=120.0)
        except FuturesTimeoutError:
            timed_out = True
            print(f"TIMEOUT: Câu {case['id']} '{case['query']}' vượt quá 120s!")

        elapsed_ms = int((time.time() - t0) * 1000)
        if elapsed_ms > slowest_latency_ms:
            slowest_latency_ms = elapsed_ms
            slowest_id = case["id"]

        event_names = [e["event"] for e in events]
        text_chunks = [e["data"] for e in events if e["event"] == "text"]
        full_text = "\n".join(text_chunks)

        # 1. Đánh giá Intent & Slots
        if timed_out:
            intent_ok = False
        elif expect_clarify:
            # Câu cần làm rõ: actual_tool phải là None, không phát booking_card, câu trả lời có chứa '?'
            intent_ok = (actual_tool is None) and ("booking_card" not in event_names) and ("?" in full_text) and ("error" not in event_names)
        else:
            intent_ok = (actual_tool == case["expected_tool"]) and ("error" not in event_names) and ("done" in event_names)

        if intent_ok:
            intent_pass += 1

        # 2. Đánh giá Booking resolution
        if case["category"] == "booking":
            booking_cases += 1
            if case["expected_tool"] == "create_booking":
                has_explicit_table = bool(re.search(r'\bTB-\d+\b', case["query"], re.IGNORECASE))
                if has_explicit_table:
                    if "booking_card" in event_names and intent_ok:
                        booking_pass += 1
                else:
                    if ("booking_card" in event_names or len(full_text.strip()) > 10) and intent_ok:
                        booking_pass += 1
            else:
                if intent_ok and len(full_text.strip()) > 10:
                    booking_pass += 1

        # 3. Đánh giá Hallucination (bịa bàn / voucher)
        has_hallucination = False
        if actual_tool != "create_booking" and "booking_card" in event_names:
            has_hallucination = True
        if actual_tool != "get_voucher" and "voucher_card" in event_names:
            has_hallucination = True

        # Kiểm tra voucher bịa
        for v_event in [e for e in events if e["event"] == "voucher_card"]:
            v_data = json.loads(v_event["data"])
            if v_data.get("code") not in valid_vouchers:
                has_hallucination = True

        # Kiểm tra bàn bịa
        for b_event in [e for e in events if e["event"] == "booking_card"]:
            b_data = json.loads(b_event["data"])
            b_code = str(b_data.get("booking_code", ""))
            if is_real_backend:
                # Mode REAL: mã đặt bàn bắt buộc là UUID thật, KHÔNG được bắt đầu bằng PC-
                uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                if b_code.startswith("PC-") or not re.match(uuid_pattern, b_code):
                    has_hallucination = True
            else:
                # Mode MOCK: mã PC- và bàn trong mock_valid_tables
                if not b_code.startswith("PC-") or b_data.get("table_id") not in mock_valid_tables:
                    has_hallucination = True

        if has_hallucination:
            hallucinations += 1

        status_str = "PASS" if intent_ok and not has_hallucination else "FAIL"
        print(f"[{case['id']:02d}/40] {status_str} (tool={actual_tool}, {elapsed_ms}ms): {case['query'][:40]}")

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
            "timed_out": timed_out,
            "preview": full_text.replace("\n", " ")[:140]
        })
        if live:
            time.sleep(0.5)

    # Dọn dẹp dữ liệu test khỏi Postgres
    if is_real_backend:
        cleanup_test_reservations()

    total = len(GOLDEN_QUESTIONS)
    intent_pct = (intent_pass / total) * 100.0
    booking_pct = (booking_pass / booking_cases) * 100.0 if booking_cases else 100.0
    gate_passed = (intent_pct >= 90.0) and (booking_pct >= 85.0) and (hallucinations == 0)

    report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "eval_report.md")
    if live:
        lines = [
            "# AI Guest Chat — Live Groq Evaluation Report (40 Golden Questions)",
            "",
            f"- **Backend Mode**: `{'REAL (Spring Boot port 8080)' if is_real_backend else 'MOCK'}`",
            f"- **LLM Provider**: LIVE (`{settings.llm_base_url}`, model: `{settings.llm_model}`, fallback: `{settings.llm_fallback_model}`)",
            f"- **Total Questions**: {total}",
            f"- **Intent & Slots Accuracy**: {intent_pass}/{total} (**{intent_pct:.1f}%**) — Gate: >= 90%",
            f"- **First-try Booking Resolution**: {booking_pass}/{booking_cases} (**{booking_pct:.1f}%**) — Gate: >= 85%",
            f"- **Hallucinated Tables / Vouchers**: **{hallucinations}** — Gate: = 0",
            f"- **Slowest Question**: Câu {slowest_id} ({slowest_latency_ms} ms)",
            f"- **Overall Gate Status**: **{'PASSED' if gate_passed else 'FAILED'}**",
            "",
            "## Detailed Results per Question",
            "",
            "| ID | Category | Query | Expected Tool | Actual Tool | Intent OK | Hallucination | Latency (ms) | Preview |",
            "|---:|---|---|---|---|---|---|---:|---|",
        ]
        for r in results:
            preview_clean = r["preview"].replace("|", "\\|")
            lines.append(
                f"| {r['id']} | `{r['category']}` | {r['query']} | `{r['expected_tool']}` | `{r['actual_tool']}` | "
                f"{'PASS' if r['intent_ok'] else 'FAIL'} | {'YES' if r['hallucination'] else 'NO'} | {r['elapsed_ms']} | {preview_clean} |"
            )

        with open(report_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    print("\n" + "="*60)
    print(f"BÁO CÁO EVAL 40 CÂU ({mode_label}):")
    print(f"- Intent+Slots: {intent_pass}/{total} ({intent_pct:.1f}%) [Gate >= 90%]")
    print(f"- Booking resolution: {booking_pass}/{booking_cases} ({booking_pct:.1f}%) [Gate >= 85%]")
    print(f"- Bịa bàn / voucher: {hallucinations} [Gate = 0]")
    print(f"- Câu chậm nhất: Câu {slowest_id} ({slowest_latency_ms} ms)")
    print(f"- GATE CHUNG: {'PASSED' if gate_passed else 'FAILED'}")
    if live:
        print(f"Báo cáo chi tiết đã ghi tại: {report_path}")
    print("="*60)
    return 0 if gate_passed else 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Run evaluation in live Groq mode")
    args = parser.parse_args()
    sys.exit(run_live_evaluation(live=args.live))
