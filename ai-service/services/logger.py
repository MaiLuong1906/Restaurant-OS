from typing import Optional, List, Dict, Any
import hashlib
import json
import psycopg
from config import get_settings

class ChatLogger:
    # Bộ nhớ tạm theo session_id để giữ lịch sử hội thoại khi chạy chế độ mock / không có Postgres
    _memory_messages: Dict[str, List[Dict[str, Any]]] = {}

    def __init__(self, database_url: Optional[str] = None):
        settings = get_settings()
        self.database_url = database_url or settings.database_url or "postgresql://postgres:postgres@localhost:5434/restaurant_os"

    @staticmethod
    def hash_phone(phone: Optional[str]) -> Optional[str]:
        if not phone:
            return None
        clean_phone = phone.strip()
        return hashlib.sha256(clean_phone.encode("utf-8")).hexdigest()

    def ensure_session(self, session_id: str, phone: Optional[str] = None) -> None:
        phone_h = self.hash_phone(phone)
        try:
            with psycopg.connect(self.database_url, connect_timeout=1) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO chat_sessions (session_id, phone_hash)
                        VALUES (%s, %s)
                        ON CONFLICT (session_id) DO UPDATE
                        SET phone_hash = COALESCE(EXCLUDED.phone_hash, chat_sessions.phone_hash);
                    """, (session_id, phone_h))
                conn.commit()
        except Exception:
            pass

    def log_message(self, session_id: str, role: str, content: str, tool_calls: Optional[List[Dict[str, Any]]] = None) -> None:
        # Luôn lưu vào bộ nhớ theo session_id để fallback khi DB không kết nối được
        mem_list = self._memory_messages.setdefault(session_id, [])
        mem_list.append({
            "role": role,
            "content": content,
            "tool_calls": tool_calls,
        })

        self.ensure_session(session_id)
        try:
            with psycopg.connect(self.database_url, connect_timeout=1) as conn:
                with conn.cursor() as cur:
                    tool_calls_json = json.dumps(tool_calls, ensure_ascii=False) if tool_calls else None
                    cur.execute("""
                        INSERT INTO chat_messages (session_id, role, content, tool_calls)
                        VALUES (%s, %s, %s, %s::jsonb);
                    """, (session_id, role, content, tool_calls_json))
                conn.commit()
        except Exception:
            pass

    def get_session_history(self, session_id: str, limit: int = 12) -> List[Dict[str, Any]]:
        """Đọc lịch sử hội thoại của session_id (xếp cũ -> mới). Ưu tiên đọc từ DB, fallback sang bộ nhớ."""
        try:
            with psycopg.connect(self.database_url, connect_timeout=1) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT role, content, tool_calls
                        FROM chat_messages
                        WHERE session_id = %s
                        ORDER BY created_at DESC, id DESC
                        LIMIT %s;
                    """, (session_id, limit))
                    rows = cur.fetchall()
                    if rows:
                        history = []
                        for r in reversed(rows):
                            tc = r[2]
                            if isinstance(tc, str):
                                try:
                                    tc = json.loads(tc)
                                except Exception:
                                    tc = None
                            history.append({
                                "role": r[0],
                                "content": r[1],
                                "tool_calls": tc,
                            })
                        return history
        except Exception:
            pass

        return list(self._memory_messages.get(session_id, [])[-limit:])

    def log_feedback(self, session_id: str, rating: int, message_id: Optional[str] = None, note: Optional[str] = None) -> None:
        try:
            with psycopg.connect(self.database_url, connect_timeout=1) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO chat_feedback (session_id, message_id, rating, note)
                        VALUES (%s, %s, %s, %s);
                    """, (session_id, message_id, rating, note))
                conn.commit()
        except Exception:
            pass
