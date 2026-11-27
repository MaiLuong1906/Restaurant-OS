package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.dto.reservation.PosTableEvent;
import com.restaurantos.entity.DiningZoneEntity;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.enums.TableStatus;
import com.restaurantos.exception.BusinessException;
import com.restaurantos.repository.DiningZoneRepository;
import com.restaurantos.repository.OrderRepository;
import com.restaurantos.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableService {

    private static final List<String> ACTIVE_ORDER_STATUSES = List.of("PLACED", "CONFIRMED", "SERVED");
    private static final Set<String> ALLOWED_TABLE_STATUSES =
            Set.of("VACANT", "SERVING", "BILLING", "CLEANING", "RESERVED");
    private static final String POS_TABLES_TOPIC = "/topic/pos/tables";

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final DiningZoneRepository diningZoneRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy danh sách tất cả bàn trong nhà hàng kèm thông tin phân khu (zoneName) và đơn đang mở (currentOrderId).
     * Tối ưu gom active orders và zones để tránh N+1 query.
     */
    @Transactional(readOnly = true)
    public List<OrderDtos.TableResponse> getAllTables() {
        List<TableEntity> tables = tableRepository.findAll();
        List<OrderEntity> activeOrders = orderRepository.findByStatusIn(ACTIVE_ORDER_STATUSES);
        Map<UUID, String> zoneNameById = diningZoneRepository.findAll().stream()
                .collect(Collectors.toMap(DiningZoneEntity::getId, DiningZoneEntity::getName, (a, b) -> a));

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
                    Instant occupiedAt = order != null ? order.getOpenedAt() : null;
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
            Instant occupiedAt = activeOrder != null ? activeOrder.getOpenedAt() : null;
            String zoneName = t.getZoneId() != null
                    ? diningZoneRepository.findById(t.getZoneId()).map(DiningZoneEntity::getName).orElse(null)
                    : null;
            return toTableResponse(t, currentOrderId, zoneName, occupiedAt);
        });
    }

    /**
     * Cập nhật trạng thái bàn trên Sơ đồ bàn POS (Khóa bill BILLING, Mở khóa SERVING, Dọn xong VACANT, Cần dọn CLEANING)
     * và phát sự kiện STOMP /topic/pos/tables.
     */
    @Transactional
    public Optional<OrderDtos.TableResponse> updateTableStatus(UUID id, String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw BusinessException.badRequest("INVALID_TABLE_STATUS", "Trạng thái bàn không được để trống");
        }
        String normalized = rawStatus.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_TABLE_STATUSES.contains(normalized)) {
            throw BusinessException.badRequest(
                    "INVALID_TABLE_STATUS",
                    "Trạng thái bàn không hợp lệ: " + rawStatus + ". Chỉ chấp nhận: " + ALLOWED_TABLE_STATUSES
            );
        }

        return tableRepository.findById(id).map(t -> {
            t.setStatus(normalized);
            TableEntity saved = tableRepository.save(t);

            OrderEntity activeOrder = orderRepository.findByTableIdAndStatusIn(saved.getId(), ACTIVE_ORDER_STATUSES)
                    .stream()
                    .findFirst()
                    .orElse(null);
            UUID currentOrderId = activeOrder != null ? activeOrder.getId() : null;
            Instant occupiedAt = activeOrder != null ? activeOrder.getOpenedAt() : null;
            String zoneName = saved.getZoneId() != null
                    ? diningZoneRepository.findById(saved.getZoneId()).map(DiningZoneEntity::getName).orElse(null)
                    : null;

            try {
                TableStatus enumStatus = TableStatus.valueOf(normalized);
                PosTableEvent event = new PosTableEvent(
                        "TABLE_STATUS_CHANGED",
                        saved.getId(),
                        saved.getTableNumber(),
                        enumStatus,
                        null,
                        null,
                        null,
                        null,
                        Instant.now()
                );
                messagingTemplate.convertAndSend(POS_TABLES_TOPIC, event);
            } catch (Exception ignored) {
            }

            return toTableResponse(saved, currentOrderId, zoneName, occupiedAt);
        });
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
