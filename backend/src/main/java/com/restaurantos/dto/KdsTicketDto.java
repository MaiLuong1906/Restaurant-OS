package com.restaurantos.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record KdsTicketDto(
        UUID id,
        String tableNo,
        UUID tableId,
        String status,
        Instant slaDeadline,
        Instant createdAt,
        List<KdsItemDto> items
) {
}
