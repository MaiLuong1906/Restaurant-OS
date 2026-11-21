package com.restaurantos.service;

import com.restaurantos.dto.reservation.*;
import com.restaurantos.entity.DiningZoneEntity;
import com.restaurantos.entity.RestaurantTableEntity;
import com.restaurantos.entity.TableReservationEntity;
import com.restaurantos.enums.DepositMethod;
import com.restaurantos.enums.ReservationStatus;
import com.restaurantos.enums.TableStatus;
import com.restaurantos.exception.BusinessException;
import com.restaurantos.repository.DiningZoneRepository;
import com.restaurantos.repository.RestaurantTableRepository;
import com.restaurantos.repository.TableReservationRepository;
import com.restaurantos.service.impl.ReservationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private TableReservationRepository reservationRepository;

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private DiningZoneRepository diningZoneRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private DiningZoneEntity mainZone;
    private RestaurantTableEntity table03;
    private UUID tableId;
    private Instant futureSlot;

    @BeforeEach
    void setUp() {
        tableId = UUID.randomUUID();
        mainZone = DiningZoneEntity.builder()
                .id(UUID.randomUUID())
                .name("Tầng 1 - Sảnh Chính")
                .displayOrder(1)
                .build();

        table03 = RestaurantTableEntity.builder()
                .id(tableId)
                .zone(mainZone)
                .tableNumber("Bàn 03")
                .qrCodeToken("token-table-03")
                .capacity(4)
                .status(TableStatus.VACANT)
                .build();

        futureSlot = Instant.now().plus(1, ChronoUnit.HOURS);
    }

    @Test
    void createReservation_withDeposit_marksTableReservedAndBroadcastsStomp() {
        CreateReservationRequest req = new CreateReservationRequest(
                tableId, "Nguyễn Minh Quân", "0903456789", 4, futureSlot,
                200000L, DepositMethod.VIETQR, "Sinh nhật", null
        );

        when(reservationRepository.findByIdempotencyKey("idem-001")).thenReturn(Optional.empty());
        when(tableRepository.findByIdForUpdate(tableId)).thenReturn(Optional.of(table03));
        when(reservationRepository.existsConflictForTable(eq(tableId), any(), any(), anySet())).thenReturn(false);
        when(reservationRepository.save(any(TableReservationEntity.class))).thenAnswer(inv -> {
            TableReservationEntity saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        ReservationResponse res = reservationService.createReservation(req, "idem-001");

        assertNotNull(res.id());
        assertEquals(ReservationStatus.CONFIRMED, res.status());
        assertEquals(200000L, res.depositAmount());
        assertEquals(TableStatus.RESERVED, table03.getStatus());
        verify(tableRepository).save(table03);
        verify(messagingTemplate).convertAndSend(eq(ReservationServiceImpl.POS_TABLES_TOPIC), any(PosTableEvent.class));
    }

    @Test
    void createReservation_idempotentReplay_returnsExistingWithoutDuplicating() {
        TableReservationEntity existing = TableReservationEntity.builder()
                .id(UUID.randomUUID())
                .table(table03)
                .customerName("Nguyễn Minh Quân")
                .customerPhone("0903456789")
                .guestCount(2)
                .reservationTime(futureSlot)
                .depositAmount(200000L)
                .depositMethod(DepositMethod.VIETQR)
                .status(ReservationStatus.CONFIRMED)
                .idempotencyKey("idem-dup")
                .build();

        when(reservationRepository.findByIdempotencyKey("idem-dup")).thenReturn(Optional.of(existing));

        CreateReservationRequest req = new CreateReservationRequest(
                tableId, "Nguyễn Minh Quân", "0903456789", 2, futureSlot,
                200000L, DepositMethod.VIETQR, null, null
        );

        ReservationResponse res = reservationService.createReservation(req, "idem-dup");

        assertEquals(existing.getId(), res.id());
        verify(reservationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void createReservation_insufficientCapacity_throwsUnprocessableEntity() {
        CreateReservationRequest req = new CreateReservationRequest(
                tableId, "Đoàn Khách Lớn", "0988112334", 8, futureSlot,
                0L, null, null, null
        );

        when(tableRepository.findByIdForUpdate(tableId)).thenReturn(Optional.of(table03));

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(req, null)
        );
        assertEquals("INSUFFICIENT_TABLE_CAPACITY", ex.getErrorCode());
    }

    @Test
    void createReservation_timeWindowConflict_throwsConflict() {
        CreateReservationRequest req = new CreateReservationRequest(
                tableId, "Lê Hoàng Nam", "0912345678", 2, futureSlot,
                0L, null, null, null
        );

        when(tableRepository.findByIdForUpdate(tableId)).thenReturn(Optional.of(table03));
        when(reservationRepository.existsConflictForTable(eq(tableId), any(), any(), anySet())).thenReturn(true);

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> reservationService.createReservation(req, null)
        );
        assertEquals("RESERVATION_TIME_CONFLICT", ex.getErrorCode());
    }

    @Test
    void checkInReservation_transitionsToSeatedAndTableServing() {
        table03.setStatus(TableStatus.RESERVED);
        UUID resId = UUID.randomUUID();
        TableReservationEntity entity = TableReservationEntity.builder()
                .id(resId)
                .table(table03)
                .customerName("Trần Thanh Hương")
                .customerPhone("0988112334")
                .guestCount(4)
                .reservationTime(futureSlot)
                .depositAmount(500000L)
                .depositMethod(DepositMethod.CASH)
                .status(ReservationStatus.CONFIRMED)
                .build();

        when(reservationRepository.findByIdWithTableAndZone(resId)).thenReturn(Optional.of(entity));
        when(tableRepository.findByIdForUpdate(tableId)).thenReturn(Optional.of(table03));
        when(reservationRepository.save(any(TableReservationEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse res = reservationService.checkInReservation(resId);

        assertEquals(ReservationStatus.SEATED, res.status());
        assertNotNull(res.checkedInAt());
        assertEquals(TableStatus.SERVING, table03.getStatus());
        assertNotNull(table03.getOccupiedAt());
        assertEquals("token-table-03", res.qrCodeToken());
        assertEquals(500000L, res.depositAmount());
        verify(messagingTemplate).convertAndSend(eq(ReservationServiceImpl.POS_TABLES_TOPIC), any(PosTableEvent.class));
    }

    @Test
    void cancelReservation_releasesReservedTableBackToVacant() {
        table03.setStatus(TableStatus.RESERVED);
        UUID resId = UUID.randomUUID();
        TableReservationEntity entity = TableReservationEntity.builder()
                .id(resId)
                .table(table03)
                .customerName("Khách Báo Hủy")
                .customerPhone("0909000111")
                .guestCount(2)
                .reservationTime(futureSlot)
                .depositAmount(0L)
                .status(ReservationStatus.CONFIRMED)
                .build();

        when(reservationRepository.findByIdWithTableAndZone(resId)).thenReturn(Optional.of(entity));
        when(reservationRepository.save(any(TableReservationEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tableRepository.findByIdForUpdate(tableId)).thenReturn(Optional.of(table03));
        when(reservationRepository.existsUpcomingActiveReservationForTable(eq(tableId), eq(resId), anySet(), any()))
                .thenReturn(false);

        ReservationResponse res = reservationService.cancelReservation(resId, new CancelReservationRequest("Khách đổi lịch"));

        assertEquals(ReservationStatus.CANCELLED, res.status());
        assertEquals("Khách đổi lịch", res.cancelReason());
        assertEquals(TableStatus.VACANT, table03.getStatus());
        verify(tableRepository).save(table03);
    }

    @Test
    void getAvailableTables_filtersOutConflictingTables() {
        when(tableRepository.findAllWithMinCapacity(4)).thenReturn(List.of(table03));
        when(reservationRepository.findConflictingTableIds(any(), any(), anySet())).thenReturn(Set.of());

        List<AvailableTableResponse> available = reservationService.getAvailableTables(futureSlot, 4, null);

        assertEquals(1, available.size());
        assertEquals("Bàn 03", available.get(0).tableNumber());
    }
}
