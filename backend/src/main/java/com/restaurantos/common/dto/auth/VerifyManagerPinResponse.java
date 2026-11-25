package com.restaurantos.common.dto.auth;

import java.util.UUID;

public record VerifyManagerPinResponse(
        boolean approved,
        UUID approverId,
        String approverCode,
        String approverName,
        String approverRole,
        int discountCeiling,
        String approvalToken,
        long expiresIn
) {
}
