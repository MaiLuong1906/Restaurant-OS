package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.*;
import com.restaurantos.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final DishRepository dishRepository;
    private final DishPortionRepository dishPortionRepository;
    private final ObjectProvider<SimpMessagingTemplate> messagingTemplateProvider;

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
        TableEntity table = tableRepository.findById(tableUuid)
                .orElseThrow(() -> new IllegalArgumentException("Bàn không tồn tại: " + req.tableId()));

        // Chặn mở đơn trên bàn đang dọn dẹp (CLEANING)
        if ("CLEANING".equalsIgnoreCase(table.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Bàn '" + table.getTableNumber() + "' đang dọn dẹp, chưa thể tạo đơn mới.");
        }

        // Cập nhật trạng thái bàn sang SERVING nếu đang VACANT hoặc RESERVED
        if ("VACANT".equalsIgnoreCase(table.getStatus()) || "RESERVED".equalsIgnoreCase(table.getStatus())) {
            Instant tableNow = Instant.now();
            table.setStatus("SERVING");
            table.setOccupiedAt(tableNow);
            table.setUpdatedAt(tableNow);
            tableRepository.save(table);
            publishRealtimeEventAfterCommit(TableService.POS_TABLES_TOPIC, Map.of(
                    "eventType", "TABLE_STATUS_UPDATED",
                    "tableId", table.getId(),
                    "tableNumber", table.getTableNumber(),
                    "status", "SERVING",
                    "timestamp", tableNow
            ));
        }

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
                    .slaDeadline(now.plus(Duration.ofMinutes(15)))
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

            // Kiểm tra Idempotency cho lượt gọi thêm món: nếu trùng key lượt trước -> trả về luôn tránh nhân đôi món
            if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()
                    && req.idempotencyKey().equals(order.getIdempotencyKey())) {
                List<OrderItemEntity> existingItems = orderItemRepository.findByOrderId(order.getId());
                return toOrderResponse(order, existingItems);
            }

            order.setTotalAmount(order.getTotalAmount() + totalAmount);
            if ("SERVED".equalsIgnoreCase(order.getStatus())) {
                order.setStatus("PLACED"); // Có món mới WAITING nên không còn ở trạng thái đã phục vụ hết
            }
            if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
                order.setIdempotencyKey(req.idempotencyKey()); // Lưu idempotency key của lượt gọi thêm này
            }
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order không tồn tại: " + orderId));
        List<OrderItemEntity> items = orderItemRepository.findByOrderId(orderId);
        return toOrderResponse(order, items);
    }

    /**
     * Lấy danh sách tất cả các order đang hoạt động (chưa hoàn tất hoặc hủy).
     * Khắc phục N+1 query: Dùng findByOrderIdIn() gom 1 câu query duy nhất cho toàn bộ items.
     */
    @Transactional(readOnly = true)
    public List<OrderDtos.OrderResponse> getActiveOrders() {
        List<OrderEntity> orders = orderRepository.findByStatusIn(List.of("PLACED", "CONFIRMED", "SERVED"));
        if (orders.isEmpty()) {
            return List.of();
        }

        List<UUID> orderIds = orders.stream().map(OrderEntity::getId).toList();
        java.util.Map<UUID, List<OrderItemEntity>> itemsByOrderId = orderItemRepository.findByOrderIdIn(orderIds)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(OrderItemEntity::getOrderId));

        return orders.stream()
                .map(order -> toOrderResponse(order, itemsByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();
    }

    /**
     * Phục vụ xác nhận đã giao 1 món cho khách (READY -> SERVED).
     * Dùng atomic conditional update để chống giao trùng hoặc race condition khi 2 phục vụ bấm cùng lúc.
     * Nếu toàn bộ món hợp lệ (không bị REJECTED) trong đơn đều đã SERVED, tự đồng bộ trạng thái đơn sang SERVED
     * nhưng KHÔNG tự giải phóng bàn sang VACANT.
     */
    @Transactional
    public OrderDtos.OrderItemResponse serveOrderItem(UUID itemId) {
        OrderItemEntity item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy món với ID: " + itemId));

        String currentStatus = item.getStatus() != null ? item.getStatus().toUpperCase() : "";
        if ("SERVED".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Món '" + item.getDishNameSnapshot() + "' đã được giao cho khách trước đó.");
        }
        if ("WAITING".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Món '" + item.getDishNameSnapshot() + "' đang chờ bếp chế biến, chưa thể giao.");
        }
        if ("REJECTED".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Món '" + item.getDishNameSnapshot() + "' đã bị bếp từ chối, không thể giao.");
        }
        if (!"READY".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Trạng thái món không hợp lệ để giao: " + item.getStatus());
        }

        Instant now = Instant.now();
        int updated = orderItemRepository.markAsServedIfReady(itemId, now);
        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Món '" + item.getDishNameSnapshot() + "' đã được cập nhật bởi thao tác khác.");
        }

        item.setStatus("SERVED");
        item.setServedAt(now);
        item.setUpdatedAt(now);

        // Đồng bộ trạng thái Order sang SERVED nếu tất cả món không bị REJECTED đều đã SERVED
        if (item.getOrderId() != null) {
            List<OrderItemEntity> orderItems = orderItemRepository.findByOrderId(item.getOrderId());
            boolean hasUnserved = orderItems.stream()
                    .anyMatch(i -> "WAITING".equalsIgnoreCase(i.getStatus()) || "READY".equalsIgnoreCase(i.getStatus()));
            boolean hasServed = orderItems.stream()
                    .anyMatch(i -> "SERVED".equalsIgnoreCase(i.getStatus()));
            if (!hasUnserved && hasServed) {
                orderRepository.findById(item.getOrderId()).ifPresent(order -> {
                    if ("PLACED".equalsIgnoreCase(order.getStatus()) || "CONFIRMED".equalsIgnoreCase(order.getStatus())) {
                        order.setStatus("SERVED");
                        order.setUpdatedAt(now);
                        orderRepository.save(order);
                    }
                });
            }
        }

        Map<String, Object> servedEvent = new LinkedHashMap<>();
        servedEvent.put("eventType", "ORDER_ITEM_SERVED");
        servedEvent.put("orderId", item.getOrderId());
        servedEvent.put("itemId", item.getId());
        servedEvent.put("status", "SERVED");
        servedEvent.put("servedAt", now);
        publishRealtimeEventAfterCommit(TableService.POS_TABLES_TOPIC, servedEvent);

        return toOrderItemResponse(item);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void publishRealtimeEventAfterCommit(String topic, Map<String, Object> payload) {
        SimpMessagingTemplate template = messagingTemplateProvider != null
                ? messagingTemplateProvider.getIfAvailable()
                : null;
        if (template == null) {
            return;
        }
        Runnable sendAction = () -> {
            try {
                template.convertAndSend(topic, payload);
            } catch (Exception ex) {
                log.warn("Không thể gửi STOMP event tới {}: {}", topic, ex.getMessage());
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendAction.run();
                }
            });
        } else {
            sendAction.run();
        }
    }

    private UUID parseUuid(String value, String field) {
        try {
            return UUID.fromString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("'" + field + "' không phải UUID hợp lệ: " + value);
        }
    }

    private OrderDtos.OrderItemResponse toOrderItemResponse(OrderItemEntity item) {
        return new OrderDtos.OrderItemResponse(
                item.getId(),
                item.getDishId(),
                item.getDishNameSnapshot(),
                item.getPortionId(),
                item.getPortionNameSnapshot(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getStatus(),
                item.getNotes(),
                item.getAllergyNote(),
                item.getCreatedAt(),
                item.getSlaDeadline(),
                item.getUpdatedAt()
        );
    }

    private OrderDtos.OrderResponse toOrderResponse(OrderEntity order, List<OrderItemEntity> items) {
        List<OrderDtos.OrderItemResponse> itemResponses = items.stream()
                .map(this::toOrderItemResponse)
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
