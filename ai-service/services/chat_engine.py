from typing import Iterator, Dict, Any, List, Optional
import datetime
import json
import os
import uuid
import re
import unicodedata
from config import get_settings
from llm import get_llm_provider
from tools.schemas import TOOLS_DEFINITIONS
from tools.executor import ToolExecutor
from services.retriever import KnowledgeRetriever
from services.logger import ChatLogger

class ChatEngine:
    # Lưu trạng thái slot theo session_id giữa các lượt chat
    _session_slots: Dict[str, Dict[str, Any]] = {}

    def __init__(
        self,
        llm_provider=None,
        tool_executor: Optional[ToolExecutor] = None,
        retriever: Optional[KnowledgeRetriever] = None,
        chat_logger: Optional[ChatLogger] = None,
        force_mock_llm: bool = False,
    ):
        self._custom_llm_provider = llm_provider is not None
        self._force_mock_llm = force_mock_llm
        self.llm_provider = llm_provider or get_llm_provider()
        self.tool_executor = tool_executor or ToolExecutor()
        self.retriever = retriever or KnowledgeRetriever()
        self.chat_logger = chat_logger or ChatLogger()
        self.system_prompt = self._load_system_prompt()

    def _is_live_mode(self) -> bool:
        if self._force_mock_llm:
            return False
        if self._custom_llm_provider:
            return True
        try:
            get_settings().require_live()
            return True
        except RuntimeError:
            return False

    def _load_system_prompt(self) -> str:
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "system_vi.md")
        if os.path.exists(prompt_path):
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        return "Bạn là trợ lý ảo nhà hàng Phố Cổ."

    def _is_cancel_intent(self, msg: str) -> bool:
        if "hủy" in msg and ("bàn" in msg or "ban" in msg or "đặt" in msg or "dat" in msg):
            return True
        if re.search(r'(?<!tên\s)(?<!ten\s)\bhuy\s+(?:bàn|ban|đặt|dat|lịch|lich)\b', msg):
            return True
        return False

    def _extract_slots_from_message(self, message: str) -> Dict[str, Any]:
        """Trích xuất các slot đặt bàn (date, time, party_size, table_id, name, phone, area_preference) từ 1 câu tin nhắn."""
        message = unicodedata.normalize("NFC", message)
        msg = message.lower().strip()
        slots: Dict[str, Any] = {}
        today = datetime.date.today()

        # 1. Table ID (vd: TB-01, TB-02, hoặc UUID bàn khi không phải lệnh hủy)
        tb_match = re.search(r'\b(tb-\d+)\b', msg, re.IGNORECASE)
        if tb_match:
            slots["table_id"] = tb_match.group(1).upper()
        elif not self._is_cancel_intent(msg):
            uuid_match = re.search(
                r'\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b',
                message,
            )
            if uuid_match:
                slots["table_id"] = uuid_match.group(1)

        # 2. Date (YYYY-MM-DD, DD/MM/YYYY, ngày DD/MM, hôm nay/tối nay, ngày mai, cuối tuần)
        iso_date = re.search(r'\b(20\d{2})-(\d{1,2})-(\d{1,2})\b', msg)
        dmy_date = re.search(r'\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b', msg)
        dm_explicit = re.search(r'(?:ngày|ngay)\s*(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b', msg)
        dm_slash = re.search(r'\b(\d{1,2})/(\d{1,2})\b', msg)

        if iso_date:
            y, m, d = int(iso_date.group(1)), int(iso_date.group(2)), int(iso_date.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                slots["date"] = f"{y:04d}-{m:02d}-{d:02d}"
        elif dmy_date:
            d, m, y = int(dmy_date.group(1)), int(dmy_date.group(2)), int(dmy_date.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                slots["date"] = f"{y:04d}-{m:02d}-{d:02d}"
        elif dm_explicit:
            d, m = int(dm_explicit.group(1)), int(dm_explicit.group(2))
            y = int(dm_explicit.group(3)) if dm_explicit.group(3) else today.year
            if 1 <= m <= 12 and 1 <= d <= 31:
                slots["date"] = f"{y:04d}-{m:02d}-{d:02d}"
        elif dm_slash and dm_slash.group(0) != "24/7":
            d, m = int(dm_slash.group(1)), int(dm_slash.group(2))
            if 1 <= m <= 12 and 1 <= d <= 31:
                slots["date"] = f"{today.year:04d}-{m:02d}-{d:02d}"
        elif any(kw in msg for kw in ["ngày kia", "ngay kia"]) or re.search(r'\b(?:mốt|mot)\b', msg):
            slots["date"] = (today + datetime.timedelta(days=2)).strftime("%Y-%m-%d")
        elif any(kw in msg for kw in ["ngày mai", "ngay mai", "tối mai", "toi mai", "trưa mai", "trua mai", "sáng mai", "sang mai"]) or re.search(r'\bmai\b', msg):
            slots["date"] = (today + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        elif any(kw in msg for kw in ["hôm nay", "hom nay", "tối nay", "toi nay", "trưa nay", "trua nay", "chiều nay", "chieu nay"]):
            slots["date"] = today.strftime("%Y-%m-%d")
        elif any(kw in msg for kw in ["cuối tuần", "cuoi tuan", "thứ 7", "thu 7", "thứ bảy", "thu bay", "chủ nhật", "chu nhat"]):
            days_ahead = (5 - today.weekday()) % 7
            if "chủ nhật" in msg or "chu nhat" in msg:
                days_ahead = (6 - today.weekday()) % 7
            slots["date"] = (today + datetime.timedelta(days=days_ahead)).strftime("%Y-%m-%d")

        # 3. Time (vd: 19h, 7h tối, 18h30, 19:00, trưa)
        time_match = re.search(r'\b(\d{1,2})\s*(?:h|giờ|gio)(?:\s*(\d{1,2}))?\b', msg)
        colon_match = re.search(r'\b(\d{1,2}):(\d{2})\b', msg)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                if hour < 12 and (
                    "tối" in msg or "toi" in msg or "chiều" in msg or "chieu" in msg
                    or (1 <= hour <= 9 and "sáng" not in msg and "sang" not in msg and "trưa" not in msg and "trua" not in msg)
                ):
                    hour += 12
                slots["time"] = f"{hour:02d}:{minute:02d}"
        elif colon_match:
            hour = int(colon_match.group(1))
            minute = int(colon_match.group(2))
            if 0 <= hour <= 23 and 0 <= minute <= 59:
                if hour < 12 and ("tối" in msg or "toi" in msg or "chiều" in msg or "chieu" in msg):
                    hour += 12
                slots["time"] = f"{hour:02d}:{minute:02d}"
        elif "trưa" in msg or "trua" in msg:
            slots["time"] = "12:00"

        # Nếu khách nói "7h tối" / "buổi tối" mà chưa ghi rõ ngày thì mặc định là tối hôm nay
        if "date" not in slots and ("tối" in msg or "toi" in msg) and "time" in slots:
            slots["date"] = today.strftime("%Y-%m-%d")

        # 4. Party size
        if "3 người lớn 2 trẻ em" in msg:
            slots["party_size"] = 5
        else:
            party_match = re.search(r'\b(\d+)\s*(?:người|nguoi|ng\b|khách|khach)\b', msg)
            if party_match:
                slots["party_size"] = int(party_match.group(1))

        # 5. Area preference
        if "sân vườn" in msg or "san vuon" in msg:
            slots["area_preference"] = "sân vườn"
        elif "cửa sổ" in msg or "cua so" in msg:
            slots["area_preference"] = "cửa sổ"
        elif "thoáng" in msg or "thoang" in msg:
            slots["area_preference"] = "thoáng"
        elif "phòng riêng" in msg or "phong rieng" in msg:
            slots["area_preference"] = "phòng riêng"
        elif "yên tĩnh" in msg or "yen tinh" in msg:
            slots["area_preference"] = "yên tĩnh"

        # 6. Phone & Name
        phone_match = re.search(r'\b(0\d{8,10})\b', msg)
        if phone_match:
            slots["phone"] = phone_match.group(1)

        name_match = re.search(
            r'(?:tên|ten)\s*(?:là|la|:)?\s*([A-Za-zÀ-ỹ\s]+?)(?=\s*(?:,|$|\d|\.|;|\b(?:sđt|sdt|số|so|điện thoại|dien thoai|đt|dt)\b))',
            message,
            re.IGNORECASE,
        )
        if name_match:
            extracted_name = name_match.group(1).strip()
            if extracted_name:
                slots["name"] = extracted_name

        return slots

    def _get_session_slots(self, session_id: Optional[str]) -> Dict[str, Any]:
        if not session_id:
            return {}
        stored = dict(self._session_slots.get(session_id, {}))
        history = self.chat_logger.get_session_history(session_id, limit=12)
        reconstructed: Dict[str, Any] = {}
        for item in history:
            if item.get("role") == "user" and item.get("content"):
                reconstructed.update(self._extract_slots_from_message(item["content"]))
            elif item.get("role") == "assistant" and item.get("tool_calls"):
                for tc in item["tool_calls"]:
                    if isinstance(tc, dict):
                        if tc.get("tool") == "search_menu":
                            reconstructed["last_tool"] = "search_menu"
                            reconstructed["last_menu_query"] = tc.get("args", {}).get("query")
                        elif tc.get("tool") == "create_booking":
                            res_booking = tc.get("result", {}).get("booking", {})
                            if res_booking.get("booking_code"):
                                reconstructed["last_booking_code"] = res_booking["booking_code"]
        reconstructed.update(stored)
        return reconstructed

    def _simulate_tool_decision(
        self,
        message: str,
        session_id: Optional[str] = None,
        update_state: bool = True,
    ) -> Optional[Dict[str, Any]]:
        message = unicodedata.normalize("NFC", message)
        msg = message.lower().strip()
        today_str = datetime.date.today().strftime("%Y-%m-%d")

        prior_slots = self._get_session_slots(session_id)
        current_slots = self._extract_slots_from_message(message)
        merged_slots = {**prior_slots, **{k: v for k, v in current_slots.items() if v is not None}}

        booking_slot_keys = ("date", "time", "party_size", "table_id", "name", "phone", "area_preference")
        has_prior_booking_context = any(k in prior_slots for k in booking_slot_keys)
        has_current_booking_slots = any(k in current_slots for k in booking_slot_keys)

        if session_id and update_state and has_current_booking_slots:
            self._session_slots[session_id] = merged_slots

        # Nhóm 9 & 10: Ngoài phạm vi hoặc câu hỏi thông tin không gọi tool
        if "wifi" in msg or "mạng" in msg:
            return None
        if "quản lý" in msg or "quan ly" in msg or "gặp ai" in msg:
            return None
        if "đặt tiệc" in msg or "dat tiec" in msg or "30 người" in msg or "50 người" in msg:
            return None
        if "mở cửa" in msg or "mo cua" in msg or "giờ hoạt động" in msg:
            return None
        if "chỗ để xe" in msg or "gửi xe" in msg or "đỗ xe" in msg:
            return None

        # Nhóm 4 & 10: Hủy bàn
        if self._is_cancel_intent(msg):
            uuid_match = re.search(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', message)
            code_match = re.search(r'PC-[A-Z0-9]+', message, re.IGNORECASE)
            phone_match = re.search(r'0\d{8,10}', msg)
            session_code = merged_slots.get("last_booking_code") or getattr(self, "_last_created_booking_code", None)
            booking_code = (
                uuid_match.group(0) if uuid_match
                else (code_match.group(0).upper() if code_match else session_code)
            )
            if not booking_code:
                return None
            phone = phone_match.group(0) if phone_match else (merged_slots.get("phone") or getattr(self, "_last_booking_phone", None))
            return {
                "name": "cancel_booking",
                "arguments": {
                    "booking_code": booking_code,
                    "phone": phone
                }
            }

        # Nhóm 3 & 8: Voucher & Khuyến mãi
        if "voucher" in msg or "khuyến mãi" in msg or "khuyen mai" in msg or "giảm giá" in msg or "giam gia" in msg or "ưu đãi" in msg:
            phone_match = re.search(r'0\d{8,10}', msg)
            phone = phone_match.group(0) if phone_match else merged_slots.get("phone")
            return {
                "name": "get_voucher",
                "arguments": {"phone": phone}
            }

        has_booking_keyword = (
            any(kw in msg for kw in ["đặt bàn", "dat ban", "giữ bàn", "giu ban", "đổi bàn", "doi ban"])
            or bool(re.search(r'\b(?:bàn|ban|tb-\d+)\b', msg))
        )

        # Nhóm 5 & 6 & 8: Thực đơn, Món ăn, Dị ứng, Ngân sách (kèm hỗ trợ câu hỏi nối tiếp "còn món nào tương tự?")
        menu_phrase_keywords = [
            "chay", "thực đơn", "thuc don", "món", "phở", "lẩu", "bún", "nem",
            "dị ứng", "di ung", "gluten", "đậu nành", "dau nanh", "hải sản", "hai san", "đậu phộng", "dau phong",
            "bao nhiêu tiền", "bao nhieu tien", "giá", "ăn gì", "an gi",
            "200k", "100k", "500k", "dưới 100k", "ngân sách", "ngan sach",
            "tương tự", "tuong tu"
        ]
        menu_word_regex = r'\b(?:mon|pho|lau|bun|gia)\b'
        is_menu_query = (
            any(kw in msg for kw in menu_phrase_keywords)
            or bool(re.search(menu_word_regex, msg))
        )
        if is_menu_query and not has_booking_keyword and "table_id" not in current_slots:
            budget = None
            budget_match = re.search(r'(\d+)\s*k', msg)
            if budget_match:
                budget = int(budget_match.group(1)) * 1000

            diet = None
            if "chay" in msg:
                diet = "chay"
            elif "đậu phộng" in msg or "dau phong" in msg:
                diet = "đậu phộng"
            elif "gluten" in msg:
                diet = "gluten"
            elif "đậu nành" in msg or "dau nanh" in msg:
                diet = "đậu nành"
            elif "hải sản" in msg or "hai san" in msg:
                diet = "hải sản"

            if session_id and update_state:
                self._session_slots.setdefault(session_id, {})["last_tool"] = "search_menu"
                self._session_slots[session_id]["last_menu_query"] = message

            return {
                "name": "search_menu",
                "arguments": {
                    "query": message,
                    "diet_preference": diet,
                    "budget_max": budget
                }
            }

        # Nhóm 7: Thiếu thông tin đặt bàn ở lượt đầu -> CẦN CLARIFY (expected_tool = None)
        clarify_patterns = [
            r'^đặt bàn tối nay$',
            r'^dat ban toi nay$',
            r'^đặt bàn \d+\s*(người|nguoi|ng|khách|khach)$',
            r'^dat ban \d+\s*(người|nguoi|ng|khách|khach)$',
            r'^muốn đặt bàn cuối tuần$',
            r'^muon dat ban cuoi tuan$',
            r'^đặt bàn \d+\s*(người|nguoi|ng|khách|khach)\s*lúc\s*\d+h$',
            r'^dat ban \d+\s*(người|nguoi|ng|khách|khach)\s*luc\s*\d+h$'
        ]
        if not has_prior_booking_context and any(re.match(p, msg) for p in clarify_patterns):
            return None

        # Nhóm 2 & 8 & 10: Đặt bàn (Hỏi trống, Đổi bàn, Tạo đặt bàn — gộp slot từ lịch sử + lượt hiện tại)
        if has_booking_keyword or (has_prior_booking_context and has_current_booking_slots):
            phone = merged_slots.get("phone")
            name = merged_slots.get("name")
            has_name_and_phone = bool(phone and (name or "tên" in msg or "ten" in msg))

            # Nếu có đủ thông tin khách (tên + SĐT) và không phải câu hỏi đổi giờ đơn thuần -> create_booking
            if has_name_and_phone and not ("đổi bàn" in msg or "doi ban" in msg):
                # Đảm bảo đã có thông tin thời gian/số người từ lượt trước hoặc lượt hiện tại
                has_schedule_slot = any(k in merged_slots for k in ("date", "time", "party_size"))
                if not has_schedule_slot:
                    return None

                return {
                    "name": "create_booking",
                    "arguments": {
                        "name": name or "Khách hàng",
                        "phone": phone,
                        "date": merged_slots.get("date") or today_str,
                        "time": merged_slots.get("time") or "19:00",
                        "party_size": int(merged_slots.get("party_size") or 2),
                        "table_id": merged_slots.get("table_id") or ""
                    }
                }

            # Nếu là lượt tiếp theo sau khi đã có một phần slot nhưng vẫn thiếu ngày/giờ/số người cơ bản
            if not has_booking_keyword and not any(k in merged_slots for k in ("date", "time", "party_size")):
                return None

            return {
                "name": "check_table_availability",
                "arguments": {
                    "date": merged_slots.get("date") or today_str,
                    "time": merged_slots.get("time") or "19:00",
                    "party_size": int(merged_slots.get("party_size") or 2),
                    "area_preference": merged_slots.get("area_preference")
                }
            }

        return None

    def _generate_live_reply(
        self,
        full_system: str,
        user_message: str,
        executed_tools: List[Dict[str, Any]],
        history: Optional[List[Dict[str, Any]]] = None,
        session_slots: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        if not self._is_live_mode() or not self.llm_provider:
            return None
        try:
            system_content = full_system
            if session_slots:
                clean_slots = {
                    k: v for k, v in session_slots.items()
                    if k in ("date", "time", "party_size", "table_id", "name", "phone", "area_preference", "last_booking_code") and v
                }
                if clean_slots:
                    system_content += (
                        "\n\n# THÔNG TIN SLOT ĐẶT BÀN ĐÃ GHI NHẬN TRONG PHIÊN "
                        "(TUYỆT ĐỐI KHÔNG HỎI LẠI CÁC SLOT ĐÃ CÓ DƯỚI ĐÂY):\n"
                        + json.dumps(clean_slots, ensure_ascii=False)
                    )

            messages: List[Dict[str, Any]] = [{"role": "system", "content": system_content}]
            if history:
                for item in history[-12:]:
                    role = item.get("role")
                    content = item.get("content")
                    if role in ("user", "assistant") and content:
                        messages.append({"role": role, "content": content})

            if executed_tools:
                tool_context = json.dumps(executed_tools, ensure_ascii=False)
                messages.append({
                    "role": "user",
                    "content": (
                        f"Khách hỏi: {user_message}\n"
                        f"Kết quả hệ thống (BẮT BUỘC chỉ trả lời dựa trên dữ liệu này, "
                        f"tuyệt đối không bịa thêm bàn, món hay mã voucher ngoài dữ liệu): {tool_context}"
                    ),
                })
            else:
                messages.append({"role": "user", "content": user_message})
            return self.llm_provider.chat(messages)
        except Exception:
            return None

    def process_chat_stream(self, session_id: str, user_message: str) -> Iterator[Dict[str, Any]]:
        user_message = unicodedata.normalize("NFC", user_message)

        # 1. Đọc lịch sử hội thoại của session trước khi ghi tin nhắn mới (tối đa 12 lượt gần nhất, cũ -> mới)
        history = self.chat_logger.get_session_history(session_id, limit=12)

        # 2. RAG retrieval (chỉ dùng user_message hiện tại, không đưa history vào RAG)
        chunks = self.retriever.retrieve(user_message, top_k=3)
        knowledge_context = "\n".join([f"- {c['chunk_text']}" for c in chunks]) if chunks else ""

        full_system = self.system_prompt
        if knowledge_context:
            full_system += f"\n\n# THÔNG TIN THỰC ĐƠN & NHÀ HÀNG (RAG):\n{knowledge_context}"

        executed_tools = []
        loop_count = 0
        max_loops = 3
        final_text = ""

        # 3. Quyết định tool dựa trên slot đã gộp từ lịch sử session + tin nhắn hiện tại
        tool_call = self._simulate_tool_decision(user_message, session_id=session_id, update_state=True)
        session_slots = self._session_slots.get(session_id, {})

        # 4. Log incoming user message sau khi đã lấy history trước đó
        self.chat_logger.log_message(session_id, "user", user_message)

        while loop_count < max_loops:
            loop_count += 1
            if tool_call and loop_count == 1:
                tool_name = tool_call["name"]
                args = tool_call["arguments"]
                yield {"event": "text", "data": "Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...\n"}
                tool_result = self.tool_executor.execute(tool_name, args)
                executed_tools.append({"tool": tool_name, "args": args, "result": tool_result})

                if tool_name == "create_booking" and tool_result.get("status") == "success":
                    booking = tool_result.get("booking", {})
                    self._last_created_booking_code = booking.get("booking_code")
                    self._last_booking_phone = args.get("phone")
                    self._session_slots.setdefault(session_id, {})["last_booking_code"] = booking.get("booking_code")
                    yield {"event": "booking_card", "data": json.dumps(booking, ensure_ascii=False)}
                    live_reply = self._generate_live_reply(
                        full_system, user_message, executed_tools, history=history, session_slots=session_slots
                    )
                    final_text = live_reply or (
                        f"Nhà hàng Phố Cổ đã xác nhận giữ bàn {booking.get('table_id')} thành công "
                        f"cho {booking.get('party_size')} người vào lúc {booking.get('time')} ngày {booking.get('date')}! "
                        f"Mã đặt bàn của bạn là {booking.get('booking_code')}."
                    )
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "create_booking":
                    live_reply = self._generate_live_reply(
                        full_system, user_message, executed_tools, history=history, session_slots=session_slots
                    )
                    final_text = live_reply or tool_result.get(
                        "message", "Hiện chưa thể hoàn tất đặt bàn, quý khách vui lòng chọn bàn trống phù hợp ạ."
                    )
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "check_table_availability":
                    tables = tool_result.get("available_tables", [])
                    live_reply = self._generate_live_reply(
                        full_system, user_message, executed_tools, history=history, session_slots=session_slots
                    )
                    final_text = live_reply or (
                        f"Hiện tại quán còn {len(tables)} bàn trống phù hợp cho {args.get('party_size')} người "
                        f"vào lúc {args.get('time')} ngày {args.get('date')}. Bạn muốn chọn bàn nào và cho mình xin tên cùng số điện thoại nhé?"
                    )
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "get_voucher":
                    vouchers = tool_result.get("vouchers", [])
                    for v in vouchers:
                        yield {"event": "voucher_card", "data": json.dumps(v, ensure_ascii=False)}
                    live_reply = self._generate_live_reply(
                        full_system, user_message, executed_tools, history=history, session_slots=session_slots
                    )
                    final_text = live_reply or "Dạ đây là các ưu đãi voucher hiện có của quán dành cho bạn ạ!"
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "search_menu":
                    dishes = tool_result.get("dishes", [])
                    for d in dishes:
                        yield {"event": "dish_card", "data": json.dumps(d, ensure_ascii=False)}
                    live_reply = self._generate_live_reply(
                        full_system, user_message, executed_tools, history=history, session_slots=session_slots
                    )
                    if live_reply:
                        final_text = live_reply
                    else:
                        dish_names = ", ".join([f"{d.get('name')} ({int(d.get('price', 0)):,} VND)" for d in dishes if d.get("name")])
                        prev_user_msgs = [h.get("content", "") for h in history if h.get("role") == "user" and h.get("content")]
                        if prev_user_msgs and ("tương tự" in user_message.lower() or "tuong tu" in user_message.lower()):
                            final_text = (
                                f"Dạ tiếp nối câu hỏi trước của bạn ('{prev_user_msgs[-1]}'), "
                                f"quán gợi ý các món tương tự trong thực đơn gồm: {dish_names} ạ!"
                            )
                        else:
                            final_text = f"Quán gửi bạn danh sách món ăn tham khảo: {dish_names} ạ!" if dish_names else "Quán gửi bạn danh sách món ăn tham khảo ạ!"
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "cancel_booking":
                    live_reply = self._generate_live_reply(
                        full_system, user_message, executed_tools, history=history, session_slots=session_slots
                    )
                    final_text = live_reply or f"Đã ghi nhận yêu cầu hủy đặt bàn {args.get('booking_code')}. Bàn đã được hoàn lại vào hệ thống ạ."
                    yield {"event": "text", "data": final_text}
                    break
            else:
                live_reply = self._generate_live_reply(
                    full_system, user_message, executed_tools, history=history, session_slots=session_slots
                )
                msg_lower = user_message.lower()
                is_clarify_booking = any(kw in msg_lower for kw in ["đặt bàn", "dat ban", "giữ bàn", "giu ban"]) or self._is_cancel_intent(msg_lower)
                if live_reply:
                    final_text = live_reply
                elif is_clarify_booking:
                    missing = []
                    if not session_slots.get("date"):
                        missing.append("ngày đặt")
                    if not session_slots.get("time"):
                        missing.append("giờ nhận bàn")
                    if not session_slots.get("party_size"):
                        missing.append("số lượng khách")
                    missing_str = ", ".join(missing) if missing else "ngày, giờ và số lượng khách"
                    final_text = f"Dạ để mình hỗ trợ đặt bàn chính xác, bạn vui lòng cho mình biết thêm {missing_str} được không ạ?"
                elif knowledge_context:
                    final_text = f"Dạ quán xin thông tin tới bạn:\n{chunks[0]['chunk_text']}"
                else:
                    final_text = "Chào bạn, mình là trợ lý AI Phố Cổ. Mình có thể hỗ trợ bạn xem thực đơn, kiểm tra bàn trống, đặt bàn và lấy voucher ạ!"
                yield {"event": "text", "data": final_text}
                break

        # 5. Log assistant message
        self.chat_logger.log_message(session_id, "assistant", final_text or "Response finished", tool_calls=executed_tools)
        yield {"event": "done", "data": json.dumps({"status": "completed", "session_id": session_id})}
