package com.restaurantos.repository;

import com.restaurantos.entity.DishComboEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DishComboRepository extends JpaRepository<DishComboEntity, UUID> {

    List<DishComboEntity> findByComboDishId(UUID comboDishId);

    void deleteByComboDishId(UUID comboDishId);

    boolean existsByItemDishId(UUID itemDishId);
}
