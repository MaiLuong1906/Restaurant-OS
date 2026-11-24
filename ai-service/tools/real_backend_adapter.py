import datetime
import json
import logging
import uuid
from typing import Dict, Any, List, Optional
import httpx
from config import get_settings

logger = logging.getLogger(__name__)

class RealBackendAdapter:
    """Triển khai BackendPort gọi trực tiếp REST API Spring Boot Backend thật."""

    def __init__(self, base_url: Optional[str] = None, client: Optional[httpx.Client] = None):
        settings = get_settings()
        self.base_url = (base_url or settings.backend_api_url).rstrip("/")
        self._client = client or httpx.Client(timeout=10.0)

        # Voucher ở lại dữ liệu SEED theo đúng quyết định §0 (Backend chưa có API voucher)
        # TODO: chuyển sang gọi API thật khi Backend có VoucherController
        self._vouchers = [
            {"code": "PHOCO10", "discount_vnd": 50000, "min_order_vnd": 200000, "expiry": "2026-12-31", "description": "Giảm 50.000 VND cho đơn từ 200.000 VND"},
            {"code": "WELCOME15", "discount_vnd": 70000, "min_order_vnd": 300000, "expiry": "2026-12-31", "description": "Ưu đãi thành viên mới giảm 70.000 VND"}
        ]
        self._redeemed: Dict[str, bool] = {}

    def _convert_to_utc_iso(self, date_str: str, time_str: str) -> str:
        """Quy đổi ngày và giờ Việt Nam (UTC+7) sang Instant ISO UTC string."""
        try:
            # Format time: HH:MM hoặc HH:MM:SS
            t_parts = time_str.strip().split(":")
            hour = int(t_parts[0])
            minute = int(t_parts[1]) if len(t_parts) > 1 else 0
            
            # Format date: YYYY-MM-DD
            d_parts = date_str.strip().split("-")
            year = int(d_parts[0])
            month = int(d_parts[1])
            day = int(d_parts[2])

            vn_tz = datetime.timezone(datetime.timedelta(hours=7))
            dt_vn = datetime.datetime(year, month, day, hour, minute, tzinfo=vn_tz)
            dt_utc = dt_vn.astimezone(datetime.timezone.utc)
            return dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            # Fallback nếu date/time không chuẩn format
            return f"{date_str}T{time_str}:00Z"

    def search_menu(self, query: str, diet_preference: Optional[str] = None, budget_max: Optional[int] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/dishes"
        try:
            resp = self._client.get(url)
            if resp.status_code != 200:
                logger.error(f"Failed to fetch dishes from BE: {resp.status_code} - {resp.text}")
                return {"is_mock": False, "status": "failed", "dishes": []}

            body = resp.json()
            raw_dishes = body.get("data", [])

            # Lọc theo món đang phục vụ (isAvailable=true)
            available_dishes = [d for d in raw_dishes if d.get("isAvailable", False)]

            q = query.lower()
            results = []
            for d in available_dishes:
                name = d.get("name", "").lower()
                desc = (d.get("description") or "").lower()
                category = (d.get("category") or "").lower()
                price = int(d.get("price", 0))

                # Lọc budget nếu có
                if budget_max and price > budget_max:
                    continue

                # Kiểm tra match
                match = (q in name) or (q in desc) or (q in category)
                if diet_preference and diet_preference.lower() in (name + " " + desc):
                    match = True
                if "chay" in q and ("chay" in name or "chay" in desc):
                    match = True
                
                # Tìm kiếm từng từ khóa món ăn phổ biến
                for kw in ["phở", "bún", "nem", "lẩu", "cà phê", "trà"]:
                    if kw in q and kw in name:
                        match = True

                if match:
                    results.append({
                        "dish_id": str(d.get("id")),
                        "name": d.get("name"),
                        "price": price,
                        "description": d.get("description") or "",
                        "imageUrl": d.get("imageUrl"),
                        "category": d.get("category"),
                        "available": True,
                    })

            # Nếu không tìm thấy kết quả khớp chính xác, trả về top 3 món đang phục vụ (vẫn tôn trọng budget_max nếu có)
            if not results and available_dishes:
                fallback = [d for d in available_dishes if not budget_max or int(d.get("price", 0)) <= budget_max]
                for d in fallback[:3]:
                    results.append({
                        "dish_id": str(d.get("id")),
                        "name": d.get("name"),
                        "price": int(d.get("price", 0)),
                        "description": d.get("description") or "",
                        "imageUrl": d.get("imageUrl"),
                        "category": d.get("category"),
                        "available": True,
                    })

            return {"is_mock": False, "status": "success", "dishes": results}
        except Exception as e:
            logger.error(f"Error calling search_menu on BE: {e}")
            return {"is_mock": False, "status": "failed", "dishes": []}

    def get_dish_availability(self, dish_name: Optional[str] = None, dish_id: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/dishes"
        try:
            resp = self._client.get(url)
            if resp.status_code != 200:
                return {"is_mock": False, "status": "failed", "items": []}

            raw_dishes = resp.json().get("data", [])
            items = []
            for d in raw_dishes:
                match = True
                if dish_name and dish_name.lower() not in d.get("name", "").lower():
                    match = False
                if dish_id and str(d.get("id")) != str(dish_id):
                    match = False
                if match:
                    items.append({
                        "dish_id": str(d.get("id")),
                        "name": d.get("name"),
                        "available": bool(d.get("isAvailable")),
                        "price": int(d.get("price", 0)),
                    })
            return {"is_mock": False, "status": "success", "items": items}
        except Exception as e:
            logger.error(f"Error calling get_dish_availability on BE: {e}")
            return {"is_mock": False, "status": "failed", "items": []}

    def check_table_availability(self, date: str, time: str, party_size: int, area_preference: Optional[str] = None) -> Dict[str, Any]:
        iso_time = self._convert_to_utc_iso(date, time)
        url = f"{self.base_url}/reservations/available-tables"
        params = {
            "time": iso_time,
            "guestCount": party_size,
        }
        try:
            resp = self._client.get(url, params=params)
            if resp.status_code != 200:
                logger.error(f"BE error checking available tables: {resp.status_code} - {resp.text}")
                return {"is_mock": False, "status": "failed", "available_tables": []}

            tables_data = resp.json().get("data", [])
            available_tables = []
            for t in tables_data:
                table_id = str(t.get("id"))
                t_num = t.get("tableNumber")
                z_name = t.get("zoneName") or "Sảnh chính"
                available_tables.append({
                    "table_id": table_id,
                    "name": f"{t_num} ({z_name})",
                    "capacity": int(t.get("capacity", 4)),
                    "area": z_name.lower(),
                })

            return {
                "is_mock": False,
                "status": "available" if available_tables else "fully_booked",
                "available_tables": available_tables,
                "query": {"date": date, "time": time, "party_size": party_size, "area_preference": area_preference}
            }
        except Exception as e:
            logger.error(f"Error checking table availability on BE: {e}")
            return {"is_mock": False, "status": "failed", "available_tables": []}

    def create_booking(self, name: str, phone: str, date: str, time: str, party_size: int, table_id: str, note: Optional[str] = None, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        # Nếu chưa có table_id hợp lệ, tra bàn trống và trả danh sách để khách chọn (không tự chọn bàn đầu tiên)
        if not table_id or table_id.startswith("TB-"):
            avail = self.check_table_availability(date, time, party_size)
            tables = avail.get("available_tables", [])
            if not tables:
                return {
                    "is_mock": False,
                    "status": "failed",
                    "message": "Rất tiếc vào khung giờ này nhà hàng không còn bàn trống phù hợp ạ."
                }
            return {
                "is_mock": False,
                "status": "needs_table_selection",
                "available_tables": tables,
                "message": f"Hiện có {len(tables)} bàn trống, bạn muốn chọn bàn nào?"
            }

        iso_time = self._convert_to_utc_iso(date, time)
        idemp = idempotency_key or str(uuid.uuid4())
        url = f"{self.base_url}/reservations"
        payload = {
            "tableId": table_id,
            "customerName": name,
            "customerPhone": phone,
            "guestCount": party_size,
            "reservationTime": iso_time,
            "depositAmount": 0, # Quyết định §0: cọc qua chat = 0 VND
            "notes": note or "",
        }
        headers = {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idemp,
        }

        try:
            resp = self._client.post(url, json=payload, headers=headers)
            if resp.status_code not in (200, 201):
                err_msg = resp.text
                try:
                    err_msg = resp.json().get("message", err_msg)
                except Exception:
                    pass
                logger.error(f"BE error creating reservation: {resp.status_code} - {err_msg}")
                return {
                    "is_mock": False,
                    "status": "failed",
                    "message": f"Đặt bàn không thành công: {err_msg}"
                }

            res_data = resp.json().get("data", {})
            res_id = str(res_data.get("id"))
            t_num = res_data.get("tableNumber") or "Bàn ăn"
            z_name = res_data.get("zoneName") or ""

            booking_info = {
                "booking_code": res_id, # Quyết định §0: mã đặt bàn = UUID thật, không sinh mã PC-
                "name": name,
                "phone_masked": f"{phone[:3]}****{phone[-3:]}" if len(phone) >= 7 else phone,
                "date": date,
                "time": time,
                "party_size": party_size,
                "table_id": f"{t_num} ({z_name})" if z_name else t_num,
                "note": note or "",
                "status": "CONFIRMED",
                "idempotency_key": idemp,
            }

            return {
                "is_mock": False,
                "status": "success",
                "message": "Đặt bàn thành công",
                "booking": booking_info
            }
        except Exception as e:
            logger.error(f"Exception calling create_booking on BE: {e}")
            return {
                "is_mock": False,
                "status": "failed",
                "message": "Hệ thống đặt bàn hiện đang bận, quý khách vui lòng thử lại sau giây lát."
            }

    def cancel_booking(self, booking_code: str, phone: str, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        clean_code = booking_code.strip()
        url = f"{self.base_url}/reservations/{clean_code}/cancel"
        payload = {"reason": "Khách hủy qua trợ lý AI", "cancelledBy": phone}
        headers = {"Content-Type": "application/json"}
        if idempotency_key:
            headers["X-Idempotency-Key"] = idempotency_key

        try:
            resp = self._client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                return {
                    "is_mock": False,
                    "status": "success",
                    "message": f"Hủy đặt bàn {clean_code} thành công",
                    "booking_code": clean_code
                }
            else:
                logger.warning(f"Cancel reservation {clean_code} returned {resp.status_code}")
                return {
                    "is_mock": False,
                    "status": "failed",
                    "message": f"Không thể hủy đặt bàn {clean_code}: {resp.text}"
                }
        except Exception as e:
            logger.error(f"Error cancelling booking on BE: {e}")
            return {
                "is_mock": False,
                "status": "failed",
                "message": f"Lỗi kết nối khi hủy đặt bàn {clean_code}"
            }

    def get_voucher(self, phone: Optional[str] = None, booking_code: Optional[str] = None) -> Dict[str, Any]:
        # Giữ nguyên logic SEED theo đúng quyết định §0 (Backend chưa có API voucher)
        return {
            "is_mock": True,
            "status": "success",
            "vouchers": self._vouchers,
            "phone_provided": bool(phone),
            "booking_code": booking_code
        }

    def redeem_voucher(self, voucher_code: str, booking_code: str, phone: Optional[str] = None, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        # Giữ nguyên logic SEED theo đúng quyết định §0 (Backend chưa có API voucher)
        v_upper = voucher_code.strip().upper()
        found = next((v for v in self._vouchers if v["code"] == v_upper), None)
        if not found:
            return {"is_mock": True, "status": "failed", "message": f"Mã voucher {voucher_code} không hợp lệ hoặc đã hết hạn"}
        
        redeem_key = f"{v_upper}_{booking_code}"
        if redeem_key in self._redeemed:
            return {"is_mock": True, "status": "failed", "message": f"Mã voucher {voucher_code} đã được sử dụng cho đặt bàn này"}
        
        self._redeemed[redeem_key] = True
        return {
            "is_mock": True,
            "status": "success",
            "message": f"Áp dụng thành công voucher {v_upper}",
            "discount_vnd": found["discount_vnd"],
            "booking_code": booking_code
        }
