package com.restaurantos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dish_combos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DishComboEntity {

    @Id
    private UUID id;

    @Column(name = "combo_dish_id", nullable = false)
    private UUID comboDishId;

    @Column(name = "item_dish_id", nullable = false)
    private UUID itemDishId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
