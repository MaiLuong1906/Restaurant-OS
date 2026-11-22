package com.restaurantos.repository;

import com.restaurantos.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, UUID> {

    List<OrderItemEntity> findByOrderIdOrderByCreatedAtAsc(UUID orderId);

    List<OrderItemEntity> findByOrderIdInOrderByCreatedAtAsc(Collection<UUID> orderIds);

    @Query("""
        SELECT oi FROM OrderItemEntity oi
        WHERE oi.status IN ('WAITING', 'READY')
        ORDER BY oi.slaDeadline ASC NULLS LAST, oi.createdAt ASC
        """)
    List<OrderItemEntity> findActiveItems();
}
