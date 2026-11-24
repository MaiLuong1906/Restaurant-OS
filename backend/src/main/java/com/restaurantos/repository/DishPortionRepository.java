package com.restaurantos.repository;

import com.restaurantos.entity.DishPortionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface DishPortionRepository extends JpaRepository<DishPortionEntity, UUID> {

    Optional<DishPortionEntity> findByDishIdAndIsDefaultTrue(UUID dishId);

    List<DishPortionEntity> findByDishId(UUID dishId);
}
