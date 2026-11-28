package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.DiningZoneEntity;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.DiningZoneRepository;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import com.restaurantos.repository.TableRepository;
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

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TableService {

    public static final String POS_TABLES_TOPIC = "/topic/pos/tables";

    private static final List<String> ACTIVE_ORDER_STATUSES = List.of("PLACED", "CONFIRMED", "SERVED");
    private static final Set<String> ALLOWED_TABLE_STATUSES =
            Set.of("VACANT", "RESERVED", "SERVING", "BILLING", "CLEANING");

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ObjectProvider<DiningZoneRepository> diningZoneRepositoryProvider;
    private final ObjectProvider<SimpMessagingTemplate> messagingTemplateProvider;

    /**
     * Lấy danh sách tất cả bàn trong nhà hàng kèm thông tin phân khu (zoneName) và đơn đang mở (currentOrderId).
     * Tối ưu gom active orders và zones để tránh N+1 query.
     */
    @Transactional(readOnly = true)
    public List<OrderDtos.TableResponse> getAllTables() {
        List<TableEntity> tables = tableRepository.findAll();
        List<OrderEntity> activeOrders = orderRepository.findByStatusIn(ACTIVE_ORDER_STATUSES);

        DiningZoneRepository zoneRepo = diningZoneRepositoryProvider != null
                ? diningZoneRepositoryProvider.getIfAvailable()
                : null;
        Map<UUID, String> zoneNameById = zoneRepo != null
                ? zoneRepo.findAll().stream()
                        .collect(Collectors.toMap(DiningZoneEntity::getId, DiningZoneEntity::getName, (a, b) -> a))
                : Collections.emptyMap();

        // Map tableId -> active OrderEntity (lấy order đầu tiên nếu có)
        Map<UUID, OrderEntity> tableOrderMap = activeOrders.stream()
                .filter(o -> o.getTableId() != null)
                .collect(Collectors.toMap(
                        OrderEntity::getTableId,
                        o -> o,
                        (existing, replacement) -> existing
                ));

        return tables.stream()
                .map(t -> {
                    OrderEntity order = tableOrderMap.get(t.getId());
                    UUID currentOrderId = order != null ? order.getId() : null;
                    Instant occupiedAt = order != null && order.getOpenedAt() != null
                            ? order.getOpenedAt()
                            : t.getOccupiedAt();
                    String zoneName = t.getZoneId() != null ? zoneNameById.get(t.getZoneId()) : null;
                    return toTableResponse(t, currentOrderId, zoneName, occupiedAt);
                })
                .toList();
    }

    /**
     * Lấy thông tin chi tiết một bàn theo UUID.
     */
    @Transactional(readOnly = true)
    public Optional<OrderDtos.TableResponse> getTableById(UUID id) {
        return tableRepository.findById(id).map(t -> {
            OrderEntity activeOrder = orderRepository.findByTableIdAndStatusIn(t.getId(), ACTIVE_ORDER_STATUSES)
                    .stream()
                    .findFirst()
                    .orElse(null);
            UUID currentOrderId = activeOrder != null ? activeOrder.getId() : null;
            Instant occupiedAt = activeOrder != null && activeOrder.getOpenedAt() != null
                    ? activeOrder.getOpenedAt()
                    : t.getOccupiedAt();
            String zoneName = resolveZoneName(t.getZoneId());
            return toTableResponse(t, currentOrderId, zoneName, occupiedAt);
        });
    }

    /**
     * Cập nhật trạng thái bàn với kiểm tra nghiệp vụ và chống race condition.
     * - Chặn chuyển về VACANT/CLEANING khi bàn vẫn còn đơn đang hoạt động hoặc còn món WAITING/READY chưa phục vụ.
     * - Chặn chuyển sang BILLING khi bàn đang VACANT hoặc CLEANING.
     * - Phát sự kiện STOMP /topic/pos/tables sau khi transaction commit thành công.
     */
    @Transactional
    public OrderDtos.TableResponse updateTableStatus(UUID tableId, String rawTargetStatus) {
        if (rawTargetStatus == null || rawTargetStatus.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái bàn không được để trống.");
        }
        String targetStatus = rawTargetStatus.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_TABLE_STATUSES.contains(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Trạng thái bàn không hợp lệ: " + rawTargetStatus);
        }

        TableEntity table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bàn: " + tableId));

        String currentStatus = table.getStatus() != null ? table.getStatus().toUpperCase(Locale.ROOT) : "VACANT";
        List<OrderEntity> activeOrders = orderRepository.findByTableIdAndStatusIn(tableId, ACTIVE_ORDER_STATUSES);
        OrderEntity firstActiveOrder = activeOrders.stream().findFirst().orElse(null);
        UUID currentOrderId = firstActiveOrder != null ? firstActiveOrder.getId() : null;
        String zoneName = resolveZoneName(table.getZoneId());

        if (currentStatus.equals(targetStatus)) {
            Instant occupiedAt = firstActiveOrder != null && firstActiveOrder.getOpenedAt() != null
                    ? firstActiveOrder.getOpenedAt()
                    : table.getOccupiedAt();
            return toTableResponse(table, currentOrderId, zoneName, occupiedAt);
        }

        // Chặn xung đột với luồng Đặt bàn (ReservationService)
        if ("RESERVED".equals(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể đặt cứng trạng thái RESERVED qua API này; vui lòng sử dụng luồng Đặt bàn (Reservation).");
        }
        if ("RESERVED".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bàn đang ở trạng thái đặt trước (RESERVED); vui lòng check-in hoặc hủy đặt bàn qua luồng Đặt bàn.");
        }

        // Khi còn đơn đang hoạt động: chỉ cho phép chuyển đổi giữa SERVING <-> BILLING
        if (!activeOrders.isEmpty()) {
            boolean allowedWhileActive =
                    ("SERVING".equals(currentStatus) && "BILLING".equals(targetStatus))
                            || ("BILLING".equals(currentStatus) && "SERVING".equals(targetStatus));
            if (!allowedWhileActive) {
                List<UUID> orderIds = activeOrders.stream().map(OrderEntity::getId).toList();
                List<OrderItemEntity> items = orderItemRepository != null
                        ? orderItemRepository.findByOrderIdIn(orderIds)
                        : Collections.emptyList();
                boolean hasUnservedItems = items.stream()
                        .anyMatch(i -> "WAITING".equalsIgnoreCase(i.getStatus())
                                || "READY".equalsIgnoreCase(i.getStatus()));
                if (hasUnservedItems) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Không thể chuyển bàn sang " + targetStatus + " khi vẫn còn món đang chờ bếp hoặc chưa phục vụ.");
                }
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể chuyển bàn sang " + targetStatus + " khi vẫn còn đơn hàng đang hoạt động chưa thanh toán.");
            }
        }

        if ("BILLING".equals(targetStatus) && !"SERVING".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể chuyển sang Chờ thanh toán (BILLING) khi bàn đang phục vụ (SERVING).");
        }

        if ("SERVING".equals(targetStatus) && "CLEANING".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bàn đang dọn dẹp (CLEANING), vui lòng chuyển sang Bàn trống (VACANT) trước khi mở phục vụ.");
        }

        Instant now = Instant.now();
        Instant nextOccupiedAt = switch (targetStatus) {
            case "SERVING" -> table.getOccupiedAt() != null ? table.getOccupiedAt() : now;
            case "VACANT", "CLEANING" -> null;
            default -> table.getOccupiedAt();
        };

        int updated = tableRepository.updateStatusIfMatches(tableId, currentStatus, targetStatus, nextOccupiedAt, now);
        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Trạng thái bàn đã bị thay đổi bởi thao tác khác. Vui lòng tải lại.");
        }

        table.setStatus(targetStatus);
        table.setOccupiedAt(nextOccupiedAt);
        table.setUpdatedAt(now);

        publishTableStatusEventAfterCommit(table, currentOrderId, now);

        Instant resolvedOccupiedAt = firstActiveOrder != null && firstActiveOrder.getOpenedAt() != null
                ? firstActiveOrder.getOpenedAt()
                : nextOccupiedAt;
        return toTableResponse(table, currentOrderId, zoneName, resolvedOccupiedAt);
    }

    private String resolveZoneName(UUID zoneId) {
        if (zoneId == null || diningZoneRepositoryProvider == null) {
            return null;
        }
        DiningZoneRepository zoneRepo = diningZoneRepositoryProvider.getIfAvailable();
        if (zoneRepo == null) {
            return null;
        }
        return zoneRepo.findById(zoneId).map(DiningZoneEntity::getName).orElse(null);
    }

    private void publishTableStatusEventAfterCommit(TableEntity table, UUID currentOrderId, Instant timestamp) {
        SimpMessagingTemplate template = messagingTemplateProvider != null
                ? messagingTemplateProvider.getIfAvailable()
                : null;
        if (template == null) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventType", "TABLE_STATUS_UPDATED");
        payload.put("type", "TABLE_STATUS_CHANGED");
        payload.put("tableId", table.getId());
        payload.put("tableNumber", table.getTableNumber());
        payload.put("status", table.getStatus());
        payload.put("tableStatus", table.getStatus());
        payload.put("currentOrderId", currentOrderId);
        payload.put("timestamp", timestamp);

        Runnable sendAction = () -> {
            try {
                template.convertAndSend(POS_TABLES_TOPIC, payload);
            } catch (Exception ex) {
                log.warn("Không thể gửi STOMP event TABLE_STATUS_UPDATED cho bàn {}: {}", table.getId(), ex.getMessage());
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

    private OrderDtos.TableResponse toTableResponse(
            TableEntity t,
            UUID currentOrderId,
            String zoneName,
            Instant occupiedAt
    ) {
        return new OrderDtos.TableResponse(
                t.getId(),
                t.getTableNumber(),
                t.getCapacity(),
                t.getStatus(),
                currentOrderId,
                t.getZoneId(),
                zoneName,
                occupiedAt
        );
    }
}
