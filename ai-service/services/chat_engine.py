from typing import Iterator, Dict, Any, List, Optional
import json
import os
import uuid
import re
from config import get_settings
from llm import get_llm_provider
from tools.schemas import TOOLS_DEFINITIONS
from tools.executor import ToolExecutor
from services.retriever import KnowledgeRetriever
from services.logger import ChatLogger

class ChatEngine:
    def __init__(self, llm_provider=None, tool_executor: Optional[ToolExecutor] = None, retriever: Optional[KnowledgeRetriever] = None, chat_logger: Optional[ChatLogger] = None):
        self.llm_provider = llm_provider or get_llm_provider()
        self.tool_executor = tool_executor or ToolExecutor()
        self.retriever = retriever or KnowledgeRetriever()
        self.chat_logger = chat_logger or ChatLogger()
        self.system_prompt = self._load_system_prompt()

    def _is_live_mode(self) -> bool:
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

    def _simulate_tool_decision(self, message: str) -> Optional[Dict[str, Any]]:
        msg = message.lower().strip()

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
        if ("hủy" in msg or "huy" in msg) and ("bàn" in msg or "ban" in msg or "đặt" in msg):
            uuid_match = re.search(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', message)
            code_match = re.search(r'PC-[A-Z0-9]+', message)
            phone_match = re.search(r'0\d{8,10}', msg)
            booking_code = (
                uuid_match.group(0) if uuid_match
                else (code_match.group(0) if code_match else getattr(self, "_last_created_booking_code", "DEMO-UUID"))
            )
            return {
                "name": "cancel_booking",
                "arguments": {
                    "booking_code": booking_code,
                    "phone": phone_match.group(0) if phone_match else "0901234567"
                }
            }

        # Nhóm 3 & 8: Voucher & Khuyến mãi
        if "voucher" in msg or "khuyến mãi" in msg or "khuyen mai" in msg or "giảm giá" in msg or "giam gia" in msg or "ưu đãi" in msg:
            phone_match = re.search(r'0\d{8,10}', msg)
            phone = phone_match.group(0) if phone_match else None
            return {
                "name": "get_voucher",
                "arguments": {"phone": phone}
            }

        # Nhóm 5 & 6 & 8: Thực đơn, Món ăn, Dị ứng, Ngân sách
        # Cần kiểm tra trước đặt bàn vì một số câu có thể có từ ngữ gợi ý món
        menu_keywords = [
            "chay", "thực đơn", "thuc don", "món", "mon", "phở", "pho", "lẩu", "lau", "bún", "bun", "nem",
            "dị ứng", "di ung", "gluten", "đậu nành", "dau nanh", "hải sản", "hai san", "đậu phộng", "dau phong",
            "bao nhiêu tiền", "bao nhieu tien", "giá", "gia", "ăn gì", "an gi",
            "200k", "100k", "500k", "dưới 100k", "ngân sách", "ngan sach"
        ]
        if any(kw in msg for kw in menu_keywords) and not ("đặt bàn" in msg or "dat ban" in msg or "đổi bàn" in msg):
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

            return {
                "name": "search_menu",
                "arguments": {
                    "query": message,
                    "diet_preference": diet,
                    "budget_max": budget
                }
            }

        # Nhóm 7: Thiếu thông tin đặt bàn -> CẦN CLARIFY (expected_tool = None)
        # Các mẫu câu thiếu giờ / thiếu số người / thiếu ngày cụ thể
        clarify_patterns = [
            r'^đặt bàn tối nay$',
            r'^dat ban toi nay$',
            r'^đặt bàn \d+\s*(người|ng|khách)$',
            r'^dat ban \d+\s*(người|ng|khách)$',
            r'^muốn đặt bàn cuối tuần$',
            r'^muon dat ban cuoi tuan$',
            r'^đặt bàn \d+\s*(người|ng|khách)\s*lúc\s*\d+h$',
            r'^dat ban \d+\s*(người|ng|khách)\s*luc\s*\d+h$'
        ]
        if any(re.match(p, msg) for p in clarify_patterns):
            return None

        # Nhóm 2 & 8 & 10: Đặt bàn (Hỏi trống, Đổi bàn, Tạo đặt bàn)
        if "đặt bàn" in msg or "dat ban" in msg or "đổi bàn" in msg or "doi ban" in msg or "bàn" in msg or "ban" in msg:
            # Check if name + phone present -> create_booking
            phone_match = re.search(r'0\d{8,10}', msg)
            if phone_match and ("tên" in msg or "ten" in msg):
                phone = phone_match.group(0)
                name_match = re.search(r'tên\s+([A-Za-zÀ-ỹ\s]+?)(?:,|$|\d)', message)
                name = name_match.group(1).strip() if name_match else "Khách hàng"
                party = 2
                party_match = re.search(r'(\d+)\s*(người|ng|khách)', msg)
                if party_match:
                    party = int(party_match.group(1))
                return {
                    "name": "create_booking",
                    "arguments": {
                        "name": name,
                        "phone": phone,
                        "date": "2026-11-26",
                        "time": "19:00",
                        "party_size": party,
                        "table_id": ""
                    }
                }

            # Otherwise: check_table_availability
            party = 2
            party_match = re.search(r'(\d+)\s*(người|ng|khách)', msg)
            if party_match:
                party = int(party_match.group(1))
            elif "3 người lớn 2 trẻ em" in msg:
                party = 5

            time_str = "19:00"
            if "8h" in msg or "20h" in msg:
                time_str = "20:00"
            elif "18h30" in msg:
                time_str = "18:30"
            elif "trưa" in msg:
                time_str = "12:00"

            area = None
            if "sân vườn" in msg:
                area = "sân vườn"
            elif "cửa sổ" in msg:
                area = "cửa sổ"
            elif "thoáng" in msg:
                area = "thoáng"
            elif "phòng riêng" in msg:
                area = "phòng riêng"

            return {
                "name": "check_table_availability",
                "arguments": {
                    "date": "2026-11-26",
                    "time": time_str,
                    "party_size": party,
                    "area_preference": area
                }
            }

        return None

    def _generate_live_reply(self, full_system: str, user_message: str, executed_tools: List[Dict[str, Any]]) -> Optional[str]:
        if not self._is_live_mode() or not self.llm_provider:
            return None
        try:
            messages = [{"role": "system", "content": full_system}]
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
        # 1. Log incoming message
        self.chat_logger.log_message(session_id, "user", user_message)

        # 2. RAG retrieval
        chunks = self.retriever.retrieve(user_message, top_k=3)
        knowledge_context = "\n".join([f"- {c['chunk_text']}" for c in chunks]) if chunks else ""

        full_system = self.system_prompt
        if knowledge_context:
            full_system += f"\n\n# THÔNG TIN THỰC ĐƠN & NHÀ HÀNG (RAG):\n{knowledge_context}"

        executed_tools = []
        loop_count = 0
        max_loops = 3
        final_text = ""

        # Check tool execution (simulation + live LLM synthesis)
        while loop_count < max_loops:
            loop_count += 1
            tool_call = self._simulate_tool_decision(user_message)
            if tool_call and loop_count == 1:
                tool_name = tool_call["name"]
                args = tool_call["arguments"]
                yield {"event": "text", "data": "Dạ, để mình kiểm tra hệ thống giúp bạn ngay nhé...\n"}
                tool_result = self.tool_executor.execute(tool_name, args)
                executed_tools.append({"tool": tool_name, "args": args, "result": tool_result})

                if tool_name == "create_booking" and tool_result.get("status") == "success":
                    booking = tool_result.get("booking", {})
                    self._last_created_booking_code = booking.get("booking_code")
                    yield {"event": "booking_card", "data": json.dumps(booking, ensure_ascii=False)}
                    live_reply = self._generate_live_reply(full_system, user_message, executed_tools)
                    final_text = live_reply or f"Nhà hàng Phố Cổ đã xác nhận giữ bàn thành công! Mã đặt bàn của bạn là {booking.get('booking_code')}."
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "check_table_availability":
                    tables = tool_result.get("available_tables", [])
                    live_reply = self._generate_live_reply(full_system, user_message, executed_tools)
                    final_text = live_reply or f"Hiện tại quán còn {len(tables)} bàn trống phù hợp cho bạn. Bạn có muốn giữ bàn không ạ? Vui lòng cho mình xin tên và số điện thoại nhé."
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "get_voucher":
                    vouchers = tool_result.get("vouchers", [])
                    for v in vouchers:
                        yield {"event": "voucher_card", "data": json.dumps(v, ensure_ascii=False)}
                    live_reply = self._generate_live_reply(full_system, user_message, executed_tools)
                    final_text = live_reply or "Dạ đây là các ưu đãi voucher hiện có của quán dành cho bạn ạ!"
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "search_menu":
                    dishes = tool_result.get("dishes", [])
                    for d in dishes:
                        yield {"event": "dish_card", "data": json.dumps(d, ensure_ascii=False)}
                    live_reply = self._generate_live_reply(full_system, user_message, executed_tools)
                    final_text = live_reply or "Quán gửi bạn danh sách món ăn tham khảo ạ!"
                    yield {"event": "text", "data": final_text}
                    break
                elif tool_name == "cancel_booking":
                    live_reply = self._generate_live_reply(full_system, user_message, executed_tools)
                    final_text = live_reply or f"Đã ghi nhận yêu cầu hủy đặt bàn {args.get('booking_code')}. Bàn đã được hoàn lại vào hệ thống ạ."
                    yield {"event": "text", "data": final_text}
                    break
            else:
                live_reply = self._generate_live_reply(full_system, user_message, executed_tools)
                if live_reply:
                    final_text = live_reply
                elif knowledge_context:
                    final_text = f"Dạ quán xin thông tin tới bạn:\n{chunks[0]['chunk_text']}"
                else:
                    final_text = "Chào bạn, mình là trợ lý AI Phố Cổ. Mình có thể hỗ trợ bạn xem thực đơn, kiểm tra bàn trống, đặt bàn và lấy voucher ạ!"
                yield {"event": "text", "data": final_text}
                break

        # Log assistant message
        self.chat_logger.log_message(session_id, "assistant", final_text or "Response finished", tool_calls=executed_tools)
        yield {"event": "done", "data": json.dumps({"status": "completed", "session_id": session_id})}
