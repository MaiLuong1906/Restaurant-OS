package com.restaurantos.service;

import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.dto.CompleteBatchRequest;
import com.restaurantos.dto.CompleteTicketRequest;
import com.restaurantos.dto.UpdateItemStatusRequest;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@Transactional(readOnly = true)
public class KdsService {

    public static final String KDS_ORDERS_TOPIC = "/topic/kds/orders";

    public record KdsOrderEvent(String action, KdsOrderEventData data) {}

    public record KdsOrderEventData(UUID id, String status) {}

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
                    List<KdsOrderEventData> transitionedEvents = new ArrayList<>();
                    Instant now = Instant.now();

                    for (OrderItemEntity item : items) {
                        if ("WAITING".equalsIgnoreCase(item.getStatus())) {
                            item.setStatus("READY");
                            item.setUpdatedAt(now);
                            hasWaiting = true;
                            transitionedEvents.add(new KdsOrderEventData(item.getId(), "READY"));
                        }
                    }

                    if (hasWaiting) {
                        orderItemRepository.saveAll(items);
                        publishStatusUpdatesAfterCommit(transitionedEvents);
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
        publishStatusUpdatesAfterCommit(List.of(new KdsOrderEventData(saved.getId(), targetStatus)));

        return Optional.of(mapToItemDto(saved));
    }

    /**
     * K5: Hoàn tất mẻ nấu (chuyển danh sách món WAITING sang READY trong 1 transaction).
     * - Dedupe itemIds âm thầm.
     * - Thiếu bất kỳ itemId nào -> Optional.empty() (404).
     * - Có món ở trạng thái REJECTED hoặc SERVED -> 409 CONFLICT (all-or-nothing, không đổi gì).
     * - Món đã READY -> bỏ qua (idempotent).
     * - Trả về danh sách ticket DISTINCT chứa các món trong itemIds sau khi cập nhật.
     */
    @Transactional
    public Optional<List<KdsTicketDto>> completeBatch(CompleteBatchRequest request) {
        if (request == null || request.itemIds() == null || request.itemIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách món không được để trống");
        }

        List<UUID> distinctItemIds = request.itemIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (distinctItemIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách món không được để trống");
        }

        List<OrderItemEntity> foundItems = orderItemRepository.findAllById(distinctItemIds);
        if (foundItems.size() != distinctItemIds.size()) {
            return Optional.empty();
        }

        for (OrderItemEntity item : foundItems) {
            String currentStatus = item.getStatus() != null ? item.getStatus().trim().toUpperCase() : "";
            if ("REJECTED".equals(currentStatus) || "SERVED".equals(currentStatus)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể hoàn tất mẻ vì có món đã ở trạng thái " + currentStatus
                );
            }
            if (!"WAITING".equals(currentStatus) && !"READY".equals(currentStatus)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể hoàn tất mẻ vì có món ở trạng thái không hợp lệ: " + currentStatus
                );
            }
        }

        boolean hasWaiting = false;
        List<UUID> transitionedItemIds = new ArrayList<>();
        Instant now = Instant.now();
        for (OrderItemEntity item : foundItems) {
            if ("WAITING".equalsIgnoreCase(item.getStatus())) {
                item.setStatus("READY");
                item.setUpdatedAt(now);
                hasWaiting = true;
                transitionedItemIds.add(item.getId());
            }
        }

        if (hasWaiting) {
            orderItemRepository.saveAll(foundItems);
            publishBatchStatusUpdateAfterCommit(transitionedItemIds);
        }

        List<UUID> distinctOrderIds = foundItems.stream()
                .map(OrderItemEntity::getOrderId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<KdsTicketDto> updatedTickets = distinctOrderIds.stream()
                .map(this::getTicketById)
                .flatMap(Optional::stream)
                .toList();

        return Optional.of(updatedTickets);
    }

    private void publishBatchStatusUpdateAfterCommit(List<UUID> itemIds) {
        List<KdsOrderEventData> updates = itemIds.stream()
                .map(itemId -> new KdsOrderEventData(itemId, "READY"))
                .toList();
        publishStatusUpdatesAfterCommit(updates);
    }

    private void publishStatusUpdatesAfterCommit(List<KdsOrderEventData> updates) {
        if (updates == null || updates.isEmpty()) {
            return;
        }
        Runnable sendAction = () -> {
            for (KdsOrderEventData data : updates) {
                KdsOrderEvent event = new KdsOrderEvent("UPDATE_STATUS", data);
                try {
                    messagingTemplate.convertAndSend(KDS_ORDERS_TOPIC, event);
                } catch (Exception ex) {
                    log.warn("Failed to publish STOMP UPDATE_STATUS event for item {}: {}",
                            data.id(), ex.getMessage());
                }
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
