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
@Table(name = "restaurant_tables")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantTableEntity {

    @Id
    private UUID id;

    @Column(name = "table_number", nullable = false, length = 20)
    private String tableNumber;

    private Integer capacity;

    @Column(nullable = false, length = 50)
    private String status; // VACANT, SERVING, BILLING, CLEANING, RESERVED

    @Column(name = "zone_id")
    private UUID zoneId;

    @Column(name = "current_order_id")
    private UUID currentOrderId;

    @Column(name = "occupied_at")
    private Instant occupiedAt;
}
