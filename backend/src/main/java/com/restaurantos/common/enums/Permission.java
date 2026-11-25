package com.restaurantos.common.enums;

import lombok.Getter;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

/**
 * Danh mục Quyền nguyên tử (Permission Catalog) cho hệ thống RBAC Restaurant-OS.
 * Quy ước đặt tên authority: <MODULE>:<RESOURCE>:<ACTION>
 * Phân tách rõ: VIEW, CREATE, UPDATE, DELETE, EXECUTE, REQUEST, APPROVE.
 *
 * Lưu ý: Customer là tác nhân bên ngoài, xác thực theo qr_code_token của bàn ăn,
 * không nằm trong danh mục quyền nhân sự nội bộ này.
 */
@Getter
public enum Permission {

    // =========================================================================
    // 1. AUTH & SESSION
    // =========================================================================
    AUTH_STAFF_PORTAL_EXECUTE("AUTH:STAFF_PORTAL:EXECUTE", "Đăng nhập cổng nhân sự bằng tài khoản & mật khẩu (JWT)"),
    AUTH_KDS_PIN_EXECUTE("AUTH:KDS_PIN:EXECUTE", "Đăng nhập trạm bếp KDS bằng mã PIN"),
    AUTH_MANAGER_PIN_APPROVE("AUTH:MANAGER_PIN:APPROVE", "Xác thực mã PIN Quản lý/Chủ quán để phê duyệt ngoại lệ"),

    // =========================================================================
    // 2. USER & RBAC MANAGEMENT
    // =========================================================================
    USER_ACCOUNT_VIEW("USER:ACCOUNT:VIEW", "Xem danh sách và chi tiết tài khoản nhân sự"),
    USER_ACCOUNT_CREATE("USER:ACCOUNT:CREATE", "Cấp tài khoản nhân sự mới"),
    USER_ACCOUNT_UPDATE("USER:ACCOUNT:UPDATE", "Chỉnh sửa hồ sơ và đổi vai trò nhân sự"),
    USER_STATUS_UPDATE("USER:STATUS:UPDATE", "Khóa hoặc mở khóa trạng thái tài khoản nhân sự"),
    USER_PIN_UPDATE("USER:PIN:UPDATE", "Cấp mới hoặc đặt lại mã PIN trạm cho nhân sự"),
    USER_ACCOUNT_DELETE("USER:ACCOUNT:DELETE", "Xóa mềm tài khoản nhân sự (chỉ OWNER)"),
    USER_RBAC_MATRIX_VIEW("USER:RBAC_MATRIX:VIEW", "Xem ma trận phân quyền RBAC và hạn mức chiết khấu"),

    // =========================================================================
    // 3. TABLE, FLOOR PLAN & RESERVATION
    // =========================================================================
    TABLE_FLOOR_PLAN_VIEW("TABLE:FLOOR_PLAN:VIEW", "Xem sơ đồ bàn, phân khu và trạng thái bàn"),
    TABLE_FLOOR_LAYOUT_UPDATE("TABLE:FLOOR_LAYOUT:UPDATE", "Thiết kế và cấu hình sơ đồ bàn 2.5D"),
    TABLE_STATE_UPDATE("TABLE:STATE:UPDATE", "Chuyển bàn, gộp bàn, cập nhật trạng thái bàn"),
    TABLE_RESERVATION_VIEW("TABLE:RESERVATION:VIEW", "Xem danh sách và chi tiết đặt bàn trước"),
    TABLE_RESERVATION_CREATE("TABLE:RESERVATION:CREATE", "Tạo đơn đặt bàn trước và thu cọc"),
    TABLE_RESERVATION_UPDATE("TABLE:RESERVATION:UPDATE", "Cập nhật, check-in, hủy hoặc đánh dấu no-show đơn đặt bàn"),

    // =========================================================================
    // 4. MENU, PORTIONS & BOM
    // =========================================================================
    MENU_CATALOG_VIEW("MENU:CATALOG:VIEW", "Xem danh mục thực đơn và chi tiết món ăn"),
    MENU_CATALOG_CREATE_UPDATE("MENU:CATALOG:CREATE_UPDATE", "Tạo, cập nhật, xóa món ăn và cấu hình giá/combo"),
    MENU_BOM_RECIPE_VIEW("MENU:BOM_RECIPE:VIEW", "Xem công thức định lượng BOM của món ăn"),
    MENU_BOM_RECIPE_UPDATE("MENU:BOM_RECIPE:UPDATE", "Thiết lập và chỉnh sửa định lượng BOM, ngưỡng tồn kho"),
    MENU_AVAILABILITY_UPDATE("MENU:AVAILABILITY:UPDATE", "Bật/tắt nhanh trạng thái còn món / hết món (Sold Out)"),

