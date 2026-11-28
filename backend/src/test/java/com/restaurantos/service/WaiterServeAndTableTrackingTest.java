package com.restaurantos.service;

import com.restaurantos.common.enums.Permission;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.controller.OrderController;
import com.restaurantos.controller.TableController;
import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.DishPortionRepository;
import com.restaurantos.repository.DishRepository;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import com.restaurantos.repository.TableRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WaiterServeAndTableTrackingTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private TableRepository tableRepository;
    @Mock
    private DishRepository dishRepository;
    @Mock
    private DishPortionRepository dishPortionRepository;

    @InjectMocks
    private OrderService orderService;

    @InjectMocks
    private TableService tableService;

    private OrderItemEntity buildItem(UUID orderId, String name, String status) {
        return OrderItemEntity.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .dishId(UUID.randomUUID())
                .portionId(UUID.randomUUID())
                .dishNameSnapshot(name)
                .portionNameSnapshot("Tiêu chuẩn")
                .quantity(1)
                .unitPrice(85000L)
                .status(status)
                .isExpedited(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("1. Waiter giao thành công một món đã hoàn thành (READY -> SERVED)")
    void serveOrderItem_whenReady_updatesToServed() {
        UUID orderId = UUID.randomUUID();
        OrderItemEntity item = buildItem(orderId, "Phở Bò", "READY");
        OrderEntity order = OrderEntity.builder()
                .id(orderId).tableId(UUID.randomUUID()).status("PLACED").totalAmount(85000L).build();

        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        when(orderItemRepository.markAsServedIfReady(eq(item.getId()), any(Instant.class))).thenReturn(1);
        when(orderItemRepository.findByOrderId(orderId)).thenReturn(List.of(
                OrderItemEntity.builder().id(item.getId()).orderId(orderId).status("SERVED").build()
        ));
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        OrderDtos.OrderItemResponse response = orderService.serveOrderItem(item.getId());

        assertThat(response.status()).isEqualTo("SERVED");
        assertThat(order.getStatus()).isEqualTo("SERVED");
        verify(orderItemRepository).markAsServedIfReady(eq(item.getId()), any(Instant.class));
        verify(orderRepository).save(order);
        verify(tableRepository, never()).save(any());
    }

    @Test
    @DisplayName("2. Waiter không thể giao món đang chế biến (WAITING -> 409 CONFLICT)")
    void serveOrderItem_whenWaiting_throwsConflict() {
        OrderItemEntity item = buildItem(UUID.randomUUID(), "Nem Rán", "WAITING");
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> orderService.serveOrderItem(item.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        verify(orderItemRepository, never()).markAsServedIfReady(any(), any());
    }

    @Test
    @DisplayName("3. Không thể giao trùng một món đã SERVED (-> 409 CONFLICT)")
    void serveOrderItem_whenAlreadyServed_throwsConflict() {
        OrderItemEntity item = buildItem(UUID.randomUUID(), "Trà Sen", "SERVED");
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> orderService.serveOrderItem(item.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        verify(orderItemRepository, never()).markAsServedIfReady(any(), any());
    }

    @Test
    @DisplayName("4. Giao từng món trong đơn có nhiều món: chỉ 1 món SERVED thì đơn vẫn giữ PLACED")
    void serveOrderItem_partialOrder_keepsOrderPlaced() {
        UUID orderId = UUID.randomUUID();
        OrderItemEntity readyItem = buildItem(orderId, "Gỏi Ngó Sen", "READY");
        OrderItemEntity waitingItem = buildItem(orderId, "Lẩu Riêu Cua", "WAITING");

        when(orderItemRepository.findById(readyItem.getId())).thenReturn(Optional.of(readyItem));
        when(orderItemRepository.markAsServedIfReady(eq(readyItem.getId()), any(Instant.class))).thenReturn(1);
        when(orderItemRepository.findByOrderId(orderId)).thenReturn(List.of(
                OrderItemEntity.builder().id(readyItem.getId()).orderId(orderId).status("SERVED").build(),
                waitingItem
        ));

        OrderDtos.OrderItemResponse response = orderService.serveOrderItem(readyItem.getId());

        assertThat(response.status()).isEqualTo("SERVED");
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Xử lý concurrent update khi 2 thao tác giao cùng 1 món đồng thời (-> 409 CONFLICT)")
    void serveOrderItem_concurrentRaceCondition_throwsConflict() {
        OrderItemEntity item = buildItem(UUID.randomUUID(), "Bò Nướng", "READY");
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        when(orderItemRepository.markAsServedIfReady(eq(item.getId()), any(Instant.class))).thenReturn(0);

        assertThatThrownBy(() -> orderService.serveOrderItem(item.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @DisplayName("6. Không thể giải phóng bàn (VACANT) khi vẫn còn món chưa phục vụ (-> 409 CONFLICT)")
    void updateTableStatus_toVacantWithUnservedItems_throwsConflict() {
        UUID tableId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        TableEntity table = TableEntity.builder()
                .id(tableId).tableNumber("B01").capacity(4).status("SERVING").zoneId(UUID.randomUUID()).build();
        OrderEntity activeOrder = OrderEntity.builder()
                .id(orderId).tableId(tableId).status("PLACED").build();
        OrderItemEntity waitingItem = buildItem(orderId, "Phở Bò", "WAITING");

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));
        when(orderRepository.findByTableIdAndStatusIn(eq(tableId), any())).thenReturn(List.of(activeOrder));
        when(orderItemRepository.findByOrderIdIn(List.of(orderId))).thenReturn(List.of(waitingItem));

        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "VACANT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(rse.getReason()).contains("món");
                });

        verify(tableRepository, never()).updateStatusIfMatches(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("7. Cập nhật trạng thái bàn hợp lệ (SERVING -> BILLING) và chống concurrent update")
    void updateTableStatus_servingToBilling_succeedsAndHandlesConcurrency() {
        UUID tableId = UUID.randomUUID();
        TableEntity table = TableEntity.builder()
                .id(tableId).tableNumber("B02").capacity(4).status("SERVING").zoneId(UUID.randomUUID()).build();

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));
        when(orderRepository.findByTableIdAndStatusIn(eq(tableId), any())).thenReturn(List.of());
        when(tableRepository.updateStatusIfMatches(eq(tableId), eq("SERVING"), eq("BILLING"), any(), any(Instant.class))).thenReturn(1);

        OrderDtos.TableResponse response = tableService.updateTableStatus(tableId, "BILLING");
        assertThat(response.status()).isEqualTo("BILLING");

        // Concurrent update returns 0 rows -> 409 CONFLICT
        table.setStatus("SERVING");
        when(tableRepository.updateStatusIfMatches(eq(tableId), eq("SERVING"), eq("BILLING"), any(), any(Instant.class))).thenReturn(0);
        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "BILLING"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    @DisplayName("8. RBAC: Endpoint giao món & cập nhật bàn có @PreAuthorize đúng Permission, CHEF/STAFF không có quyền")
    void rbac_serveAndTableStatusEndpoints_enforcedByPermissions() throws NoSuchMethodException {
        Method serveMethod = OrderController.class.getMethod("serveOrderItem", String.class);
        PreAuthorize serveAuth = serveMethod.getAnnotation(PreAuthorize.class);
        assertThat(serveAuth).isNotNull();
        assertThat(serveAuth.value()).contains("ORDER:ITEM_SERVE_EXPEDITE:UPDATE");

        Method tableStatusMethod = TableController.class.getMethod(
                "updateTableStatus", String.class, OrderDtos.UpdateTableStatusRequest.class);
        PreAuthorize tableAuth = tableStatusMethod.getAnnotation(PreAuthorize.class);
        assertThat(tableAuth).isNotNull();
        assertThat(tableAuth.value()).contains("TABLE:STATE:UPDATE");

        // WAITER có cả 2 quyền
        assertThat(UserRole.WAITER.getPermissions()).contains(
                Permission.ORDER_ITEM_SERVE_EXPEDITE_UPDATE,
                Permission.TABLE_STATE_UPDATE);

        // CHEF và STAFF không có quyền giao món hay đổi trạng thái bàn
        assertThat(UserRole.CHEF.getPermissions()).doesNotContain(
                Permission.ORDER_ITEM_SERVE_EXPEDITE_UPDATE,
                Permission.TABLE_STATE_UPDATE);
        assertThat(UserRole.STAFF.getPermissions()).doesNotContain(
                Permission.ORDER_ITEM_SERVE_EXPEDITE_UPDATE,
                Permission.TABLE_STATE_UPDATE);
    }

    @Test
    @DisplayName("9. Table State Machine: chặn CLEANING khi còn đơn active, chặn RESERVED từ SERVING, chặn SERVING từ CLEANING")
    void updateTableStatus_invalidTransitions_throwConflict() {
        UUID tableId = UUID.randomUUID();
        TableEntity servingTable = TableEntity.builder()
                .id(tableId).tableNumber("B03").capacity(4).status("SERVING").zoneId(UUID.randomUUID()).build();
        OrderEntity activeOrder = OrderEntity.builder()
                .id(UUID.randomUUID()).tableId(tableId).status("SERVED").build();

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(servingTable));
        when(orderRepository.findByTableIdAndStatusIn(eq(tableId), any())).thenReturn(List.of(activeOrder));
        when(orderItemRepository.findByOrderIdIn(any())).thenReturn(List.of());

        // Chặn chuyển CLEANING khi còn đơn active chưa thanh toán
        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "CLEANING"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        // Chặn chuyển RESERVED từ bàn đang SERVING
        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "RESERVED"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        // Chặn chuyển SERVING trực tiếp từ bàn đang CLEANING
        TableEntity cleaningTable = TableEntity.builder()
                .id(tableId).tableNumber("B03").capacity(4).status("CLEANING").zoneId(UUID.randomUUID()).build();
        when(tableRepository.findById(tableId)).thenReturn(Optional.of(cleaningTable));
        when(orderRepository.findByTableIdAndStatusIn(eq(tableId), any())).thenReturn(List.of());

        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "SERVING"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }
}
