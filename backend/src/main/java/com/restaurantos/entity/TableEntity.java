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
public class TableEntity {

    @Id
    private UUID id;

    @Column(name = "table_number", nullable = false, length = 50)
    private String tableNumber;

    @Column(name = "qr_code_token", length = 100)
    private String qrCodeToken;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "zone_id", nullable = false)
    private UUID zoneId;

    @Column(name = "occupied_at")
    private Instant occupiedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
