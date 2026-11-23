package com.restaurantos.service;

import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.dto.CompleteTicketRequest;
import com.restaurantos.dto.UpdateItemStatusRequest;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    /**
     * K3: Hoàn tất ticket (chuyển toàn bộ món WAITING sang READY).
     * Idempotent: nếu ticket đã READY hết hoặc không có món WAITING thì trả lại ticket hiện tại, không lỗi.
     */
    @Transactional
    public Optional<KdsTicketDto> completeTicket(UUID ticketId, CompleteTicketRequest request) {
        return orderRepository.findById(ticketId)
                .map(order -> {
                    List<OrderItemEntity> items = orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId());
                    boolean hasWaiting = false;
                    Instant now = Instant.now();

                    for (OrderItemEntity item : items) {
                        if ("WAITING".equalsIgnoreCase(item.getStatus())) {
                            item.setStatus("READY");
                            item.setUpdatedAt(now);
                            hasWaiting = true;
                        }
                    }

                    if (hasWaiting) {
                        orderItemRepository.saveAll(items);
                    }

                    return mapToTicketDto(order, items);
                });
    }

    /**
     * K4: Cập nhật trạng thái từng món trong ticket.
     * Chỉ cho phép: WAITING -> READY, WAITING -> REJECTED, READY -> REJECTED.
     * Bếp không được set SERVED (trả 409).
     * Yêu cầu reason 5-200 ký tự khi REJECTED (trả 400 nếu vi phạm).
     * Idempotent: nếu món đã ở trạng thái đích thì trả lại món hiện tại, không update lại.
     */
    @Transactional
    public Optional<KdsItemDto> updateItemStatus(UUID itemId, UpdateItemStatusRequest request) {
        OrderItemEntity item = orderItemRepository.findById(itemId).orElse(null);
        if (item == null) {
            return Optional.empty();
        }

        String targetStatus = request.status() != null ? request.status().trim().toUpperCase() : "";
        String currentStatus = item.getStatus() != null ? item.getStatus().trim().toUpperCase() : "";

        // 1. Kiểm tra trạng thái đích hợp lệ
        if (!"READY".equals(targetStatus) && !"REJECTED".equals(targetStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ cho phép cập nhật sang trạng thái READY hoặc REJECTED");
        }

        // 2. Idempotent check: nếu món đã ở trạng thái đích thì trả lại nguyên trạng
        if (targetStatus.equals(currentStatus)) {
            return Optional.of(mapToItemDto(item));
        }

        // 3. Kiểm tra chuyển trạng thái hợp lệ
        boolean validTransition = ("WAITING".equals(currentStatus) && ("READY".equals(targetStatus) || "REJECTED".equals(targetStatus)))
                || ("READY".equals(currentStatus) && "REJECTED".equals(targetStatus));

        if (!validTransition) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể chuyển trạng thái từ " + currentStatus + " sang " + targetStatus);
        }

        // 4. Validate reason khi REJECTED (5 - 200 ký tự)
        if ("REJECTED".equals(targetStatus)) {
            String reason = request.reason();
            if (reason == null || reason.trim().length() < 5 || reason.trim().length() > 200) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lý do từ chối là bắt buộc và phải từ 5 đến 200 ký tự khi chuyển sang REJECTED");
            }
            // TODO: UC19 - Hiện schema order_items chưa có cột lưu lý do từ chối (reason). Cần thêm cột + migration ở backlog sau.
        }

        item.setStatus(targetStatus);
        item.setUpdatedAt(Instant.now());
        OrderItemEntity saved = orderItemRepository.save(item);

        return Optional.of(mapToItemDto(saved));
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
