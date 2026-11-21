package com.restaurantos.dto.reservation;

import com.restaurantos.enums.DepositMethod;
import com.restaurantos.enums.ReservationStatus;
import com.restaurantos.enums.TableStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO phản hồi chuẩn cho đơn đặt bàn (UC_CASH_01 & UC_CASH_02).
 */
public record ReservationResponse(
        UUID id,
        UUID tableId,
        String tableNumber,
        Integer tableCapacity,
        TableStatus tableStatus,
        String qrCodeToken,
        UUID zoneId,
        String zoneName,
        String customerName,
        String customerPhone,
        Integer guestCount,
        Instant reservationTime,
        Long depositAmount,
        DepositMethod depositMethod,
        ReservationStatus status,
        String notes,
        UUID createdBy,
        Instant checkedInAt,
        Instant cancelledAt,
        String cancelReason,
        Instant createdAt,
        Instant updatedAt
) {}
