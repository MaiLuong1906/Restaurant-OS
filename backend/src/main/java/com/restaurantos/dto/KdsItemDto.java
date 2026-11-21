package com.restaurantos.dto;

import java.time.Instant;
import java.util.UUID;

public record KdsItemDto(
        UUID id,
        UUID dishId,
        String dishName,
        Integer quantity,
        String notes,
        String allergy,
        String status,
        Instant slaDeadline,
        Boolean isExpedited
) {
}
