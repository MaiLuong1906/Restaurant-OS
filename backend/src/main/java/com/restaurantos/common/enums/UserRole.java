package com.restaurantos.common.enums;

import lombok.Getter;

import java.util.Arrays;
import java.util.Optional;

@Getter
public enum UserRole {
    OWNER("Chủ nhà hàng", 100, "CH"),
    MANAGER("Quản lý ca", 20, "QL"),
    CASHIER("Thu ngân", 5, "TN"),
    CHEF("Bếp trưởng / Đầu bếp", 0, "BP"),
    WAITER("Nhân viên phục vụ", 0, "PV"),
    STAFF("Nhân viên tổng hợp", 0, "NV");

    private final String displayName;
    private final int defaultDiscountCeiling;
    private final String employeePrefix;

    UserRole(String displayName, int defaultDiscountCeiling, String employeePrefix) {
        this.displayName = displayName;
        this.defaultDiscountCeiling = defaultDiscountCeiling;
        this.employeePrefix = employeePrefix;
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
