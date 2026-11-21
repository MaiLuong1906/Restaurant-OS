package com.restaurantos.repository;

import com.restaurantos.entity.RestaurantTableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TableRepository extends JpaRepository<RestaurantTableEntity, UUID> {
}
