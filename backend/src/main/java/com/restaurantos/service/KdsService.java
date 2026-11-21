package com.restaurantos.service;

import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KdsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * K1: Lấy danh sách ticket còn việc hiển thị trên KDS.
     * Thứ tự trả về tuân thủ nguyên bản JPQL orderRepository.findActiveOrdersByPriority()
     * (Dị ứng -> Quá/Sắp SLA -> Thời gian nhận).
     */
    public List<KdsTicketDto> getTickets() {
        List<OrderEntity> activeOrders = orderRepository.findActiveOrdersByPriority();
        if (activeOrders.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> orderIds = activeOrders.stream()
                .map(OrderEntity::getId)
                .toList();

        List<OrderItemEntity> allItems = orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(orderIds);
        Map<UUID, List<OrderItemEntity>> itemsByOrderId = allItems.stream()
                .collect(Collectors.groupingBy(OrderItemEntity::getOrderId));

        return activeOrders.stream()
                .map(order -> mapToTicketDto(order, itemsByOrderId.getOrDefault(order.getId(), Collections.emptyList())))
                .toList();
    }

    /**
     * K2: Lấy chi tiết ticket theo ID đơn hàng (orders.id).
     */
    public Optional<KdsTicketDto> getTicketById(UUID ticketId) {
        return orderRepository.findById(ticketId)
                .map(order -> {
                    List<OrderItemEntity> items = orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
                    return mapToTicketDto(order, items);
                });
    }

    /**
     * K6: Lấy danh sách các món đang active (WAITING hoặc READY).
     */
    public List<KdsItemDto> getActiveItems() {
        return orderItemRepository.findActiveItems().stream()
                .map(this::mapToItemDto)
                .toList();
    }

    private KdsTicketDto mapToTicketDto(OrderEntity order, List<OrderItemEntity> itemEntities) {
        List<KdsItemDto> items = itemEntities.stream()
                .map(this::mapToItemDto)
                .toList();

        String status = deriveTicketStatus(itemEntities);
        Instant slaDeadline = calculateTicketSlaDeadline(order, itemEntities);
        String tableNo = order.getTable() != null ? order.getTable().getTableNumber() : "Mang về / Chưa xếp bàn";

        return new KdsTicketDto(
                order.getId(),
                tableNo,
                order.getTableId(),
                status,
                slaDeadline,
                order.getCreatedAt(),
                items
        );
    }

    private KdsItemDto mapToItemDto(OrderItemEntity entity) {
        String dishName = entity.getDishNameSnapshot();
        if (dishName == null || dishName.isBlank()) {
            var dish = entity.getDish();
            dishName = dish != null ? dish.getName() : "Món ăn";
        }
        return new KdsItemDto(
                entity.getId(),
                entity.getDishId(),
                dishName,
                entity.getQuantity(),
                entity.getNotes(),
                entity.getAllergyNote(),
                entity.getStatus(),
                entity.getSlaDeadline(),
                entity.getIsExpedited()
        );
    }

    /**
     * Quy tắc suy diễn trạng thái ticket từ danh sách món con:
     * - Có ít nhất 1 món WAITING -> WAITING
     * - Không có WAITING, có ít nhất 1 món READY -> READY
     * - Không có WAITING/READY, có ít nhất 1 món REJECTED -> REJECTED
     * - Tất cả món SERVED (hoặc rỗng) -> SERVED
     */
    private String deriveTicketStatus(List<OrderItemEntity> items) {
        if (items.stream().anyMatch(i -> "WAITING".equalsIgnoreCase(i.getStatus()))) {
            return "WAITING";
        }
        if (items.stream().anyMatch(i -> "READY".equalsIgnoreCase(i.getStatus()))) {
            return "READY";
        }
        if (items.stream().anyMatch(i -> "REJECTED".equalsIgnoreCase(i.getStatus()))) {
            return "REJECTED";
        }
        return "SERVED";
    }

    /**
     * Tính SLA Deadline của ticket:
     * MIN(slaDeadline) của các món WAITING hoặc READY.
     * Nếu không có hoặc null, fallback = order.getCreatedAt() + 15 phút.
     */
    private Instant calculateTicketSlaDeadline(OrderEntity order, List<OrderItemEntity> items) {
        Instant minActiveSla = items.stream()
                .filter(i -> "WAITING".equalsIgnoreCase(i.getStatus()) || "READY".equalsIgnoreCase(i.getStatus()))
                .map(OrderItemEntity::getSlaDeadline)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);

        if (minActiveSla != null) {
            return minActiveSla;
        }

        Instant baseTime = order.getCreatedAt() != null ? order.getCreatedAt() : Instant.now();
        return baseTime.plus(Duration.ofMinutes(15));
    }
}
