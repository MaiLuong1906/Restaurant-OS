package com.restaurantos.enums;

/**
 * Trạng thái lịch đặt bàn trước (UC_CASH_01, UC_CASH_02).
 * Khớp ràng buộc DB: CHECK (status IN ('PENDING', 'CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW')).
 */
public enum ReservationStatus {
    PENDING,
    CONFIRMED,
    SEATED,
    CANCELLED,
    NO_SHOW
}
