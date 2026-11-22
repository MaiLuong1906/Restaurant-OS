from typing import Optional, List, Dict, Any
import hashlib
import json
import psycopg
from config import get_settings

class ChatLogger:
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
            with psycopg.connect(self.database_url) as conn:
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
        self.ensure_session(session_id)
        try:
            with psycopg.connect(self.database_url) as conn:
                with conn.cursor() as cur:
                    tool_calls_json = json.dumps(tool_calls, ensure_ascii=False) if tool_calls else None
                    cur.execute("""
                        INSERT INTO chat_messages (session_id, role, content, tool_calls)
                        VALUES (%s, %s, %s, %s::jsonb);
                    """, (session_id, role, content, tool_calls_json))
                conn.commit()
        except Exception:
            pass

    def log_feedback(self, session_id: str, rating: int, message_id: Optional[str] = None, note: Optional[str] = None) -> None:
        try:
            with psycopg.connect(self.database_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO chat_feedback (session_id, message_id, rating, note)
                        VALUES (%s, %s, %s, %s);
                    """, (session_id, message_id, rating, note))
                conn.commit()
        except Exception:
            pass
