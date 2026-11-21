package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.*;
import com.restaurantos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final DishRepository dishRepository;
    private final DishPortionRepository dishPortionRepository;

    /**
     * Tạo đơn hàng mới. Idempotent nếu FE truyền idempotencyKey.
     */
    @Transactional
    public OrderDtos.OrderResponse createOrder(OrderDtos.CreateOrderRequest req) {

        // 1. Idempotency check
        if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
            var existing = orderRepository.findByIdempotencyKey(req.idempotencyKey());
            if (existing.isPresent()) {
                return toOrderResponse(existing.get(),
                        orderItemRepository.findByOrderId(existing.get().getId()));
            }
        }

        // 2. Validate table
        UUID tableUuid = parseUuid(req.tableId(), "tableId");
        tableRepository.findById(tableUuid)
                .orElseThrow(() -> new IllegalArgumentException("Bàn không tồn tại: " + req.tableId()));

        // 3. Validate items
        if (req.items() == null || req.items().isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải có ít nhất 1 món.");
        }

        // 4. Build order items & tính tổng tiền
        long totalAmount = 0L;
        List<OrderItemEntity> itemEntities = new ArrayList<>();
        Instant now = Instant.now();

        for (OrderDtos.OrderItemRequest itemReq : req.items()) {
            if (itemReq.quantity() < 1) {
                throw new IllegalArgumentException("Số lượng phải >= 1 cho món: " + itemReq.dishId());
            }

            UUID dishUuid = parseUuid(itemReq.dishId(), "dishId");
            DishEntity dish = dishRepository.findById(dishUuid)
                    .orElseThrow(() -> new IllegalArgumentException("Món không tồn tại: " + itemReq.dishId()));

            if (Boolean.FALSE.equals(dish.getIsAvailable())) {
                throw new IllegalArgumentException("Món tạm hết: " + dish.getName());
            }

            // Lookup portion (default portion)
            var portion = dishPortionRepository.findByDishIdAndIsDefaultTrue(dishUuid);
            UUID portionId;
            Long unitPrice;
            String portionName;

            if (portion.isPresent()) {
                portionId = portion.get().getId();
                unitPrice = portion.get().getPrice();
                portionName = portion.get().getPortionName();
            } else {
                // Fallback: tìm bất kỳ portion nào, hoặc dùng giá dish
                var anyPortion = dishPortionRepository.findByDishId(dishUuid)
                        .stream().findFirst();
                if (anyPortion.isPresent()) {
                    portionId = anyPortion.get().getId();
                    unitPrice = anyPortion.get().getPrice();
                    portionName = anyPortion.get().getPortionName();
                } else {
                    throw new IllegalArgumentException(
                            "Món '" + dish.getName() + "' chưa có portion. Vui lòng cài đặt menu trước.");
                }
            }

            totalAmount += unitPrice * itemReq.quantity();

            itemEntities.add(OrderItemEntity.builder()
                    .id(UUID.randomUUID())
                    .orderId(null) // set sau khi lưu order
                    .dishId(dishUuid)
                    .quantity(itemReq.quantity())
                    .unitPrice(unitPrice)
                    .modifiers("[]")
                    .status("WAITING")
                    .notes(itemReq.notes())
                    .allergyNote(itemReq.allergyNote())
                    .portionId(portionId)
                    .dishNameSnapshot(dish.getName())
                    .portionNameSnapshot(portionName)
                    .isExpedited(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }

        // 5. Kiểm tra bàn đã có Order đang phục vụ chưa
        // Nếu đã có Order -> Thêm món vào Order cũ (không tạo Order mới để tránh vi phạm uq_active_table_assignment)
        var activeOrdersForTable = orderRepository.findByTableIdAndStatusIn(
                tableUuid, List.of("PLACED", "CONFIRMED", "SERVED"));

        OrderEntity order;
        if (!activeOrdersForTable.isEmpty()) {
            // Trường hợp: Bàn đang phục vụ gọi thêm món mới
            order = activeOrdersForTable.get(0);
            order.setTotalAmount(order.getTotalAmount() + totalAmount);
            order.setUpdatedAt(now);
            if (req.customerNotes() != null && !req.customerNotes().isBlank()) {
                String existingNotes = order.getCustomerNotes() != null ? order.getCustomerNotes() + " | " : "";
                order.setCustomerNotes(existingNotes + req.customerNotes());
            }
            order = orderRepository.save(order);
        } else {
            // Trường hợp: Bàn mới mở đơn
            String orderCode = "ORD-" + System.currentTimeMillis();
            order = OrderEntity.builder()
                    .id(UUID.randomUUID())
                    .tableId(tableUuid)
                    .status("PLACED")
                    .totalAmount(totalAmount)
                    .idempotencyKey(req.idempotencyKey())
                    .customerNotes(req.customerNotes())
                    .orderCode(orderCode)
                    .openedAt(now)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            order = orderRepository.save(order);
        }

        // 6. Lưu Order Items (gắn orderId)
        final UUID orderId = order.getId();
        for (OrderItemEntity item : itemEntities) {
            item.setOrderId(orderId);
        }
        orderItemRepository.saveAll(itemEntities);

        // Lấy tất cả items của order (bao gồm các món cũ + món mới)
        List<OrderItemEntity> allItems = orderItemRepository.findByOrderId(orderId);

        return toOrderResponse(order, allItems);
    }

    /**
     * Lấy chi tiết order theo ID.
     */
    @Transactional(readOnly = true)
    public OrderDtos.OrderResponse getOrder(UUID orderId) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order không tồn tại: " + orderId));
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);
        return toOrderResponse(order, items);
    }

    /**
     * Lấy danh sách tất cả các order đang hoạt động (chưa hoàn tất hoặc hủy).
     */
    @Transactional(readOnly = true)
    public List<OrderDtos.OrderResponse> getActiveOrders() {
        List<OrderEntity> orders = orderRepository.findByStatusIn(List.of("PLACED", "CONFIRMED", "SERVED"));
        return orders.stream()
                .map(order -> toOrderResponse(order, orderItemRepository.findByOrderId(order.getId())))
                .toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private UUID parseUuid(String value, String field) {
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("'" + field + "' không phải UUID hợp lệ: " + value);
        }
    }

    private OrderDtos.OrderResponse toOrderResponse(OrderEntity order, List<OrderItemEntity> items) {
        List<OrderDtos.OrderItemResponse> itemResponses = items.stream()
                .map(item -> new OrderDtos.OrderItemResponse(
                        item.getId(),
                        item.getDishId(),
                        item.getDishNameSnapshot(),
                        item.getPortionId(),
                        item.getPortionNameSnapshot(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getStatus(),
                        item.getNotes(),
                        item.getAllergyNote()
                ))
                .toList();

        return new OrderDtos.OrderResponse(
                order.getId(),
                order.getTableId(),
                order.getOrderCode(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCustomerNotes(),
                order.getOpenedAt(),
                order.getCreatedAt(),
                itemResponses
        );
    }
}
