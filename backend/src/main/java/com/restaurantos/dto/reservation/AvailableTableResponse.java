package com.restaurantos.dto.reservation;

import com.restaurantos.enums.TableStatus;

import java.util.UUID;

/**
 * Thông tin bàn khả dụng trả về cho luồng <<include>> Check Table Availability (UC_CASH_01).
 */
public record AvailableTableResponse(
        UUID id,
        String tableNumber,
        Integer capacity,
        TableStatus status,
        UUID zoneId,
        String zoneName,
        String qrCodeToken
) {}
