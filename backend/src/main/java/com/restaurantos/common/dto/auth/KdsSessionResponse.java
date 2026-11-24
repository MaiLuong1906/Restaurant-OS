package com.restaurantos.common.dto.auth;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record KdsSessionResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String tabletId,
        UUID staffId,
        String employeeCode,
        String staffName,
        String roleCode,
        Set<String> permissions,
        Instant authenticatedAt,
        Instant expiresAt
) {
}
