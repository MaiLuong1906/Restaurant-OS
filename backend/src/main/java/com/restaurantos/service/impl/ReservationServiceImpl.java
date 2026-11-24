package com.restaurantos.service.impl;

import com.restaurantos.dto.reservation.AvailableTableResponse;
import com.restaurantos.dto.reservation.CancelReservationRequest;
import com.restaurantos.dto.reservation.CreateReservationRequest;
import com.restaurantos.dto.reservation.DiningZoneResponse;
import com.restaurantos.dto.reservation.PosTableEvent;
import com.restaurantos.dto.reservation.ReservationResponse;
import com.restaurantos.dto.reservation.UpdateReservationRequest;
import com.restaurantos.entity.DiningZoneEntity;
import com.restaurantos.entity.RestaurantTableEntity;
import com.restaurantos.entity.TableReservationEntity;
import com.restaurantos.enums.DepositMethod;
import com.restaurantos.enums.ReservationStatus;
import com.restaurantos.enums.TableStatus;
import com.restaurantos.exception.BusinessException;
import com.restaurantos.exception.ResourceNotFoundException;
import com.restaurantos.repository.DiningZoneRepository;
import com.restaurantos.repository.RestaurantTableRepository;
import com.restaurantos.repository.TableReservationRepository;
import com.restaurantos.service.ReservationService;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    public static final Duration CONFLICT_WINDOW = Duration.ofHours(2);
    public static final String POS_TABLES_TOPIC = "/topic/pos/tables";
    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<ReservationStatus> ACTIVE_STATUSES =
            Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED);

    private final TableReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;
    private final DiningZoneRepository diningZoneRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<DiningZoneResponse> listDiningZones() {
        return diningZoneRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(zone -> new DiningZoneResponse(zone.getId(), zone.getName(), zone.getDisplayOrder()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableTableResponse> getAvailableTables(Instant reservationTime, Integer guestCount, UUID zoneId) {
        if (reservationTime == null) {
            throw BusinessException.badRequest("INVALID_RESERVATION_TIME", "Thời gian dự kiến đến không được để trống");
        }
        int requiredSeats = (guestCount == null || guestCount < 1) ? 1 : guestCount;

        List<RestaurantTableEntity> eligibleTables = (zoneId != null)
                ? tableRepository.findAllWithMinCapacityAndZone(requiredSeats, zoneId)
                : tableRepository.findAllWithMinCapacity(requiredSeats);

        Instant windowStart = reservationTime.minus(CONFLICT_WINDOW);
        Instant windowEnd = reservationTime.plus(CONFLICT_WINDOW);
        Set<UUID> conflictingTableIds =
                reservationRepository.findConflictingTableIds(windowStart, windowEnd, ACTIVE_STATUSES);

        boolean isImmediateWindow = reservationTime.isBefore(Instant.now().plus(CONFLICT_WINDOW));

        return eligibleTables.stream()
                .filter(table -> !conflictingTableIds.contains(table.getId()))
                .filter(table -> !isImmediateWindow || table.getStatus() == TableStatus.VACANT)
                .map(this::toAvailableTableResponse)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationResponse createReservation(CreateReservationRequest request, String idempotencyKey) {
        String normalizedKey = normalizeBlankToNull(idempotencyKey);
        if (normalizedKey != null) {
            Optional<TableReservationEntity> existing = reservationRepository.findByIdempotencyKey(normalizedKey);
            if (existing.isPresent()) {
                log.info("Idempotent replay detected for reservation key={}", normalizedKey);
                return toResponse(existing.get());
            }
        }

        long depositAmount = request.resolvedDepositAmount();
        DepositMethod depositMethod = validateAndResolveDepositMethod(depositAmount, request.depositMethod());

        RestaurantTableEntity table = tableRepository.findByIdForUpdate(request.tableId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + request.tableId()));

        validateTableForReservation(table, request.guestCount(), request.reservationTime(), null);

        TableReservationEntity entity = TableReservationEntity.builder()
                .table(table)
                .customerName(request.customerName().trim())
                .customerPhone(request.customerPhone().trim())
                .guestCount(request.guestCount())
                .reservationTime(request.reservationTime())
                .depositAmount(depositAmount)
                .depositMethod(depositMethod)
                .status(ReservationStatus.CONFIRMED)
                .notes(normalizeBlankToNull(request.notes()))
                .createdBy(request.createdBy())
                .idempotencyKey(normalizedKey)
                .build();

        TableReservationEntity saved = reservationRepository.save(entity);

        if (table.getStatus() == TableStatus.VACANT) {
            table.setStatus(TableStatus.RESERVED);
            tableRepository.save(table);
        }

        ReservationResponse response = toResponse(saved);
        publishPosTableEventAfterCommit("RESERVATION_CREATED", table, saved);
        log.info("Created reservation id={} table={} guests={} deposit={}VND",
                saved.getId(), table.getTableNumber(), saved.getGuestCount(), saved.getDepositAmount());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationResponse> listReservations(LocalDate date, ReservationStatus status, String search) {
        Specification<TableReservationEntity> spec = (root, query, cb) -> {
            if (query != null && !Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                root.fetch("table", JoinType.LEFT).fetch("zone", JoinType.LEFT);
                query.distinct(true);
            }

            List<Predicate> predicates = new ArrayList<>();

            if (date != null) {
                Instant dayStart = date.atStartOfDay(RESTAURANT_ZONE).toInstant();
                Instant dayEnd = date.plusDays(1).atStartOfDay(RESTAURANT_ZONE).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("reservationTime"), dayStart));
                predicates.add(cb.lessThan(root.get("reservationTime"), dayEnd));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            String keyword = normalizeBlankToNull(search);
            if (keyword != null) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("customerName")), pattern),
                        cb.like(cb.lower(root.get("customerPhone")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return reservationRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "reservationTime"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationResponse getReservationById(UUID id) {
        TableReservationEntity entity = reservationRepository.findByIdWithTableAndZone(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt bàn với ID: " + id));
        return toResponse(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationResponse updateReservation(UUID id, UpdateReservationRequest request) {
        TableReservationEntity reservation = reservationRepository.findByIdWithTableAndZone(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt bàn với ID: " + id));

        ensureEditableStatus(reservation);

        RestaurantTableEntity currentTable = reservation.getTable();
        UUID targetTableId = (request.tableId() != null)
                ? request.tableId()
                : (currentTable != null ? currentTable.getId() : null);

        if (targetTableId == null) {
            throw BusinessException.unprocessable("TABLE_NOT_ASSIGNED", "Đơn đặt bàn bắt buộc phải được gán một bàn cụ thể");
        }

        int newGuestCount = request.guestCount() != null ? request.guestCount() : reservation.getGuestCount();
        Instant newReservationTime = request.reservationTime() != null
                ? request.reservationTime()
                : reservation.getReservationTime();

        long newDepositAmount = request.depositAmount() != null
                ? request.depositAmount()
                : reservation.getDepositAmount();
        DepositMethod candidateMethod = request.depositMethod() != null
                ? request.depositMethod()
                : reservation.getDepositMethod();
        DepositMethod resolvedDepositMethod = validateAndResolveDepositMethod(newDepositAmount, candidateMethod);

        RestaurantTableEntity targetTable;
        RestaurantTableEntity previousTable = null;

        if (currentTable != null && !currentTable.getId().equals(targetTableId)) {
            // Khóa 2 bàn theo thứ tự UUID cố định để tránh deadlock
            UUID firstId = currentTable.getId().compareTo(targetTableId) < 0 ? currentTable.getId() : targetTableId;
            UUID secondId = firstId.equals(currentTable.getId()) ? targetTableId : currentTable.getId();

            RestaurantTableEntity first = tableRepository.findByIdForUpdate(firstId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + firstId));
            RestaurantTableEntity second = tableRepository.findByIdForUpdate(secondId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + secondId));

            previousTable = first.getId().equals(currentTable.getId()) ? first : second;
            targetTable = first.getId().equals(targetTableId) ? first : second;
        } else {
            targetTable = tableRepository.findByIdForUpdate(targetTableId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn với ID: " + targetTableId));
        }

        validateTableForReservation(targetTable, newGuestCount, newReservationTime, reservation.getId());

        if (request.customerName() != null) {
            String trimmedName = request.customerName().trim();
            if (trimmedName.isEmpty()) {
                throw BusinessException.badRequest("INVALID_CUSTOMER_NAME", "Họ tên khách hàng không được để trống");
            }
            reservation.setCustomerName(trimmedName);
        }
        if (request.customerPhone() != null) {
            reservation.setCustomerPhone(request.customerPhone().trim());
        }
        if (request.notes() != null) {
            reservation.setNotes(normalizeBlankToNull(request.notes()));
        }

        reservation.setTable(targetTable);
        reservation.setGuestCount(newGuestCount);
        reservation.setReservationTime(newReservationTime);
        reservation.setDepositAmount(newDepositAmount);
        reservation.setDepositMethod(resolvedDepositMethod);

        TableReservationEntity saved = reservationRepository.save(reservation);

        if (previousTable != null) {
            releaseTableIfUnused(previousTable, saved.getId());
            publishPosTableEventAfterCommit("TABLE_UPDATED", previousTable, saved);
        }

        if (targetTable.getStatus() == TableStatus.VACANT) {
            targetTable.setStatus(TableStatus.RESERVED);
            tableRepository.save(targetTable);
        }

        publishPosTableEventAfterCommit("RESERVATION_UPDATED", targetTable, saved);
        return toResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationResponse checkInReservation(UUID id) {
        TableReservationEntity reservation = reservationRepository.findByIdWithTableAndZone(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt bàn với ID: " + id));

        if (reservation.getStatus() == ReservationStatus.SEATED) {
            throw BusinessException.conflict("RESERVATION_ALREADY_SEATED", "Đơn đặt bàn này đã được check-in trước đó");
        }
        if (!ACTIVE_STATUSES.contains(reservation.getStatus())) {
            throw BusinessException.conflict(
                    "INVALID_RESERVATION_STATUS",
                    "Không thể check-in đơn đặt bàn ở trạng thái: " + reservation.getStatus()
            );
        }
        if (reservation.getTable() == null) {
            throw BusinessException.unprocessable("TABLE_NOT_ASSIGNED", "Đơn đặt bàn chưa được gán bàn cụ thể");
        }

        RestaurantTableEntity table = tableRepository.findByIdForUpdate(reservation.getTable().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bàn gắn với đơn đặt bàn"));

        if (table.getStatus() != TableStatus.RESERVED && table.getStatus() != TableStatus.VACANT) {
            throw BusinessException.conflict(
                    "TABLE_NOT_READY_FOR_CHECKIN",
                    "Bàn " + table.getTableNumber() + " hiện đang ở trạng thái " + table.getStatus() + ", chưa sẵn sàng check-in"
            );
        }

        Instant now = Instant.now();
        reservation.setStatus(ReservationStatus.SEATED);
        reservation.setCheckedInAt(now);
        TableReservationEntity saved = reservationRepository.save(reservation);

        table.setStatus(TableStatus.SERVING);
        table.setOccupiedAt(now);
        tableRepository.save(table);

        publishPosTableEventAfterCommit("RESERVATION_CHECKED_IN", table, saved);
        log.info("Checked in reservation id={} table={} deposit={}VND",
                saved.getId(), table.getTableNumber(), saved.getDepositAmount());
        return toResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationResponse cancelReservation(UUID id, CancelReservationRequest request) {
        TableReservationEntity reservation = reservationRepository.findByIdWithTableAndZone(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt bàn với ID: " + id));

        ensureEditableStatus(reservation);

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(Instant.now());
        if (request != null) {
            reservation.setCancelReason(normalizeBlankToNull(request.reason()));
        }

        TableReservationEntity saved = reservationRepository.save(reservation);
        RestaurantTableEntity lockedTable = releaseAssociatedTable(reservation);

        if (lockedTable != null) {
            publishPosTableEventAfterCommit("RESERVATION_CANCELLED", lockedTable, saved);
        }
        log.info("Cancelled reservation id={} reason={}", saved.getId(), saved.getCancelReason());
        return toResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReservationResponse markNoShow(UUID id) {
        TableReservationEntity reservation = reservationRepository.findByIdWithTableAndZone(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt bàn với ID: " + id));

        ensureEditableStatus(reservation);

        reservation.setStatus(ReservationStatus.NO_SHOW);
        TableReservationEntity saved = reservationRepository.save(reservation);
        RestaurantTableEntity lockedTable = releaseAssociatedTable(reservation);

        if (lockedTable != null) {
            publishPosTableEventAfterCommit("RESERVATION_NO_SHOW", lockedTable, saved);
        }
        log.info("Marked reservation id={} as NO_SHOW", saved.getId());
        return toResponse(saved);
    }

    private void ensureEditableStatus(TableReservationEntity reservation) {
        if (!ACTIVE_STATUSES.contains(reservation.getStatus())) {
            throw BusinessException.conflict(
                    "INVALID_RESERVATION_STATUS",
                    "Không thể thay đổi đơn đặt bàn đang ở trạng thái: " + reservation.getStatus()
            );
        }
    }

    private DepositMethod validateAndResolveDepositMethod(long depositAmount, DepositMethod method) {
        if (depositAmount < 0) {
            throw BusinessException.unprocessable("INVALID_DEPOSIT_AMOUNT", "Tiền cọc phải là số nguyên VND không âm");
        }
        if (depositAmount > 0 && method == null) {
            throw BusinessException.unprocessable(
                    "DEPOSIT_METHOD_REQUIRED",
                    "Vui lòng chọn phương thức thu tiền cọc (CASH, VIETQR hoặc CARD)"
            );
        }
        return depositAmount == 0 ? null : method;
    }

    private void validateTableForReservation(
            RestaurantTableEntity table,
            int guestCount,
            Instant reservationTime,
            UUID excludeReservationId
    ) {
        if (table.getCapacity() < guestCount) {
            throw BusinessException.unprocessable(
                    "INSUFFICIENT_TABLE_CAPACITY",
                    String.format("Bàn %s chỉ có sức chứa tối đa %d khách, không đủ cho %d khách",
                            table.getTableNumber(), table.getCapacity(), guestCount)
            );
        }

        Instant now = Instant.now();
        boolean isImmediateWindow = reservationTime.isBefore(now.plus(CONFLICT_WINDOW));
        boolean allowExistingReserved = excludeReservationId != null && table.getStatus() == TableStatus.RESERVED;

        if (isImmediateWindow && table.getStatus() != TableStatus.VACANT && !allowExistingReserved) {
            throw BusinessException.conflict(
                    "TABLE_NOT_VACANT",
                    "Bàn " + table.getTableNumber() + " hiện đang ở trạng thái " + table.getStatus() + ", không thể đặt ngay lúc này"
            );
        }

        Instant windowStart = reservationTime.minus(CONFLICT_WINDOW);
        Instant windowEnd = reservationTime.plus(CONFLICT_WINDOW);

        boolean hasConflict = (excludeReservationId == null)
                ? reservationRepository.existsConflictForTable(table.getId(), windowStart, windowEnd, ACTIVE_STATUSES)
                : reservationRepository.existsConflictForTableExcluding(
                        table.getId(), excludeReservationId, windowStart, windowEnd, ACTIVE_STATUSES);

        if (hasConflict) {
            throw BusinessException.conflict(
                    "RESERVATION_TIME_CONFLICT",
                    "Bàn " + table.getTableNumber() + " đã có lịch đặt trùng trong khung giờ ±2 tiếng"
            );
        }
    }

    private RestaurantTableEntity releaseAssociatedTable(TableReservationEntity reservation) {
        if (reservation.getTable() == null) {
            return null;
        }
        RestaurantTableEntity table = tableRepository.findByIdForUpdate(reservation.getTable().getId())
                .orElse(null);
        if (table != null) {
            releaseTableIfUnused(table, reservation.getId());
        }
        return table;
    }

    private void releaseTableIfUnused(RestaurantTableEntity table, UUID excludedReservationId) {
        if (table.getStatus() != TableStatus.RESERVED) {
            return;
        }
        boolean hasOtherUpcoming = reservationRepository.existsUpcomingActiveReservationForTable(
                table.getId(),
                excludedReservationId,
                ACTIVE_STATUSES,
                Instant.now().minus(CONFLICT_WINDOW)
        );
        if (!hasOtherUpcoming) {
            table.setStatus(TableStatus.VACANT);
            tableRepository.save(table);
        }
    }

    private void publishPosTableEventAfterCommit(
            String eventType,
            RestaurantTableEntity table,
            TableReservationEntity reservation
    ) {
        PosTableEvent event = new PosTableEvent(
                eventType,
                table.getId(),
                table.getTableNumber(),
                table.getStatus(),
                reservation.getId(),
                reservation.getStatus(),
                reservation.getDepositAmount(),
                reservation.getGuestCount(),
                Instant.now()
        );

        Runnable sendAction = () -> {
            try {
                messagingTemplate.convertAndSend(POS_TABLES_TOPIC, event);
            } catch (Exception ex) {
                log.warn("Failed to publish STOMP event {} for table {}: {}",
                        eventType, table.getTableNumber(), ex.getMessage());
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

    private AvailableTableResponse toAvailableTableResponse(RestaurantTableEntity table) {
        DiningZoneEntity zone = table.getZone();
        return new AvailableTableResponse(
                table.getId(),
                table.getTableNumber(),
                table.getCapacity(),
                table.getStatus(),
                zone != null ? zone.getId() : null,
                zone != null ? zone.getName() : null,
                table.getQrCodeToken()
        );
    }

    private ReservationResponse toResponse(TableReservationEntity entity) {
        RestaurantTableEntity table = entity.getTable();
        DiningZoneEntity zone = table != null ? table.getZone() : null;
        return new ReservationResponse(
                entity.getId(),
                table != null ? table.getId() : null,
                table != null ? table.getTableNumber() : null,
                table != null ? table.getCapacity() : null,
                table != null ? table.getStatus() : null,
                table != null ? table.getQrCodeToken() : null,
                zone != null ? zone.getId() : null,
                zone != null ? zone.getName() : null,
                entity.getCustomerName(),
                entity.getCustomerPhone(),
                entity.getGuestCount(),
                entity.getReservationTime(),
                entity.getDepositAmount(),
                entity.getDepositMethod(),
                entity.getStatus(),
                entity.getNotes(),
                entity.getCreatedBy(),
                entity.getCheckedInAt(),
                entity.getCancelledAt(),
                entity.getCancelReason(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalizeBlankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
