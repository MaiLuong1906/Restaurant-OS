package com.restaurantos.service;

import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
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

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
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

    private OrderItemEntity createItem(String status, String allergyNote, Instant slaDeadline) {
        return OrderItemEntity.builder()
                .id(UUID.randomUUID())
                .orderId(order.getId())
                .order(order)
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
