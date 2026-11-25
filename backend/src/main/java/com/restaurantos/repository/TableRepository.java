package com.restaurantos.repository;

import com.restaurantos.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TableRepository extends JpaRepository<TableEntity, UUID> {
    boolean existsByQrCodeToken(String qrCodeToken);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE TableEntity t
        SET t.status = :newStatus
        WHERE t.id = :tableId AND UPPER(t.status) = UPPER(:expectedStatus)
        """)
    int updateStatusIfMatches(
            @Param("tableId") UUID tableId,
            @Param("expectedStatus") String expectedStatus,
            @Param("newStatus") String newStatus);
}
