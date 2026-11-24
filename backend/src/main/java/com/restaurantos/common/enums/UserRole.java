package com.restaurantos.common.enums;

import lombok.Getter;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

/**
 * 6 Role nội bộ cố định khớp với constraint chk_roles_code trong Database (V3).
 * Ánh xạ tường minh từng Role -> Set<Permission> theo nguyên tắc Least Privilege:
 * - Không dùng kế thừa toàn bộ quyền giữa các Role.
 * - Dùng chung Permission.COMMON_STAFF_PERMISSIONS cho các quyền tự phục vụ nhân sự.
 * - Tách bạch người thực hiện (EXECUTE/REQUEST) và người phê duyệt (APPROVE).
 */
@Getter
public enum UserRole {

    OWNER(
            "Chủ nhà hàng",
            100,
            "CH",
            buildPermissions(
                    // Auth
                    Permission.AUTH_KDS_PIN_EXECUTE,
                    Permission.AUTH_MANAGER_PIN_APPROVE,
                    // User & RBAC (Toàn quyền, bao gồm xóa mềm)
                    Permission.USER_ACCOUNT_VIEW,
                    Permission.USER_ACCOUNT_CREATE,
                    Permission.USER_ACCOUNT_UPDATE,
                    Permission.USER_STATUS_UPDATE,
                    Permission.USER_PIN_UPDATE,
                    Permission.USER_ACCOUNT_DELETE,
                    Permission.USER_RBAC_MATRIX_VIEW,
                    // Table & Reservation
                    Permission.TABLE_FLOOR_PLAN_VIEW,
                    Permission.TABLE_FLOOR_LAYOUT_UPDATE,
                    Permission.TABLE_STATE_UPDATE,
                    Permission.TABLE_RESERVATION_VIEW,
                    Permission.TABLE_RESERVATION_CREATE,
                    Permission.TABLE_RESERVATION_UPDATE,
                    // Menu & BOM (Toàn quyền)
                    Permission.MENU_CATALOG_CREATE_UPDATE,
                    Permission.MENU_BOM_RECIPE_VIEW,
                    Permission.MENU_BOM_RECIPE_UPDATE,
                    Permission.MENU_AVAILABILITY_UPDATE,
                    // Order
                    Permission.ORDER_ACTIVE_VIEW,
                    Permission.ORDER_CREATE_APPEND_EXECUTE,
                    Permission.ORDER_ITEM_SERVE_EXPEDITE_UPDATE,
                    Permission.ORDER_VOID_ITEM_REQUEST,
                    Permission.ORDER_VOID_ITEM_APPROVE,
                    // KDS (Giám sát & duyệt hao hụt; không bấm thao tác nấu trực tiếp)
                    Permission.KDS_QUEUE_VIEW,
                    Permission.KDS_WASTAGE_CREATE,
                    Permission.KDS_WASTAGE_APPROVE,
                    // POS & Cash (Toàn quyền & phê duyệt)
                    Permission.POS_BILL_VIEW,
                    Permission.POS_BILL_SPLIT_MERGE_EXECUTE,
                    Permission.POS_SETTLEMENT_EXECUTE,
                    Permission.POS_DISCOUNT_SELF_EXECUTE,
                    Permission.POS_DISCOUNT_OVERRIDE_APPROVE,
                    Permission.POS_BILL_REFUND_VOID_APPROVE,
                    Permission.POS_CASH_SHIFT_EXECUTE,
                    Permission.POS_CASH_SHIFT_APPROVE,
                    Permission.POS_PETTY_CASH_APPROVE,
                    // Inventory & PO (Toàn quyền)
                    Permission.INVENTORY_STOCK_VIEW,
                    Permission.INVENTORY_PREP_PRODUCTION_EXECUTE,
                    Permission.INVENTORY_PO_CREATE_APPROVE,
                    Permission.INVENTORY_PO_INBOUND_APPROVE,
                    Permission.INVENTORY_STOCK_AUDIT_EXECUTE,
                    Permission.INVENTORY_STOCK_AUDIT_APPROVE,
                    // HR & Payroll (Toàn quyền)
                    Permission.HR_ROSTER_SHIFT_CREATE_APPROVE,
                    Permission.HR_PAYROLL_TIP_POOL_APPROVE,
                    // Reports, Finance, System & AI (Toàn quyền)
                    Permission.REPORT_OPERATIONS_KPI_VIEW,
                    Permission.REPORT_FINANCE_PNL_BCG_VIEW,
                    Permission.SYS_STORE_PROFILE_LAN_UPDATE,
                    Permission.AI_VOICE_FORECAST_SENTIMENT_EXECUTE
            )
    ),

