package com.restaurantos.dto.reservation;

import com.restaurantos.enums.ReservationStatus;
import com.restaurantos.enums.TableStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Payload sự kiện Realtime bắn qua STOMP topic /topic/pos/tables.
 */
public record PosTableEvent(
        String type,
        UUID tableId,
        String tableNumber,
        TableStatus tableStatus,
        UUID reservationId,
        ReservationStatus reservationStatus,
        Long depositAmount,
        Integer guestCount,
        Instant timestamp
) {}
