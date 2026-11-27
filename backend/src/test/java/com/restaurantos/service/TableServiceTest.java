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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TableServiceTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private DiningZoneRepository diningZoneRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private TableService tableService;

    @Test
    void getAllTables_mapsZonesAndActiveOrders() {
        UUID zoneId = UUID.randomUUID();
        UUID tableId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Instant openedAt = Instant.now().minusSeconds(600);

        DiningZoneEntity zone = DiningZoneEntity.builder()
                .id(zoneId)
                .name("Tầng 2 - Phòng VIP")
                .displayOrder(2)
                .build();

        TableEntity table = TableEntity.builder()
                .id(tableId)
                .tableNumber("Bàn 07")
                .capacity(4)
                .status("SERVING")
                .zoneId(zoneId)
                .build();

        OrderEntity activeOrder = OrderEntity.builder()
                .id(orderId)
                .tableId(tableId)
                .status("PLACED")
                .openedAt(openedAt)
                .build();

        when(tableRepository.findAll()).thenReturn(List.of(table));
        when(orderRepository.findByStatusIn(any())).thenReturn(List.of(activeOrder));
        when(diningZoneRepository.findAll()).thenReturn(List.of(zone));

        List<OrderDtos.TableResponse> results = tableService.getAllTables();

        assertThat(results).hasSize(1);
        OrderDtos.TableResponse res = results.get(0);
        assertThat(res.id()).isEqualTo(tableId);
        assertThat(res.tableNumber()).isEqualTo("Bàn 07");
        assertThat(res.status()).isEqualTo("SERVING");
        assertThat(res.currentOrderId()).isEqualTo(orderId);
        assertThat(res.zoneName()).isEqualTo("Tầng 2 - Phòng VIP");
        assertThat(res.occupiedAt()).isEqualTo(openedAt);
    }

    @Test
    void updateTableStatus_validStatus_updatesDbAndPublishesStompEvent() {
        UUID zoneId = UUID.randomUUID();
        UUID tableId = UUID.randomUUID();

        TableEntity table = TableEntity.builder()
                .id(tableId)
                .tableNumber("Bàn 02")
                .capacity(4)
                .status("CLEANING")
                .zoneId(zoneId)
                .build();

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));
        when(tableRepository.save(any(TableEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepository.findByTableIdAndStatusIn(eq(tableId), any())).thenReturn(List.of());
        when(diningZoneRepository.findById(zoneId)).thenReturn(Optional.empty());

        Optional<OrderDtos.TableResponse> updated = tableService.updateTableStatus(tableId, "vacant");

        assertThat(updated).isPresent();
        assertThat(updated.get().status()).isEqualTo("VACANT");

        ArgumentCaptor<PosTableEvent> eventCaptor = ArgumentCaptor.forClass(PosTableEvent.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/pos/tables"), eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo("TABLE_STATUS_CHANGED");
        assertThat(eventCaptor.getValue().tableStatus()).isEqualTo(TableStatus.VACANT);
    }

    @Test
    void updateTableStatus_invalidStatus_throwsBusinessException() {
        UUID tableId = UUID.randomUUID();
        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "INVALID_STATE"))
                .isInstanceOf(BusinessException.class);
    }
}
