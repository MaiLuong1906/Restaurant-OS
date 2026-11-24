package com.restaurantos.common.enums;

import lombok.Getter;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Getter
public enum DishCategory {
    APPETIZER("Khai vị", UUID.fromString("00000000-0000-0000-0000-000000000051")),
    MAIN("Món chính", UUID.fromString("00000000-0000-0000-0000-000000000052")),
    SIDE_DISH("Món ăn kèm", UUID.fromString("00000000-0000-0000-0000-000000000052")),
    DESSERT("Tráng miệng", UUID.fromString("00000000-0000-0000-0000-000000000053")),
    DRINK("Đồ uống", UUID.fromString("00000000-0000-0000-0000-000000000053")),
    COMBO("Set Combo", UUID.fromString("00000000-0000-0000-0000-000000000052"));

    private final String displayName;
    private final UUID defaultCategoryId;

    DishCategory(String displayName, UUID defaultCategoryId) {
        this.displayName = displayName;
        this.defaultCategoryId = defaultCategoryId;
    }

    /**
     * Tìm Enum linh hoạt theo mã (hỗ trợ cả mã tiếng Anh và alias tiếng Việt thông dụng)
     */
    public static Optional<DishCategory> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        String clean = code.trim().toUpperCase();
        return Arrays.stream(values())
                .filter(c -> c.name().equalsIgnoreCase(clean)
                        || c.getDisplayName().equalsIgnoreCase(code.trim())
                        || (c == MAIN && clean.equals("MON_CHINH"))
                        || (c == APPETIZER && clean.equals("KHAI_VI"))
                        || (c == SIDE_DISH && clean.equals("MON_AN_KEM"))
                        || (c == DRINK && clean.equals("DO_UONG"))
                        || (c == DESSERT && clean.equals("TRANG_MIENG")))
                .findFirst();
    }

    public static boolean isValid(String code) {
        return fromCode(code).isPresent();
    }
}

