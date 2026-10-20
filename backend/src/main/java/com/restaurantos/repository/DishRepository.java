package com.restaurantos.repository;

import com.restaurantos.entity.DishEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DishRepository extends JpaRepository<DishEntity, UUID> {
    List<DishEntity> findByCategory(String category);
    List<DishEntity> findByIsAvailableTrue();
}
