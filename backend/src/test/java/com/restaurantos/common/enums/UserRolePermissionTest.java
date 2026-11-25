package com.restaurantos.common.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class UserRolePermissionTest {

    @Test
    @DisplayName("Tất cả 6 Role nội bộ đều có nhóm quyền nền tảng COMMON_STAFF_PERMISSIONS")
    void allSixRoles_shouldContainCommonStaffPermissions() {
        assertThat(UserRole.values()).hasSize(6);

        for (UserRole role : UserRole.values()) {
            assertThat(role.getPermissions())
                    .as("Role %s phải chứa đầy đủ COMMON_STAFF_PERMISSIONS", role.name())
                    .containsAll(Permission.COMMON_STAFF_PERMISSIONS);
            assertThat(role.getAllAuthorities())
                    .contains("ROLE_" + role.name());
        }
    }

    @Test
    @DisplayName("Đặc quyền nhạy cảm chỉ thuộc về OWNER (Least Privilege)")
    void sensitiveOwnerOnlyPermissions_shouldNotBeGrantedToOtherRoles() {
        Set<Permission> ownerOnly = Set.of(
                Permission.USER_ACCOUNT_DELETE,
                Permission.MENU_CATALOG_CREATE_UPDATE,
                Permission.MENU_BOM_RECIPE_UPDATE,
                Permission.INVENTORY_PO_CREATE_APPROVE,
                Permission.HR_PAYROLL_TIP_POOL_APPROVE,
                Permission.REPORT_FINANCE_PNL_BCG_VIEW,
                Permission.SYS_STORE_PROFILE_LAN_UPDATE
        );

        for (Permission p : ownerOnly) {
            assertThat(UserRole.OWNER.hasPermission(p)).isTrue();
            assertThat(UserRole.MANAGER.hasPermission(p)).as("MANAGER không được có mặc định %s", p).isFalse();
            assertThat(UserRole.CASHIER.hasPermission(p)).isFalse();
            assertThat(UserRole.CHEF.hasPermission(p)).isFalse();
            assertThat(UserRole.WAITER.hasPermission(p)).isFalse();
            assertThat(UserRole.STAFF.hasPermission(p)).isFalse();
        }
    }

    @Test
    @DisplayName("Tách bạch KDS: Chỉ CHEF được thao tác cập nhật trạng thái chế biến KDS")
    void kdsCookingStatusUpdate_shouldBeExclusiveToChef() {
        assertThat(UserRole.CHEF.hasPermission(Permission.KDS_COOKING_STATUS_UPDATE)).isTrue();
        assertThat(UserRole.MANAGER.hasPermission(Permission.KDS_COOKING_STATUS_UPDATE)).isFalse();
        assertThat(UserRole.OWNER.hasPermission(Permission.KDS_COOKING_STATUS_UPDATE)).isFalse();

        // Nhưng MANAGER và OWNER vẫn được giám sát hàng đợi KDS
        assertThat(UserRole.MANAGER.hasPermission(Permission.KDS_QUEUE_VIEW)).isTrue();
        assertThat(UserRole.OWNER.hasPermission(Permission.KDS_QUEUE_VIEW)).isTrue();
    }

    @Test
    @DisplayName("Tách bạch người thực hiện và người phê duyệt: CASHIER, CHEF, WAITER, STAFF không có quyền APPROVE")
    void operationalRoles_shouldNotHaveApprovalPermissions() {
        UserRole[] nonApproverRoles = {UserRole.CASHIER, UserRole.CHEF, UserRole.WAITER, UserRole.STAFF};

        for (UserRole role : nonApproverRoles) {
            for (Permission p : role.getPermissions()) {
                assertThat(p.getAuthority())
                        .as("Role %s không được có quyền APPROVE (%s)", role.name(), p.getAuthority())
                        .doesNotEndWith(":APPROVE");
            }
        }
    }

    @Test
    @DisplayName("STAFF mặc định chỉ có nhóm quyền tự phục vụ nhân sự (không cấp quyền vận hành dư thừa)")
    void staffRole_shouldOnlyHaveCommonStaffPermissions() {
        assertThat(UserRole.STAFF.getPermissions())
                .containsExactlyInAnyOrderElementsOf(Permission.COMMON_STAFF_PERMISSIONS);
    }
}
