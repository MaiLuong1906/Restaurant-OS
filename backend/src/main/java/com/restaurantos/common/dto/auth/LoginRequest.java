package com.restaurantos.common.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Số điện thoại hoặc tên đăng nhập không được để trống")
        String identifier,

        @NotBlank(message = "Mật khẩu không được để trống")
        String password
) {
}
