TOOLS_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "check_table_availability",
            "description": "Kiểm tra bàn trống thực tế tại nhà hàng. BẮT BUỘC gọi trước khi xác nhận còn bàn với khách. Ví dụ 1: kiểm tra bàn 4 người lúc 19:00 ngày 2026-11-22. Ví dụ 2: kiểm tra bàn sân vườn cho 2 khách trưa mai.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Ngày đặt bàn định dạng YYYY-MM-DD"},
                    "time": {"type": "string", "description": "Giờ đặt bàn 24h định dạng HH:MM"},
                    "party_size": {"type": "integer", "description": "Số lượng người (khách)"},
                    "area_preference": {"type": "string", "description": "Khu vực ưu tiên: sân vườn, cửa sổ, yên tĩnh, phòng riêng"}
                },
                "required": ["date", "time", "party_size"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_booking",
            "description": "Tạo đơn đặt bàn mới. CHỈ gọi khi khách đã xác nhận đầy đủ tên, số điện thoại, ngày giờ và số người. Ví dụ 1: tạo đặt bàn cho anh An, 0901234567, bàn TB-01 lúc 19:00 ngày 2026-11-22. Ví dụ 2: đặt bàn TB-02 cho chị Mai 2 người.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Tên khách đặt bàn"},
                    "phone": {"type": "string", "description": "Số điện thoại liên hệ"},
                    "date": {"type": "string", "description": "Ngày đặt bàn (YYYY-MM-DD)"},
                    "time": {"type": "string", "description": "Giờ đặt bàn (HH:MM)"},
                    "party_size": {"type": "integer", "description": "Số lượng khách"},
                    "table_id": {"type": "string", "description": "Mã bàn chọn từ check_table_availability"},
                    "note": {"type": "string", "description": "Ghi chú thêm của khách"}
                },
                "required": ["name", "phone", "date", "time", "party_size", "table_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_voucher",
            "description": "Tra cứu các ưu đãi voucher hợp lệ. Gọi khi khách hỏi voucher hoặc kèm theo số điện thoại / mã đặt bàn. Ví dụ 1: tìm voucher cho số điện thoại 0901234567. Ví dụ 2: kiểm tra voucher áp dụng cho mã đặt bàn PC-123.",
            "parameters": {
                "type": "object",
                "properties": {
                    "phone": {"type": "string", "description": "Số điện thoại của khách"},
                    "booking_code": {"type": "string", "description": "Mã đặt bàn"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "redeem_voucher",
            "description": "Áp dụng mã voucher vào đơn đặt bàn cụ thể. Ví dụ 1: áp voucher PHOCO10 cho mã đặt bàn PC-ABC123. Ví dụ 2: áp voucher WELCOME15 cho mã PC-987654.",
            "parameters": {
                "type": "object",
                "properties": {
                    "voucher_code": {"type": "string", "description": "Mã voucher"},
                    "booking_code": {"type": "string", "description": "Mã đặt bàn"},
                    "phone": {"type": "string", "description": "Số điện thoại khách"}
                },
                "required": ["voucher_code", "booking_code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_booking",
            "description": "Hủy đơn đặt bàn theo mã đặt bàn và số điện thoại. Ví dụ 1: hủy bàn PC-ABC123 cho SĐT 0901234567. Ví dụ 2: hủy đặt bàn tối nay mã PC-888.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_code": {"type": "string", "description": "Mã đơn đặt bàn cần hủy"},
                    "phone": {"type": "string", "description": "Số điện thoại xác nhận người đặt"}
                },
                "required": ["booking_code", "phone"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_menu",
            "description": "Tìm kiếm thực đơn món ăn theo tên, khẩu vị, ăn chay, ngân sách hoặc dị ứng. Ví dụ 1: tìm món chay thanh đạm. Ví dụ 2: tìm món phở hoặc bún chả.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Từ khóa tìm kiếm hoặc tên món"},
                    "diet_preference": {"type": "string", "description": "Chế độ ăn: chay, ít dầu mỡ, kiêng đường"},
                    "budget_max": {"type": "integer", "description": "Ngân sách tối đa tính bằng VND"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_dish_availability",
            "description": "Kiểm tra tình trạng còn món hay hết món trong kho bếp. Ví dụ 1: kiểm tra xem Lẩu Cua Đồng còn phục vụ không. Ví dụ 2: kiểm tra tình trạng món Nem Rán Phố Cổ.",
            "parameters": {
                "type": "object",
                "properties": {
                    "dish_name": {"type": "string", "description": "Tên món ăn cần kiểm tra"},
                    "dish_id": {"type": "string", "description": "Mã định danh món ăn"}
                }
            }
        }
    }
]
