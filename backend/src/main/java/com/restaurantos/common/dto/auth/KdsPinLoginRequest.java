package com.restaurantos.common.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record KdsPinLoginRequest(
        @NotBlank(message = "Mã PIN không được để trống")
        @Pattern(regexp = "^\\d{4,6}$", message = "Mã PIN phải gồm từ 4 đến 6 chữ số")
        String pin,

        String tabletId
) {
}