    // =========================================================================
    // 5. ORDER & WAITER OPERATIONS
    // =========================================================================
    ORDER_ACTIVE_VIEW("ORDER:ACTIVE:VIEW", "Xem danh sách đơn đang phục vụ và chi tiết đơn"),
    ORDER_CREATE_APPEND_EXECUTE("ORDER:CREATE_APPEND:EXECUTE", "Mở đơn mới hoặc gọi thêm món vào đơn đang phục vụ"),
    ORDER_ITEM_SERVE_EXPEDITE_UPDATE("ORDER:ITEM_SERVE_EXPEDITE:UPDATE", "Cập nhật món đã ra bàn (SERVED) hoặc hối bếp (expedite)"),
    ORDER_VOID_ITEM_REQUEST("ORDER:VOID_ITEM:REQUEST", "Gửi yêu cầu hủy món sau khi đã gửi bếp"),
    ORDER_VOID_ITEM_APPROVE("ORDER:VOID_ITEM:APPROVE", "Phê duyệt hủy món sau chế biến"),

    // =========================================================================
    // 6. KITCHEN DISPLAY SYSTEM (KDS)
    // =========================================================================
    KDS_QUEUE_VIEW("KDS:QUEUE:VIEW", "Xem hàng đợi ticket bếp, món active và cảnh báo SLA"),
    KDS_COOKING_STATUS_UPDATE("KDS:COOKING_STATUS:UPDATE", "Hoàn tất ticket hoặc cập nhật trạng thái chế biến món trên KDS"),
    KDS_WASTAGE_CREATE("KDS:WASTAGE:CREATE", "Lập biên bản ghi nhận hao hụt/nấu hỏng tại bếp"),
    KDS_WASTAGE_APPROVE("KDS:WASTAGE:APPROVE", "Phê duyệt biên bản hao hụt bếp để hạch toán P&L"),

    // =========================================================================
    // 7. POS, BILLING & CASH SHIFTS
    // =========================================================================
    POS_BILL_VIEW("POS:BILL:VIEW", "Xem danh sách hóa đơn và lịch sử thanh toán"),
    POS_BILL_SPLIT_MERGE_EXECUTE("POS:BILL_SPLIT_MERGE:EXECUTE", "Tách hoặc gộp hóa đơn thanh toán"),
    POS_SETTLEMENT_EXECUTE("POS:SETTLEMENT:EXECUTE", "Khóa bàn, thanh toán tại quầy, mở két và in hóa đơn"),
    POS_DISCOUNT_SELF_EXECUTE("POS:DISCOUNT_SELF:EXECUTE", "Áp dụng chiết khấu trong trần cho phép của Role"),
    POS_DISCOUNT_OVERRIDE_APPROVE("POS:DISCOUNT_OVERRIDE:APPROVE", "Phê duyệt chiết khấu đặc biệt vượt trần Thu ngân"),
    POS_BILL_REFUND_VOID_APPROVE("POS:BILL_REFUND_VOID:APPROVE", "Phê duyệt hủy hóa đơn hoặc hoàn tiền hóa đơn đã đóng"),
    POS_CASH_SHIFT_EXECUTE("POS:CASH_SHIFT:EXECUTE", "Mở ca thu ngân và khai báo kiểm đếm tiền mặt cuối ca"),
    POS_CASH_SHIFT_APPROVE("POS:CASH_SHIFT:APPROVE", "Kiểm toán két tiền và ký duyệt đóng ca thu ngân"),
    POS_PETTY_CASH_APPROVE("POS:PETTY_CASH:APPROVE", "Phê duyệt xuất quỹ tiền mặt khẩn cấp tại két"),

