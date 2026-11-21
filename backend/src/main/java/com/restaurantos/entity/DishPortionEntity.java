package com.restaurantos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "dish_portions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DishPortionEntity {

    @Id
    private UUID id;

    @Column(name = "dish_id", nullable = false)
    private UUID dishId;

    @Column(name = "portion_name", nullable = false, length = 100)
    private String portionName;

    @Column(nullable = false)
    private Long price;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault;

    @Column(name = "available_portions")
    private Integer availablePortions;
}
