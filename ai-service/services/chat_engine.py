from typing import Iterator, Dict, Any, List, Optional
import json
import os
import uuid
import re
from tools.schemas import TOOLS_DEFINITIONS
from tools.executor import ToolExecutor
from services.retriever import KnowledgeRetriever
from services.logger import ChatLogger

class ChatEngine:
    def __init__(self, llm_provider=None, tool_executor: Optional[ToolExecutor] = None, retriever: Optional[KnowledgeRetriever] = None, chat_logger: Optional[ChatLogger] = None):
        self.llm_provider = llm_provider
        self.tool_executor = tool_executor or ToolExecutor()
        self.retriever = retriever or KnowledgeRetriever()
        self.chat_logger = chat_logger or ChatLogger()
        self.system_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts", "system_vi.md")
        if os.path.exists(prompt_path):
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        return "Bạn là trợ lý ảo nhà hàng Phố Cổ."

    def _simulate_tool_decision(self, message: str) -> Optional[Dict[str, Any]]:
        msg = message.lower()
        if "đặt bàn" in msg or "dat ban" in msg or "bàn" in msg:
            # Check availability or create booking
            # Try to extract party
            party = 2
            party_match = re.search(r'(\d+)\s*(người|ng|khách)', msg)
            if party_match:
                party = int(party_match.group(1))
            
            # Check if name + phone present
            phone_match = re.search(r'0\d{8,10}', msg)
            if phone_match and "tên" in msg:
                phone = phone_match.group(0)
                name_match = re.search(r'tên\s+([A-Za-zÀ-ỹ\s]+?)(?:,|$|\d)', message)
                name = name_match.group(1).strip() if name_match else "Khách hàng"
                return {
                    "name": "create_booking",
                    "arguments": {
                        "name": name,
                        "phone": phone,
                        "date": "2026-11-22",
                        "time": "19:00",
                        "party_size": party,
                        "table_id": "TB-01"
                    }
                }
            return {
                "name": "check_table_availability",
                "arguments": {
                    "date": "2026-11-22",
                    "time": "19:00",
                    "party_size": party,
                    "area_preference": "sân vườn" if "sân vườn" in msg else ("thoáng" if "thoáng" in msg else "cửa sổ")
                }
            }
        elif "voucher" in msg or "khuyến mãi" in msg or "giảm giá" in msg:
            phone_match = re.search(r'0\d{8,10}', msg)
            phone = phone_match.group(0) if phone_match else None
            return {
                "name": "get_voucher",
                "arguments": {"phone": phone}
            }
        elif "hủy" in msg and "bàn" in msg:
            code_match = re.search(r'PC-[A-Z0-9]+', message)
            phone_match = re.search(r'0\d{8,10}', msg)
            return {
                "name": "cancel_booking",
                "arguments": {
                    "booking_code": code_match.group(0) if code_match else "PC-DEMO",
                    "phone": phone_match.group(0) if phone_match else "0901234567"
                }
            }
        elif "chay" in msg or "thực đơn" in msg or "món" in msg:
            return {
                "name": "search_menu",
                "arguments": {"query": message, "diet_preference": "chay" if "chay" in msg else None}
            }
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

        # Check tool execution (simulation or live LLM)
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
                    yield {"event": "booking_card", "data": json.dumps(booking, ensure_ascii=False)}
                    yield {"event": "text", "data": f"Nhà hàng Phố Cổ đã xác nhận giữ bàn thành công! Mã đặt bàn của bạn là {booking.get('booking_code')}."}
                    break
                elif tool_name == "check_table_availability":
                    tables = tool_result.get("available_tables", [])
                    yield {"event": "text", "data": f"Hiện tại quán còn {len(tables)} bàn trống phù hợp cho bạn. Bạn có muốn giữ bàn không ạ? Vui lòng cho mình xin tên và số điện thoại nhé."}
                    break
                elif tool_name == "get_voucher":
                    vouchers = tool_result.get("vouchers", [])
                    for v in vouchers:
                        yield {"event": "voucher_card", "data": json.dumps(v, ensure_ascii=False)}
                    yield {"event": "text", "data": "Dạ đây là các ưu đãi voucher hiện có của quán dành cho bạn ạ!"}
                    break
                elif tool_name == "search_menu":
                    dishes = tool_result.get("dishes", [])
                    for d in dishes:
                        yield {"event": "dish_card", "data": json.dumps(d, ensure_ascii=False)}
                    yield {"event": "text", "data": f"Quán gửi bạn danh sách món ăn tham khảo ạ!"}
                    break
                elif tool_name == "cancel_booking":
                    yield {"event": "text", "data": f"Đã ghi nhận yêu cầu hủy đặt bàn {args.get('booking_code')}. Bàn đã được hoàn lại vào hệ thống ạ."}
                    break
            else:
                if knowledge_context:
                    yield {"event": "text", "data": f"Dạ quán xin thông tin tới bạn:\n{chunks[0]['chunk_text']}"}
                else:
                    yield {"event": "text", "data": "Chào bạn, mình là trợ lý AI Phố Cổ. Mình có thể hỗ trợ bạn xem thực đơn, kiểm tra bàn trống, đặt bàn và lấy voucher ạ!"}
                break

        # Log assistant message
        self.chat_logger.log_message(session_id, "assistant", "Response finished", tool_calls=executed_tools)
        yield {"event": "done", "data": json.dumps({"status": "completed", "session_id": session_id})}
