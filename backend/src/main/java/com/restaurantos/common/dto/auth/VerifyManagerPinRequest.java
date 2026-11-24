package com.restaurantos.common.dto.auth;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyManagerPinRequest(
        @NotBlank(message = "Mã PIN Quản lý không được để trống")
        @Pattern(regexp = "^\\d{4,6}$", message = "Mã PIN phải gồm từ 4 đến 6 chữ số")
        String pin,

        String requiredPermission,

        @Min(value = 0, message = "Phần trăm chiết khấu không hợp lệ")
        @Max(value = 100, message = "Phần trăm chiết khấu tối đa là 100%")
        Integer requestedDiscountPercent
) {
}
