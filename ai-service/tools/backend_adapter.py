from typing import Protocol, Dict, Any, List, Optional
import json
import os
import uuid

class BackendPort(Protocol):
    def check_table_availability(self, date: str, time: str, party_size: int, area_preference: Optional[str] = None) -> Dict[str, Any]:
        ...
    def create_booking(self, name: str, phone: str, date: str, time: str, party_size: int, table_id: str, note: Optional[str] = None, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        ...
    def get_voucher(self, phone: Optional[str] = None, booking_code: Optional[str] = None) -> Dict[str, Any]:
        ...
    def redeem_voucher(self, voucher_code: str, booking_code: str, phone: Optional[str] = None, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        ...
    def cancel_booking(self, booking_code: str, phone: str, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        ...
    def search_menu(self, query: str, diet_preference: Optional[str] = None, budget_max: Optional[int] = None) -> Dict[str, Any]:
        ...
    def get_dish_availability(self, dish_name: Optional[str] = None, dish_id: Optional[str] = None) -> Dict[str, Any]:
        ...

class MockBackendAdapter:
    """Mock implementation of BackendPort with idempotency and realistic sample responses."""
    def __init__(self, data_dir: Optional[str] = None):
        self._data_dir = data_dir or os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        self._bookings: Dict[str, Dict[str, Any]] = {}
        self._session_bookings: Dict[str, str] = {}
        self._vouchers = [
            {"code": "PHOCO10", "discount_vnd": 50000, "min_order_vnd": 200000, "expiry": "2026-12-31", "description": "Giảm 50.000 VND cho đơn từ 200.000 VND"},
            {"code": "WELCOME15", "discount_vnd": 70000, "min_order_vnd": 300000, "expiry": "2026-12-31", "description": "Ưu đãi thành viên mới giảm 70.000 VND"}
        ]
        self._redeemed: Dict[str, bool] = {}

    def _get_dishes_data(self) -> List[Dict[str, Any]]:
        file_path = os.path.join(self._data_dir, "dish_availability.json")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def check_table_availability(self, date: str, time: str, party_size: int, area_preference: Optional[str] = None) -> Dict[str, Any]:
        area = area_preference.lower() if area_preference else "trong nhà"
        return {
            "is_mock": True,
            "status": "available",
            "available_tables": [
                {"table_id": "TB-01", "name": "Bàn 1 (Sân vườn)", "capacity": 4, "area": "sân vườn"},
                {"table_id": "TB-02", "name": "Bàn 2 (Gần cửa sổ)", "capacity": 6, "area": "cửa sổ"},
                {"table_id": "TB-03", "name": "Bàn 3 (Yên tĩnh)", "capacity": party_size if party_size > 4 else 4, "area": area}
            ],
            "query": {"date": date, "time": time, "party_size": party_size, "area_preference": area}
        }

    def create_booking(self, name: str, phone: str, date: str, time: str, party_size: int, table_id: str, note: Optional[str] = None, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        # Deduplication check by (phone, date, time)
        dedup_key = f"{phone}_{date}_{time}"
        if dedup_key in self._bookings:
            return {
                "is_mock": True,
                "status": "success",
                "message": "Đơn đặt bàn đã tồn tại trước đó",
                "booking": self._bookings[dedup_key]
            }

        booking_code = f"PC-{uuid.uuid4().hex[:6].upper()}"
        booking_data = {
            "booking_code": booking_code,
            "name": name,
            "phone_masked": f"{phone[:3]}****{phone[-3:]}" if len(phone) >= 7 else phone,
            "date": date,
            "time": time,
            "party_size": party_size,
            "table_id": table_id,
            "note": note or "",
            "status": "CONFIRMED",
            "idempotency_key": idempotency_key or str(uuid.uuid4())
        }
        self._bookings[dedup_key] = booking_data
        self._bookings[booking_code] = booking_data
        return {
            "is_mock": True,
            "status": "success",
            "message": "Đặt bàn thành công",
            "booking": booking_data
        }

    def get_voucher(self, phone: Optional[str] = None, booking_code: Optional[str] = None) -> Dict[str, Any]:
        return {
            "is_mock": True,
            "status": "success",
            "vouchers": self._vouchers,
            "phone_provided": bool(phone),
            "booking_code": booking_code
        }

    def redeem_voucher(self, voucher_code: str, booking_code: str, phone: Optional[str] = None, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
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

    def cancel_booking(self, booking_code: str, phone: str, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        code_upper = booking_code.strip().upper()
        if code_upper in self._bookings:
            b = self._bookings[code_upper]
            b["status"] = "CANCELLED"
            return {"is_mock": True, "status": "success", "message": f"Hủy đặt bàn {code_upper} thành công", "booking_code": code_upper}
        return {"is_mock": True, "status": "success", "message": f"Đã ghi nhận yêu cầu hủy đặt bàn {code_upper}", "booking_code": code_upper}

    def search_menu(self, query: str, diet_preference: Optional[str] = None, budget_max: Optional[int] = None) -> Dict[str, Any]:
        dishes = self._get_dishes_data()
        q = query.lower()
        results = []
        for d in dishes:
            match = (q in d["name"].lower()) or (diet_preference and diet_preference.lower() in d["name"].lower())
            if "chay" in q and "chay" in d["name"].lower():
                match = True
            if match:
                results.append(d)
        if not results:
            results = dishes[:3]
        return {"is_mock": False, "status": "success", "dishes": results}

    def get_dish_availability(self, dish_name: Optional[str] = None, dish_id: Optional[str] = None) -> Dict[str, Any]:
        dishes = self._get_dishes_data()
        if dish_name:
            q = dish_name.lower()
            matched = [d for d in dishes if q in d["name"].lower()]
            return {"is_mock": False, "status": "success", "items": matched}
        if dish_id:
            matched = [d for d in dishes if d["dish_id"] == dish_id]
            return {"is_mock": False, "status": "success", "items": matched}
        return {"is_mock": False, "status": "success", "items": dishes}
