package com.restaurantos.repository;

import com.restaurantos.entity.DishEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DishRepository extends JpaRepository<DishEntity, UUID> {

    List<DishEntity> findByCategory(String category);

    List<DishEntity> findByIsAvailableTrue();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    Optional<DishEntity> findByNameIgnoreCase(String name);

    @Query("SELECT d FROM DishEntity d WHERE " +
           "(:category IS NULL OR :category = '' OR :category = 'ALL' OR UPPER(d.category) = UPPER(:category)) AND " +
           "(:isAvailable IS NULL OR d.isAvailable = :isAvailable) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DishEntity> findDishesPaged(
            @Param("category") String category,
            @Param("search") String search,
            @Param("isAvailable") Boolean isAvailable,
            Pageable pageable
    );

    @Query("SELECT d FROM DishEntity d WHERE " +
           "(:category IS NULL OR :category = '' OR :category = 'ALL' OR UPPER(d.category) = UPPER(:category)) AND " +
           "(:isAvailable IS NULL OR d.isAvailable = :isAvailable) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY d.category ASC, d.name ASC")
    List<DishEntity> findDishes(
            @Param("category") String category,
            @Param("search") String search,
            @Param("isAvailable") Boolean isAvailable
    );
}
