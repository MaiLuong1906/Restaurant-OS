package com.restaurantos.repository;

import com.restaurantos.entity.OrderItemVoidEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemVoidRepository extends JpaRepository<OrderItemVoidEntity, UUID> {

    @Query("""
            SELECT v FROM OrderItemVoidEntity v
            JOIN FETCH v.orderItem oi
            JOIN FETCH oi.order o
            LEFT JOIN FETCH o.table t
            ORDER BY v.approvedAt DESC
            """)
    List<OrderItemVoidEntity> findAllWithOrderDetailsOrderByApprovedAtDesc();
}
