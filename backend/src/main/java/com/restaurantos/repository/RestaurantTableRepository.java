package com.restaurantos.repository;

import com.restaurantos.entity.RestaurantTableEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTableEntity, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM RestaurantTableEntity t WHERE t.id = :id")
    Optional<RestaurantTableEntity> findByIdForUpdate(@Param("id") UUID id);

    @Query("""
            SELECT t FROM RestaurantTableEntity t
            JOIN FETCH t.zone z
            WHERE t.capacity >= :guestCount
            ORDER BY z.displayOrder ASC, t.capacity ASC, t.tableNumber ASC
            """)
    List<RestaurantTableEntity> findAllWithMinCapacity(@Param("guestCount") Integer guestCount);

    @Query("""
            SELECT t FROM RestaurantTableEntity t
            JOIN FETCH t.zone z
            WHERE t.capacity >= :guestCount
              AND z.id = :zoneId
            ORDER BY z.displayOrder ASC, t.capacity ASC, t.tableNumber ASC
            """)
    List<RestaurantTableEntity> findAllWithMinCapacityAndZone(
            @Param("guestCount") Integer guestCount,
            @Param("zoneId") UUID zoneId
    );
}
