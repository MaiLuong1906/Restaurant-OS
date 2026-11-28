package com.restaurantos.service;

import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.DiningZoneEntity;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.DiningZoneRepository;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import com.restaurantos.repository.TableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TableServiceTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private DiningZoneRepository diningZoneRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ObjectProvider<DiningZoneRepository> diningZoneRepositoryProvider;

    @Mock
    private ObjectProvider<SimpMessagingTemplate> messagingTemplateProvider;

    private TableService tableService;

    @BeforeEach
    void setUp() {
        lenient().when(diningZoneRepositoryProvider.getIfAvailable()).thenReturn(diningZoneRepository);
        lenient().when(messagingTemplateProvider.getIfAvailable()).thenReturn(messagingTemplate);
        tableService = new TableService(
                tableRepository,
                orderRepository,
                orderItemRepository,
                diningZoneRepositoryProvider,
                messagingTemplateProvider
        );
    }

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
    @SuppressWarnings("unchecked")
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
        when(orderRepository.findByTableIdAndStatusIn(eq(tableId), any())).thenReturn(List.of());
        when(diningZoneRepository.findById(zoneId)).thenReturn(Optional.empty());
        when(tableRepository.updateStatusIfMatches(eq(tableId), eq("CLEANING"), eq("VACANT"), any(), any(Instant.class)))
                .thenReturn(1);

        OrderDtos.TableResponse updated = tableService.updateTableStatus(tableId, "vacant");

        assertThat(updated.status()).isEqualTo("VACANT");

        ArgumentCaptor<Map<String, Object>> eventCaptor = ArgumentCaptor.forClass(Map.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/pos/tables"), eventCaptor.capture());
        assertThat(eventCaptor.getValue()).containsEntry("eventType", "TABLE_STATUS_UPDATED");
        assertThat(eventCaptor.getValue()).containsEntry("type", "TABLE_STATUS_CHANGED");
        assertThat(eventCaptor.getValue()).containsEntry("status", "VACANT");
        assertThat(eventCaptor.getValue()).containsEntry("tableStatus", "VACANT");
    }

    @Test
    void updateTableStatus_invalidStatus_throwsBadRequest() {
        UUID tableId = UUID.randomUUID();
        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "INVALID_STATE"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void updateTableStatus_nullOrBlankStatus_throwsBadRequest() {
        UUID tableId = UUID.randomUUID();
        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "   "))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void updateTableStatus_nonExistentTable_throwsNotFound() {
        UUID tableId = UUID.randomUUID();
        when(tableRepository.findById(tableId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tableService.updateTableStatus(tableId, "VACANT"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.NOT_FOUND));
    }
}
