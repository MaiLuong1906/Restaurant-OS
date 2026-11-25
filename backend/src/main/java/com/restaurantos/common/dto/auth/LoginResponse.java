package com.restaurantos.common.dto.auth;

import com.restaurantos.common.dto.user.UserResponseDto;

import java.util.Set;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponseDto user,
        Set<String> permissions
) {
}
