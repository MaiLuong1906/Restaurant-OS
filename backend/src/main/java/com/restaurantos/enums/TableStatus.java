package com.restaurantos.enums;

/**
 * Trạng thái bàn ăn chuẩn hóa theo V3__reconciled_enterprise_schema.sql.
 * Khớp ràng buộc DB: CHECK (status IN ('VACANT', 'SERVING', 'BILLING', 'CLEANING', 'RESERVED')).
 */
public enum TableStatus {
    VACANT,
    SERVING,
    BILLING,
    CLEANING,
    RESERVED
}
