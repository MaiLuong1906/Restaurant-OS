package com.restaurantos.dto.reservation;

import java.util.UUID;

public record DiningZoneResponse(
        UUID id,
        String name,
        Integer displayOrder
) {}
