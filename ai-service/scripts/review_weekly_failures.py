import os
import sys
import argparse
import json
from datetime import datetime
from typing import List, Dict, Any
import psycopg

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_settings

def review_weekly_failures(days: int = 7, output_path: str = "review_weekly_report.md") -> str:
    settings = get_settings()
    db_url = settings.database_url or "postgresql://postgres:postgres@localhost:5434/restaurant_os"

    lines = [
        f"# Báo cáo Review Định Kỳ Hàng Tuần — Các Phiên Chat Lỗi & Đánh Giá Thấp",
        f"- **Thời gian quét**: 7 ngày gần nhất (tính đến {datetime.now().strftime('%Y-%m-%d %H:%M:%S')})",
        f"- **Database URL**: `{db_url.split('@')[-1]}`",
        "",
        "## Tổng quan các tiêu chí lọc lỗi:",
        "1. **Event / Tool Error**: Có lỗi từ hệ thống hoặc lỗi thực thi tool backend.",
        "2. **Đánh giá thấp**: Khách gửi phản hồi feedback với rating <= 2.",
        "3. **Lặp lại câu hỏi**: Người dùng lặp lại câu hỏi 2+ lần trong cùng một phiên (dấu hiệu AI trả lời chưa đúng ý).",
        "",
        "---",
        ""
    ]

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                # 1. Lấy tất cả feedback rating <= 2 trong N ngày
                cur.execute("""
                    SELECT session_id, rating, note, created_at
                    FROM chat_feedback
                    WHERE rating <= 2 AND created_at >= NOW() - INTERVAL '%s days'
                    ORDER BY created_at DESC;
                """, (days,))
                bad_feedbacks = {row[0]: {"rating": row[1], "note": row[2], "created_at": row[3]} for row in cur.fetchall()}

                # 2. Lấy các tin nhắn trong N ngày gần nhất
                cur.execute("""
                    SELECT session_id, role, content, tool_calls, created_at
                    FROM chat_messages
                    WHERE created_at >= NOW() - INTERVAL '%s days'
                    ORDER BY session_id, created_at ASC;
                """, (days,))
                messages_by_session: Dict[str, List[Dict[str, Any]]] = {}
                for row in cur.fetchall():
                    s_id = str(row[0])
                    if s_id not in messages_by_session:
                        messages_by_session[s_id] = []
                    messages_by_session[s_id].append({
                        "role": row[1],
                        "content": row[2],
                        "tool_calls": row[3],
                        "created_at": row[4]
                    })

        flagged_sessions = []

        for s_id, msgs in messages_by_session.items():
            reasons = []

            # Check (a): Tool errors or system errors
            has_error = False
            for m in msgs:
                tc = m.get("tool_calls")
                if tc:
                    tc_str = json.dumps(tc, ensure_ascii=False).lower()
                    if '"status": "failed"' in tc_str or '"status": "error"' in tc_str:
                        has_error = True
                        reasons.append("Lỗi thực thi tool backend (status=failed/error)")
                        break

            # Check (b): Low feedback rating
            if s_id in bad_feedbacks:
                fb = bad_feedbacks[s_id]
                reasons.append(f"Đánh giá thấp từ khách hàng: {fb['rating']} sao (Ghi chú: {fb['note'] or 'Không có'})")

            # Check (c): User repeated same/similar queries 2+ times
            user_queries = [m["content"].strip().lower() for m in msgs if m["role"] == "user"]
            seen_queries = set()
            repeated = False
            for q in user_queries:
                if q in seen_queries and len(q) > 4:
                    repeated = True
                    reasons.append(f"Khách hỏi lặp lại câu hỏi: '{q}'")
                    break
                seen_queries.add(q)

            if reasons:
                flagged_sessions.append({
                    "session_id": s_id,
                    "reasons": reasons,
                    "messages": msgs,
                    "feedback": bad_feedbacks.get(s_id)
                })

        lines.append(f"## Danh sách phiên cần review ({len(flagged_sessions)} phiên phát hiện)\n")

        if not flagged_sessions:
            lines.append("> **Không có phiên chat lỗi hoặc đánh giá thấp nào trong 7 ngày qua.** Toàn bộ hệ thống hoạt động ổn định.\n")
        else:
            for idx, s in enumerate(flagged_sessions, 1):
                lines.append(f"### {idx}. Session `{s['session_id']}`")
                lines.append(f"- **Lý do gắn cờ**: {'; '.join(s['reasons'])}")
                if s["feedback"]:
                    lines.append(f"- **Feedback**: {s['feedback']['rating']} sao - {s['feedback']['note']}")
                lines.append("")
                lines.append("#### Chi tiết hội thoại:")
                for m in s["messages"]:
                    role_icon = "👤 **Khách**" if m["role"] == "user" else "🤖 **AI**"
                    lines.append(f"- {role_icon}: {m['content']}")
                    if m.get("tool_calls"):
                        lines.append(f"  - *Tool Calls*: `{json.dumps(m['tool_calls'], ensure_ascii=False)}`")
                lines.append("\n---\n")

    except Exception as e:
        lines.append(f"> **Lỗi truy vấn database**: {e}\n")

    report_content = "\n".join(lines) + "\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(f"Báo cáo review hàng tuần đã được tạo tại: {output_path}")
    return report_content

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Review weekly chat failures and negative feedbacks")
    parser.add_argument("--days", type=int, default=7, help="Number of past days to inspect")
    parser.add_argument("--output", type=str, default="review_weekly_report.md", help="Output markdown path")
    args = parser.parse_args()
    review_weekly_failures(days=args.days, output_path=args.output)