    MANAGER(
            "Quản lý ca",
            20,
            "QL",
            buildPermissions(
                    // Auth
                    Permission.AUTH_KDS_PIN_EXECUTE,
                    Permission.AUTH_MANAGER_PIN_APPROVE,
                    // User & RBAC (Quản lý nhân sự cấp dưới, KHÔNG có USER_ACCOUNT_DELETE)
                    Permission.USER_ACCOUNT_VIEW,
                    Permission.USER_ACCOUNT_CREATE,
                    Permission.USER_ACCOUNT_UPDATE,
                    Permission.USER_STATUS_UPDATE,
                    Permission.USER_PIN_UPDATE,
                    Permission.USER_RBAC_MATRIX_VIEW,
                    // Table & Reservation
                    Permission.TABLE_FLOOR_PLAN_VIEW,
                    Permission.TABLE_FLOOR_LAYOUT_UPDATE,
                    Permission.TABLE_STATE_UPDATE,
                    Permission.TABLE_RESERVATION_VIEW,
                    Permission.TABLE_RESERVATION_CREATE,
                    Permission.TABLE_RESERVATION_UPDATE,
                    // Menu (Xem BOM & khóa/mở món khẩn cấp; KHÔNG sửa giá/BOM gốc)
                    Permission.MENU_BOM_RECIPE_VIEW,
                    Permission.MENU_AVAILABILITY_UPDATE,
                    // Order
                    Permission.ORDER_ACTIVE_VIEW,
                    Permission.ORDER_CREATE_APPEND_EXECUTE,
                    Permission.ORDER_ITEM_SERVE_EXPEDITE_UPDATE,
                    Permission.ORDER_VOID_ITEM_REQUEST,
                    Permission.ORDER_VOID_ITEM_APPROVE,
                    // KDS (Giám sát SLA & duyệt hao hụt; KHÔNG bấm nấu trực tiếp)
                    Permission.KDS_QUEUE_VIEW,
                    Permission.KDS_WASTAGE_CREATE,
                    Permission.KDS_WASTAGE_APPROVE,
                    // POS & Cash (Đối soát & duyệt ngoại lệ trong trần 20%)
                    Permission.POS_BILL_VIEW,
                    Permission.POS_BILL_SPLIT_MERGE_EXECUTE,
                    Permission.POS_SETTLEMENT_EXECUTE,
                    Permission.POS_DISCOUNT_SELF_EXECUTE,
                    Permission.POS_DISCOUNT_OVERRIDE_APPROVE,
                    Permission.POS_BILL_REFUND_VOID_APPROVE,
                    Permission.POS_CASH_SHIFT_EXECUTE,
                    Permission.POS_CASH_SHIFT_APPROVE,
                    Permission.POS_PETTY_CASH_APPROVE,
                    // Inventory (Nhập kho PO & kiểm kê; KHÔNG tự tạo/duyệt PO gửi NCC)
                    Permission.INVENTORY_STOCK_VIEW,
                    Permission.INVENTORY_PREP_PRODUCTION_EXECUTE,
                    Permission.INVENTORY_PO_INBOUND_APPROVE,
                    Permission.INVENTORY_STOCK_AUDIT_EXECUTE,
                    Permission.INVENTORY_STOCK_AUDIT_APPROVE,
                    // HR (Duyệt lịch ca/nghỉ; KHÔNG quyết toán bảng lương toàn quán)
                    Permission.HR_ROSTER_SHIFT_CREATE_APPROVE,
                    // Reports & AI (Xem KPI vận hành & cảnh báo; KHÔNG mặc định cấp P&L toàn quán)
                    Permission.REPORT_OPERATIONS_KPI_VIEW,
                    Permission.AI_VOICE_FORECAST_SENTIMENT_EXECUTE
            )
    ),

    CASHIER(
            "Thu ngân",
            5,
            "TN",
            buildPermissions(
                    // Table & Reservation
                    Permission.TABLE_FLOOR_PLAN_VIEW,
                    Permission.TABLE_STATE_UPDATE,
                    Permission.TABLE_RESERVATION_VIEW,
                    Permission.TABLE_RESERVATION_CREATE,
                    Permission.TABLE_RESERVATION_UPDATE,
                    // Order (Xem đơn, hỗ trợ tạo đơn, gửi yêu cầu hủy món)
                    Permission.ORDER_ACTIVE_VIEW,
                    Permission.ORDER_CREATE_APPEND_EXECUTE,
                    Permission.ORDER_VOID_ITEM_REQUEST,
                    // POS & Cash (Thực thi thanh toán, tách/gộp bill, giảm giá <= 5%, khai báo ca)
                    Permission.POS_BILL_VIEW,
                    Permission.POS_BILL_SPLIT_MERGE_EXECUTE,
                    Permission.POS_SETTLEMENT_EXECUTE,
                    Permission.POS_DISCOUNT_SELF_EXECUTE,
                    Permission.POS_CASH_SHIFT_EXECUTE
            )
    ),