    // =========================================================================
    // 8. INVENTORY, PREP/PRODUCTION & PO
    // =========================================================================
    INVENTORY_STOCK_VIEW("INVENTORY:STOCK:VIEW", "Xem tồn kho nguyên liệu và số phần ăn khả dụng"),
    INVENTORY_PREP_PRODUCTION_EXECUTE("INVENTORY:PREP_PRODUCTION:EXECUTE", "Ghi nhận mẻ sơ chế và lệnh sản xuất bếp"),
    INVENTORY_PO_CREATE_APPROVE("INVENTORY:PO:CREATE_APPROVE", "Tạo và phê duyệt đơn mua hàng nhà cung cấp (PO)"),
    INVENTORY_PO_INBOUND_APPROVE("INVENTORY:PO_INBOUND:APPROVE", "Kiểm định chất lượng và ký nhận hàng PO nhập kho"),
    INVENTORY_STOCK_AUDIT_EXECUTE("INVENTORY:STOCK_AUDIT:EXECUTE", "Thực hiện cân đếm kiểm kê kho định kỳ/cuối ca"),
    INVENTORY_STOCK_AUDIT_APPROVE("INVENTORY:STOCK_AUDIT:APPROVE", "Phê duyệt phiên kiểm kê kho điều chỉnh sổ cái"),

    // =========================================================================
    // 9. STAFF PORTAL, SCHEDULE & HR
    // =========================================================================
    HR_SCHEDULE_OPEN_VIEW("HR:SCHEDULE_OPEN:VIEW", "Xem lịch cá nhân và danh sách ca mở"),
    HR_SHIFT_REGISTER_EXECUTE("HR:SHIFT_REGISTER:EXECUTE", "Đăng ký nhận ca mở và tự hủy đăng ký của chính mình"),
    HR_SHIFT_SWAP_LEAVE_REQUEST("HR:SHIFT_SWAP_LEAVE:REQUEST", "Gửi yêu cầu đổi ca nội bộ hoặc đơn xin nghỉ phép"),
    HR_ROSTER_SHIFT_CREATE_APPROVE("HR:ROSTER_SHIFT:CREATE_APPROVE", "Đăng ca mở, xếp lịch tuần, hủy/duyệt ca và nghỉ phép"),
    HR_PAYSLIP_SELF_VIEW("HR:PAYSLIP_SELF:VIEW", "Xem phiếu lương và tiền tip cá nhân của chính mình"),
    HR_PAYROLL_TIP_POOL_APPROVE("HR:PAYROLL_TIP_POOL:APPROVE", "Tính lương toàn quán và phê duyệt phân bổ quỹ tip"),

    // =========================================================================
    // 10. REPORTS, FINANCE, SYSTEM & AI
    // =========================================================================
    REPORT_OPERATIONS_KPI_VIEW("REPORT:OPERATIONS_KPI:VIEW", "Xem Dashboard KPI vận hành ca và cảnh báo SLA"),
    REPORT_FINANCE_PNL_BCG_VIEW("REPORT:FINANCE_PNL_BCG:VIEW", "Xem báo cáo doanh thu, lãi lỗ P&L, COGS và ma trận BCG"),
    SYS_STORE_PROFILE_LAN_UPDATE("SYS:STORE_PROFILE_LAN:UPDATE", "Cấu hình hồ sơ nhà hàng, VietQR, VAT và thiết bị LAN"),
    AI_VOICE_FORECAST_SENTIMENT_EXECUTE("AI:VOICE_FORECAST_SENTIMENT:EXECUTE", "Sử dụng tính năng AI dự báo, xếp lịch AI và xử lý phản hồi");

    /**
     * Nhóm quyền nền tảng dùng chung cho tất cả 6 Role nội bộ (Staff Portal Self-Service).
     * Thay thế cho cơ chế kế thừa RoleHierarchy để không gây cấp quyền dư thừa ngoài ý muốn.
     */
    public static final Set<Permission> COMMON_STAFF_PERMISSIONS = Collections.unmodifiableSet(
            EnumSet.of(
                    AUTH_STAFF_PORTAL_EXECUTE,
                    MENU_CATALOG_VIEW,
                    HR_SCHEDULE_OPEN_VIEW,
                    HR_SHIFT_REGISTER_EXECUTE,
                    HR_SHIFT_SWAP_LEAVE_REQUEST,
                    HR_PAYSLIP_SELF_VIEW
            )
    );

    private final String authority;
    private final String description;

    Permission(String authority, String description) {
        this.authority = authority;
        this.description = description;
    }

    public static Optional<Permission> fromAuthority(String authority) {
        if (authority == null || authority.isBlank()) {
            return Optional.empty();
        }
        String trimmed = authority.trim();
        return Arrays.stream(values())
                .filter(p -> p.authority.equalsIgnoreCase(trimmed) || p.name().equalsIgnoreCase(trimmed))
                .findFirst();
    }
}
