package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.OrderRepository;
import com.restaurantos.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TableService {

    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;

    private static final List<String> ACTIVE_ORDER_STATUSES = List.of("PLACED", "CONFIRMED", "SERVED");

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