    CHEF(
            "Bếp trưởng / Đầu bếp",
            0,
            "BP",
            buildPermissions(
                    // Auth KDS
                    Permission.AUTH_KDS_PIN_EXECUTE,
                    // Menu (Xem BOM & báo hết món/mở bán lại tại bếp)
                    Permission.MENU_BOM_RECIPE_VIEW,
                    Permission.MENU_AVAILABILITY_UPDATE,
                    // Order & KDS (Thực thi chế biến & báo hao hụt)
                    Permission.ORDER_ACTIVE_VIEW,
                    Permission.KDS_QUEUE_VIEW,
                    Permission.KDS_COOKING_STATUS_UPDATE,
                    Permission.KDS_WASTAGE_CREATE,
                    // Inventory (Xem kho bếp, sơ chế/sản xuất, phối hợp kiểm kê)
                    Permission.INVENTORY_STOCK_VIEW,
                    Permission.INVENTORY_PREP_PRODUCTION_EXECUTE,
                    Permission.INVENTORY_STOCK_AUDIT_EXECUTE
            )
    ),

    WAITER(
            "Nhân viên phục vụ",
            0,
            "PV",
            buildPermissions(
                    // Table (Xem sơ đồ bàn & chuyển/dọn bàn)
                    Permission.TABLE_FLOOR_PLAN_VIEW,
                    Permission.TABLE_STATE_UPDATE,
                    // Order (Tạo/gọi thêm món, đánh dấu ra đồ/hối bếp, yêu cầu hủy món)
                    Permission.ORDER_ACTIVE_VIEW,
                    Permission.ORDER_CREATE_APPEND_EXECUTE,
                    Permission.ORDER_ITEM_SERVE_EXPEDITE_UPDATE,
                    Permission.ORDER_VOID_ITEM_REQUEST
            )
    ),

    STAFF(
            "Nhân viên tổng hợp",
            0,
            "NV",
            buildPermissions() // Chỉ gồm COMMON_STAFF_PERMISSIONS (an toàn mặc định)
    );

    private final String displayName;
    private final int defaultDiscountCeiling;
    private final String employeePrefix;
    private final Set<Permission> permissions;

    UserRole(String displayName, int defaultDiscountCeiling, String employeePrefix, Set<Permission> permissions) {
        this.displayName = displayName;
        this.defaultDiscountCeiling = defaultDiscountCeiling;
        this.employeePrefix = employeePrefix;
        this.permissions = permissions;
    }

    private static Set<Permission> buildPermissions(Permission... roleSpecificPermissions) {
        EnumSet<Permission> combined = EnumSet.copyOf(Permission.COMMON_STAFF_PERMISSIONS);
        if (roleSpecificPermissions != null && roleSpecificPermissions.length > 0) {
            combined.addAll(Arrays.asList(roleSpecificPermissions));
        }
        return Collections.unmodifiableSet(combined);
    }

    public boolean hasPermission(Permission permission) {
        return permission != null && this.permissions.contains(permission);
    }

    /**
     * Trả về chuỗi Role chuẩn của Spring Security (ví dụ: ROLE_OWNER).
     */
    public String getRoleAuthority() {
        return "ROLE_" + this.name();
    }

    /**
     * Trả về toàn bộ danh sách authority cho Spring Security:
     * bao gồm ROLE_<CODE> (tương thích ngược hasRole/hasAnyRole)
     * và từng permission.getAuthority() (dùng cho hasAuthority).
     */
    public Set<String> getAllAuthorities() {
        Set<String> authorities = new LinkedHashSet<>();
        authorities.add(getRoleAuthority());
        for (Permission p : this.permissions) {
            authorities.add(p.getAuthority());
        }
        return Collections.unmodifiableSet(authorities);
    }

    public static Optional<UserRole> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(r -> r.name().equalsIgnoreCase(code.trim()))
                .findFirst();
    }

    public static boolean isValidRole(String code) {
        return fromCode(code).isPresent();
    }
}
