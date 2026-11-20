package com.restaurantos.repository;

import com.restaurantos.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    @Query("""
        SELECT o FROM OrderEntity o
        WHERE EXISTS (
            SELECT 1 FROM OrderItemEntity oi
            WHERE oi.orderId = o.id
            AND oi.status IN ('WAITING', 'READY', 'REJECTED')
        )
        ORDER BY
            CASE WHEN EXISTS (
                SELECT 1 FROM OrderItemEntity oi2
                WHERE oi2.orderId = o.id
                AND oi2.allergyNote IS NOT NULL
                AND TRIM(oi2.allergyNote) <> ''
            ) THEN 0 ELSE 1 END ASC,
            (
                SELECT MIN(oi3.slaDeadline) FROM OrderItemEntity oi3
                WHERE oi3.orderId = o.id
                AND oi3.status IN ('WAITING', 'READY')
            ) ASC NULLS LAST,
            COALESCE(o.openedAt, o.createdAt) ASC
        """)
    List<OrderEntity> findActiveOrdersByPriority();
}
