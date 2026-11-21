package com.restaurantos.repository;

import com.restaurantos.entity.TableReservationEntity;
import com.restaurantos.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface TableReservationRepository
        extends JpaRepository<TableReservationEntity, UUID>, JpaSpecificationExecutor<TableReservationEntity> {

    Optional<TableReservationEntity> findByIdempotencyKey(String idempotencyKey);

    @Query("""
            SELECT r FROM TableReservationEntity r
            LEFT JOIN FETCH r.table t
            LEFT JOIN FETCH t.zone
            WHERE r.id = :id
            """)
    Optional<TableReservationEntity> findByIdWithTableAndZone(@Param("id") UUID id);

    @Query("""
            SELECT DISTINCT r.table.id FROM TableReservationEntity r
            WHERE r.table IS NOT NULL
              AND r.status IN :activeStatuses
              AND r.reservationTime > :windowStart
              AND r.reservationTime < :windowEnd
            """)
    Set<UUID> findConflictingTableIds(
            @Param("windowStart") Instant windowStart,
            @Param("windowEnd") Instant windowEnd,
            @Param("activeStatuses") Collection<ReservationStatus> activeStatuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
            FROM TableReservationEntity r
            WHERE r.table.id = :tableId
              AND r.status IN :activeStatuses
              AND r.reservationTime > :windowStart
              AND r.reservationTime < :windowEnd
            """)
    boolean existsConflictForTable(
            @Param("tableId") UUID tableId,
            @Param("windowStart") Instant windowStart,
            @Param("windowEnd") Instant windowEnd,
            @Param("activeStatuses") Collection<ReservationStatus> activeStatuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
            FROM TableReservationEntity r
            WHERE r.table.id = :tableId
              AND r.id <> :excludeId
              AND r.status IN :activeStatuses
              AND r.reservationTime > :windowStart
              AND r.reservationTime < :windowEnd
            """)
    boolean existsConflictForTableExcluding(
            @Param("tableId") UUID tableId,
            @Param("excludeId") UUID excludeId,
            @Param("windowStart") Instant windowStart,
            @Param("windowEnd") Instant windowEnd,
            @Param("activeStatuses") Collection<ReservationStatus> activeStatuses
    );

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
            FROM TableReservationEntity r
            WHERE r.table.id = :tableId
              AND r.id <> :excludeId
              AND r.status IN :activeStatuses
              AND r.reservationTime >= :fromTime
            """)
    boolean existsUpcomingActiveReservationForTable(
            @Param("tableId") UUID tableId,
            @Param("excludeId") UUID excludeId,
            @Param("activeStatuses") Collection<ReservationStatus> activeStatuses,
            @Param("fromTime") Instant fromTime
    );
}
