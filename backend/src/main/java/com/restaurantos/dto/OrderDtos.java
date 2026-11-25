package com.restaurantos.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTOs cho Order domain.
 * Dùng Java records để gọn, immutable, tương thích Jackson.
 */
public final class OrderDtos {

    private OrderDtos() {}

    // ─── Request ─────────────────────────────────────────────────────────────

    /**
     * Payload POST /api/v1/orders từ Frontend (Waiter gửi bếp).
     */
    public record CreateOrderRequest(
            String tableId,          // UUID của bàn (string từ FE)
            List<OrderItemRequest> items,
            String customerNotes,    // nullable
            String idempotencyKey    // nullable – FE có thể gửi để idempotent
    ) {}

    public record OrderItemRequest(
            String dishId,           // UUID của món
            int quantity,            // >= 1
            String notes,            // nullable – ghi chú riêng cho món
            String allergyNote       // nullable
    ) {}

    // ─── Response ────────────────────────────────────────────────────────────

    public record OrderResponse(
            UUID id,
            UUID tableId,
            String orderCode,
            String status,
            Long totalAmount,
            String customerNotes,
            Instant openedAt,
            Instant createdAt,
            List<OrderItemResponse> items
    ) {}

    public record OrderItemResponse(
            UUID id,
            UUID dishId,
            String dishNameSnapshot,
            UUID portionId,
            String portionNameSnapshot,
            int quantity,
            Long unitPrice,
            String status,
            String notes,
            String allergyNote,
            Instant createdAt,
            Instant slaDeadline,
            Instant updatedAt
    ) {}

    // ─── Table Request / Response ─────────────────────────────────────────────

    public record UpdateTableStatusRequest(
            String status
    ) {}

    public record TableResponse(
            UUID id,
            String tableNumber,
            Integer capacity,
            String status,
            UUID currentOrderId
    ) {}

    // ─── Dish Portion Response ────────────────────────────────────────────────

    public record DishPortionResponse(
            UUID id,
            UUID dishId,
            String portionName,
            Long price,
            Boolean isDefault
    ) {}
}
