package com.restaurantos.service;

import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.dto.CompleteBatchRequest;
import com.restaurantos.dto.CompleteTicketRequest;
import com.restaurantos.dto.UpdateItemStatusRequest;
import com.restaurantos.entity.DishEntity;
import com.restaurantos.entity.OrderEntity;
import com.restaurantos.entity.OrderItemEntity;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.OrderItemRepository;
import com.restaurantos.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KdsServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private KdsService kdsService;

    private OrderEntity order;
    private TableEntity table;
    private DishEntity dish;
    private Instant now;

    @BeforeEach
    void setUp() {
        now = Instant.parse("2026-11-20T10:00:00Z");

        table = TableEntity.builder()
                .id(UUID.randomUUID())
                .tableNumber("Bàn 04")
                .capacity(4)
                .status("IDLE")
                .zoneId(UUID.randomUUID())
                .build();

        order = OrderEntity.builder()
                .id(UUID.randomUUID())
                .tableId(table.getId())
                .table(table)
                .status("PLACED")
                .totalAmount(100000L)
                .idempotencyKey("test-key")
                .openedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        dish = DishEntity.builder()
                .id(UUID.randomUUID())
                .name("Phở Bò Đặc Biệt")
                .price(75000L)
                .category("MAIN")
                .isAvailable(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    @Test
    @DisplayName("Ticket status derivation: [WAITING, READY] -> WAITING")
    void testDeriveStatus_waitingAndReady_returnsWaiting() {
        OrderItemEntity item1 = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItem("READY", null, now.plus(Duration.ofMinutes(5)));

        when(orderRepository.findActiveOrdersByPriority()).thenReturn(List.of(order));
        when(orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(List.of(order.getId()))).thenReturn(List.of(item1, item2));

        List<KdsTicketDto> tickets = kdsService.getTickets();

        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).status()).isEqualTo("WAITING");
    }

    @Test
    @DisplayName("Ticket status derivation: [READY, SERVED] -> READY")
    void testDeriveStatus_readyAndServed_returnsReady() {
        OrderItemEntity item1 = createItem("READY", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItem("SERVED", null, now.plus(Duration.ofMinutes(5)));

        when(orderRepository.findActiveOrdersByPriority()).thenReturn(List.of(order));
        when(orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(List.of(order.getId()))).thenReturn(List.of(item1, item2));

        List<KdsTicketDto> tickets = kdsService.getTickets();

        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).status()).isEqualTo("READY");
    }

    @Test
    @DisplayName("Ticket status derivation: [REJECTED, SERVED] -> REJECTED")
    void testDeriveStatus_rejectedAndServed_returnsRejected() {
        OrderItemEntity item1 = createItem("REJECTED", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItem("SERVED", null, now.plus(Duration.ofMinutes(5)));

        when(orderRepository.findActiveOrdersByPriority()).thenReturn(List.of(order));
        when(orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(List.of(order.getId()))).thenReturn(List.of(item1, item2));

        List<KdsTicketDto> tickets = kdsService.getTickets();

        assertThat(tickets).hasSize(1);
        assertThat(tickets.get(0).status()).isEqualTo("REJECTED");
    }

    @Test
    @DisplayName("Ticket status derivation: [SERVED, SERVED] -> SERVED")
    void testDeriveStatus_allServed_returnsServed() {
        OrderItemEntity item1 = createItem("SERVED", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItem("SERVED", null, now.plus(Duration.ofMinutes(5)));

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).thenReturn(List.of(item1, item2));

        Optional<KdsTicketDto> ticket = kdsService.getTicketById(order.getId());

        assertThat(ticket).isPresent();
        assertThat(ticket.get().status()).isEqualTo("SERVED");
    }

    @Test
    @DisplayName("Ticket SLA Deadline: minimum deadline among WAITING/READY items, ignoring REJECTED earlier deadline")
    void testCalculateSlaDeadline_ignoresRejectedItems() {
        Instant slaWaiting = now.plus(Duration.ofMinutes(12));
        Instant slaRejectedEarlier = now.plus(Duration.ofMinutes(3));

        OrderItemEntity itemWaiting = createItem("WAITING", null, slaWaiting);
        OrderItemEntity itemRejected = createItem("REJECTED", null, slaRejectedEarlier);

        when(orderRepository.findActiveOrdersByPriority()).thenReturn(List.of(order));
        when(orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(List.of(order.getId()))).thenReturn(List.of(itemWaiting, itemRejected));

        List<KdsTicketDto> tickets = kdsService.getTickets();

        assertThat(tickets.get(0).slaDeadline()).isEqualTo(slaWaiting);
    }

    @Test
    @DisplayName("Ticket SLA Deadline fallback: createdAt + 15 minutes when all WAITING/READY deadlines are null")
    void testCalculateSlaDeadline_fallbackTo15Minutes() {
        OrderItemEntity itemWaiting = createItem("WAITING", null, null);

        when(orderRepository.findActiveOrdersByPriority()).thenReturn(List.of(order));
        when(orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(List.of(order.getId()))).thenReturn(List.of(itemWaiting));

        List<KdsTicketDto> tickets = kdsService.getTickets();

        assertThat(tickets.get(0).slaDeadline()).isEqualTo(now.plus(Duration.ofMinutes(15)));
    }

    @Test
    @DisplayName("getTickets mapping rules: preserves order, maps tableNo, dishName, allergyNote -> allergy (handles null)")
    void testGetTickets_mappingIntegrity() {
        OrderItemEntity itemWithAllergy = createItem("WAITING", "Dị ứng lạc", now.plus(Duration.ofMinutes(10)));
        OrderItemEntity itemNoAllergy = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));

        when(orderRepository.findActiveOrdersByPriority()).thenReturn(List.of(order));
        when(orderItemRepository.findByOrderIdInOrderByCreatedAtAsc(List.of(order.getId()))).thenReturn(List.of(itemWithAllergy, itemNoAllergy));

        List<KdsTicketDto> tickets = kdsService.getTickets();

        assertThat(tickets).hasSize(1);
        KdsTicketDto ticket = tickets.get(0);
        assertThat(ticket.tableNo()).isEqualTo("Bàn 04");
        assertThat(ticket.items()).hasSize(2);
        assertThat(ticket.items().get(0).dishName()).isEqualTo("Phở Bò Đặc Biệt");
        assertThat(ticket.items().get(0).allergy()).isEqualTo("Dị ứng lạc");
        assertThat(ticket.items().get(1).allergy()).isNull();
    }

    @Test
    @DisplayName("getTicketById on missing ID returns Optional.empty()")
    void testGetTicketById_missingId_returnsEmpty() {
        UUID missingId = UUID.randomUUID();
        when(orderRepository.findById(missingId)).thenReturn(Optional.empty());

        Optional<KdsTicketDto> ticket = kdsService.getTicketById(missingId);

        assertThat(ticket).isEmpty();
    }

    @Test
    @DisplayName("getActiveItems maps every returned item correctly")
    void testGetActiveItems_mapsAll() {
        OrderItemEntity item = createItem("READY", "Không hành", now.plus(Duration.ofMinutes(8)));
        when(orderItemRepository.findActiveItems()).thenReturn(List.of(item));

        List<KdsItemDto> activeItems = kdsService.getActiveItems();

        assertThat(activeItems).hasSize(1);
        assertThat(activeItems.get(0).status()).isEqualTo("READY");
        assertThat(activeItems.get(0).dishName()).isEqualTo("Phở Bò Đặc Biệt");
    }

    @Test
    @DisplayName("K3 completeTicket: converts all WAITING items to READY, preserves READY and REJECTED")
    void testCompleteTicket_convertsWaitingItemsToReady() {
        OrderItemEntity item1 = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItem("READY", null, now.plus(Duration.ofMinutes(5)));
        OrderItemEntity item3 = createItem("REJECTED", null, null);

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).thenReturn(List.of(item1, item2, item3));

        Optional<KdsTicketDto> result = kdsService.completeTicket(order.getId(), null);

        assertThat(result).isPresent();
        assertThat(item1.getStatus()).isEqualTo("READY");
        assertThat(item2.getStatus()).isEqualTo("READY");
        assertThat(item3.getStatus()).isEqualTo("REJECTED");
        verify(orderItemRepository).saveAll(List.of(item1, item2, item3));
    }

    @Test
    @DisplayName("K3 completeTicket idempotent: when no WAITING items exist, no saveAll is triggered")
    void testCompleteTicket_idempotentWhenAlreadyReady() {
        OrderItemEntity item1 = createItem("READY", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItem("REJECTED", null, null);

        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).thenReturn(List.of(item1, item2));

        Optional<KdsTicketDto> result = kdsService.completeTicket(order.getId(), new CompleteTicketRequest("READY"));

        assertThat(result).isPresent();
        verify(orderItemRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("K4 updateItemStatus: WAITING -> READY valid transition")
    void testUpdateItemStatus_waitingToReady_success() {
        OrderItemEntity item = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        when(orderItemRepository.save(any(OrderItemEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<KdsItemDto> result = kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("READY", null));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo("READY");
        assertThat(item.getStatus()).isEqualTo("READY");
    }

    @Test
    @DisplayName("K4 updateItemStatus: WAITING -> REJECTED with valid reason (5-200 chars) succeeds")
    void testUpdateItemStatus_waitingToRejected_withValidReason_success() {
        OrderItemEntity item = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        when(orderItemRepository.save(any(OrderItemEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<KdsItemDto> result = kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("REJECTED", "Hết nguyên liệu"));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo("REJECTED");
        assertThat(item.getStatus()).isEqualTo("REJECTED");
    }

    @Test
    @DisplayName("K4 updateItemStatus: READY -> REJECTED with valid reason succeeds")
    void testUpdateItemStatus_readyToRejected_success() {
        OrderItemEntity item = createItem("READY", null, now.plus(Duration.ofMinutes(10)));
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));
        when(orderItemRepository.save(any(OrderItemEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<KdsItemDto> result = kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("REJECTED", "Khách đổi món khác"));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo("REJECTED");
    }

    @Test
    @DisplayName("K4 updateItemStatus: REJECTED without reason throws 400 Bad Request")
    void testUpdateItemStatus_rejectedWithoutReason_throws400() {
        OrderItemEntity item = createItem("WAITING", null, null);
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("REJECTED", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    @Test
    @DisplayName("K4 updateItemStatus: REJECTED with reason < 5 chars throws 400 Bad Request")
    void testUpdateItemStatus_rejectedReasonTooShort_throws400() {
        OrderItemEntity item = createItem("WAITING", null, null);
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("REJECTED", "1234")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    @Test
    @DisplayName("K4 updateItemStatus: invalid transition READY -> WAITING throws 409 Conflict")
    void testUpdateItemStatus_readyToWaiting_throws409() {
        OrderItemEntity item = createItem("READY", null, null);
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("WAITING", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT");
    }

    @Test
    @DisplayName("K4 updateItemStatus: attempting SERVED transition throws 409 Conflict")
    void testUpdateItemStatus_servedTarget_throws409() {
        OrderItemEntity item = createItem("READY", null, null);
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("SERVED", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT");
    }

    @Test
    @DisplayName("K4 updateItemStatus idempotent: calling with same status returns entity without saving")
    void testUpdateItemStatus_idempotent_returnsCurrent() {
        OrderItemEntity item = createItem("READY", null, null);
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        Optional<KdsItemDto> result = kdsService.updateItemStatus(item.getId(), new UpdateItemStatusRequest("READY", null));

        assertThat(result).isPresent();
        assertThat(result.get().status()).isEqualTo("READY");
        verify(orderItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("K5 completeBatch: batch of 2 WAITING items across 2 tickets converts both to READY and returns 2 tickets")
    void testCompleteBatch_twoWaitingItemsAcrossTwoTickets_updatesBothAndReturnsTwoTickets() {
        OrderEntity order2 = OrderEntity.builder()
                .id(UUID.randomUUID())
                .tableId(table.getId())
                .table(table)
                .status("PLACED")
                .totalAmount(75000L)
                .idempotencyKey("test-key-2")
                .openedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        OrderItemEntity item1 = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity item2 = createItemForOrder(order2, "WAITING", null, now.plus(Duration.ofMinutes(12)));

        List<UUID> itemIds = List.of(item1.getId(), item2.getId());
        when(orderItemRepository.findAllById(itemIds)).thenReturn(List.of(item1, item2));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).thenReturn(List.of(item1));
        when(orderRepository.findById(order2.getId())).thenReturn(Optional.of(order2));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order2.getId())).thenReturn(List.of(item2));

        Optional<List<KdsTicketDto>> result = kdsService.completeBatch(new CompleteBatchRequest(itemIds));

        assertThat(result).isPresent();
        assertThat(result.get()).hasSize(2);
        assertThat(item1.getStatus()).isEqualTo("READY");
        assertThat(item2.getStatus()).isEqualTo("READY");
        verify(orderItemRepository).saveAll(List.of(item1, item2));
    }

    @Test
    @DisplayName("K5 completeBatch idempotent: calling again with already READY items returns 200 without calling saveAll")
    void testCompleteBatch_idempotentWhenAlreadyReady_doesNotCallSaveAll() {
        OrderItemEntity item1 = createItem("READY", null, now.plus(Duration.ofMinutes(10)));
        List<UUID> itemIds = List.of(item1.getId());

        when(orderItemRepository.findAllById(itemIds)).thenReturn(List.of(item1));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).thenReturn(List.of(item1));

        Optional<List<KdsTicketDto>> result = kdsService.completeBatch(new CompleteBatchRequest(itemIds));

        assertThat(result).isPresent();
        assertThat(result.get()).hasSize(1);
        assertThat(result.get().get(0).status()).isEqualTo("READY");
        verify(orderItemRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("K5 completeBatch: list containing a REJECTED item throws 409 Conflict and does not modify WAITING items")
    void testCompleteBatch_containsRejectedItem_throws409AndDoesNotSave() {
        OrderItemEntity waitingItem = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity rejectedItem = createItem("REJECTED", null, null);
        List<UUID> itemIds = List.of(waitingItem.getId(), rejectedItem.getId());

        when(orderItemRepository.findAllById(itemIds)).thenReturn(List.of(waitingItem, rejectedItem));

        assertThatThrownBy(() -> kdsService.completeBatch(new CompleteBatchRequest(itemIds)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT")
                .hasMessageContaining("REJECTED");

        assertThat(waitingItem.getStatus()).isEqualTo("WAITING");
        verify(orderItemRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("K5 completeBatch: list containing a SERVED item throws 409 Conflict and does not call saveAll")
    void testCompleteBatch_containsServedItem_throws409AndDoesNotSave() {
        OrderItemEntity waitingItem = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity servedItem = createItem("SERVED", null, null);
        List<UUID> itemIds = List.of(waitingItem.getId(), servedItem.getId());

        when(orderItemRepository.findAllById(itemIds)).thenReturn(List.of(waitingItem, servedItem));

        assertThatThrownBy(() -> kdsService.completeBatch(new CompleteBatchRequest(itemIds)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT")
                .hasMessageContaining("SERVED");

        assertThat(waitingItem.getStatus()).isEqualTo("WAITING");
        verify(orderItemRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("K5 completeBatch: missing itemId returns Optional.empty() (404)")
    void testCompleteBatch_missingItemId_returnsEmpty() {
        OrderItemEntity existingItem = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        UUID missingId = UUID.randomUUID();
        List<UUID> itemIds = List.of(existingItem.getId(), missingId);

        when(orderItemRepository.findAllById(itemIds)).thenReturn(List.of(existingItem));

        Optional<List<KdsTicketDto>> result = kdsService.completeBatch(new CompleteBatchRequest(itemIds));

        assertThat(result).isEmpty();
        assertThat(existingItem.getStatus()).isEqualTo("WAITING");
        verify(orderItemRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("K5 completeBatch: mixed WAITING + READY items converts only WAITING and returns distinct tickets")
    void testCompleteBatch_mixedWaitingAndReady_updatesOnlyWaitingAndReturnsTickets() {
        Instant originalUpdatedAt = now.minus(Duration.ofMinutes(5));
        OrderItemEntity waitingItem = createItem("WAITING", null, now.plus(Duration.ofMinutes(10)));
        OrderItemEntity readyItem = createItem("READY", null, now.plus(Duration.ofMinutes(8)));
        readyItem.setUpdatedAt(originalUpdatedAt);

        List<UUID> itemIds = List.of(waitingItem.getId(), readyItem.getId());
        when(orderItemRepository.findAllById(itemIds)).thenReturn(List.of(waitingItem, readyItem));
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdOrderByCreatedAtAsc(order.getId())).thenReturn(List.of(waitingItem, readyItem));

        Optional<List<KdsTicketDto>> result = kdsService.completeBatch(new CompleteBatchRequest(itemIds));

        assertThat(result).isPresent();
        assertThat(result.get()).hasSize(1);
        assertThat(waitingItem.getStatus()).isEqualTo("READY");
        assertThat(readyItem.getStatus()).isEqualTo("READY");
        assertThat(readyItem.getUpdatedAt()).isEqualTo(originalUpdatedAt);
        verify(orderItemRepository).saveAll(List.of(waitingItem, readyItem));
    }

    private OrderItemEntity createItem(String status, String allergyNote, Instant slaDeadline) {
        return createItemForOrder(order, status, allergyNote, slaDeadline);
    }

    private OrderItemEntity createItemForOrder(OrderEntity targetOrder, String status, String allergyNote, Instant slaDeadline) {
        return OrderItemEntity.builder()
                .id(UUID.randomUUID())
                .orderId(targetOrder.getId())
                .order(targetOrder)
                .dishId(dish.getId())
                .portionId(UUID.randomUUID())
                .dishNameSnapshot("Phở Bò Đặc Biệt")
                .portionNameSnapshot("Tô Lớn")
                .dish(dish)
                .quantity(1)
                .unitPrice(75000L)
                .modifiers("[]")
                .status(status)
                .notes("Ghi chú")
                .allergyNote(allergyNote)
                .slaDeadline(slaDeadline)
                .isExpedited(false)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
