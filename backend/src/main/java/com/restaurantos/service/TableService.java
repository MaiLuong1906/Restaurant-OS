package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import com.restaurantos.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableService {

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private static final List<String> ACTIVE_ORDER_STATUSES = List.of("PLACED", "CONFIRMED", "SERVED");
    private static final Set<String> ALLOWED_TABLE_STATUSES = Set.of("VACANT", "RESERVED", "SERVING", "BILLING", "CLEANING");

    /**
     * Lấy danh sách tất cả bàn trong nhà hàng.
     * Tối ưu gom active orders để tránh N+1 query khi tra cứu currentOrderId.
     */
    @Transactional(readOnly = true)
    public List<OrderDtos.TableResponse> getAllTables() {
        List<TableEntity> tables = tableRepository.findAll();
        List<OrderEntity> activeOrders = orderRepository.findByStatusIn(ACTIVE_ORDER_STATUSES);

        // Map tableId -> currentOrderId (lấy order đầu tiên nếu có)
        Map<UUID, UUID> tableOrderMap = activeOrders.stream()
                .filter(o -> o.getTableId() != null)
                .collect(Collectors.toMap(
                        OrderEntity::getTableId,
                        OrderEntity::getId,
                        (existing, replacement) -> existing
                ));

        return tables.stream()
                .map(t -> toTableResponse(t, tableOrderMap.get(t.getId())))
                .toList();
    }

    /**
     * Lấy thông tin chi tiết một bàn theo UUID.
     */
    @Transactional(readOnly = true)
    public Optional<OrderDtos.TableResponse> getTableById(UUID id) {
        return tableRepository.findById(id).map(t -> {
            UUID currentOrderId = orderRepository.findByTableIdAndStatusIn(t.getId(), ACTIVE_ORDER_STATUSES)
                    .stream()
                    .findFirst()
                    .map(OrderEntity::getId)
                    .orElse(null);
            return toTableResponse(t, currentOrderId);
        });
    }

    /**
     * Cập nhật trạng thái bàn với kiểm tra nghiệp vụ và chống race condition.
     * - Chặn chuyển về VACANT khi bàn vẫn còn đơn đang hoạt động hoặc còn món WAITING/READY chưa phục vụ.
     * - Chặn chuyển sang BILLING khi bàn đang VACANT hoặc CLEANING.
     */
    @Transactional
    public OrderDtos.TableResponse updateTableStatus(UUID tableId, String rawTargetStatus) {
        if (rawTargetStatus == null || rawTargetStatus.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái bàn không được để trống.");
        }
        String targetStatus = rawTargetStatus.trim().toUpperCase();
        if (!ALLOWED_TABLE_STATUSES.contains(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Trạng thái bàn không hợp lệ: " + rawTargetStatus);
        }

        TableEntity table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Không tìm thấy bàn: " + tableId));

        String currentStatus = table.getStatus() != null ? table.getStatus().toUpperCase() : "VACANT";
        List<OrderEntity> activeOrders = orderRepository.findByTableIdAndStatusIn(tableId, ACTIVE_ORDER_STATUSES);
        UUID currentOrderId = activeOrders.stream().findFirst().map(OrderEntity::getId).orElse(null);

        if (currentStatus.equals(targetStatus)) {
            return toTableResponse(table, currentOrderId);
        }

        if ("VACANT".equals(targetStatus)) {
            if (!activeOrders.isEmpty()) {
                List<UUID> orderIds = activeOrders.stream().map(OrderEntity::getId).toList();
                List<OrderItemEntity> items = orderItemRepository.findByOrderIdIn(orderIds);
                boolean hasUnservedItems = items.stream()
                        .anyMatch(i -> "WAITING".equalsIgnoreCase(i.getStatus())
                                || "READY".equalsIgnoreCase(i.getStatus()));
                if (hasUnservedItems) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Không thể giải phóng bàn khi vẫn còn món đang chờ bếp hoặc chưa phục vụ.");
                }
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Không thể giải phóng bàn khi vẫn còn đơn hàng đang hoạt động chưa thanh toán.");
            }
        }

        if ("BILLING".equals(targetStatus) && !"SERVING".equals(currentStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể chuyển sang Chờ thanh toán (BILLING) khi bàn đang phục vụ (SERVING).");
        }

        int updated = tableRepository.updateStatusIfMatches(tableId, currentStatus, targetStatus);
        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Trạng thái bàn đã bị thay đổi bởi thao tác khác. Vui lòng tải lại.");
        }

        table.setStatus(targetStatus);
        return toTableResponse(table, currentOrderId);
    }

    private OrderDtos.TableResponse toTableResponse(TableEntity t, UUID currentOrderId) {
        return new OrderDtos.TableResponse(
                t.getId(),
                t.getTableNumber(),
                t.getCapacity(),
                t.getStatus(),
                currentOrderId
        );
    }
}
