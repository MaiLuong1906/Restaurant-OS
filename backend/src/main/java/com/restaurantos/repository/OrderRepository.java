package com.restaurantos.repository;

import com.restaurantos.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    Optional<OrderEntity> findByIdempotencyKey(String idempotencyKey);

    List<OrderEntity> findByTableId(UUID tableId);

    List<OrderEntity> findByTableIdAndStatusIn(UUID tableId, List<String> statuses);

    List<OrderEntity> findByStatusIn(List<String> statuses);
}
