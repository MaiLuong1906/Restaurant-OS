package com.restaurantos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEntity {

    @Id
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private OrderEntity order;

    @Column(name = "dish_id", nullable = false)
    private UUID dishId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dish_id", insertable = false, updatable = false)
    private DishEntity dish;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Long unitPrice;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String modifiers; // JSON array string, default "[]"

    @Column(nullable = false, length = 50)
    private String status; // WAITING, READY, SERVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "allergy_note", columnDefinition = "TEXT")
    private String allergyNote;

    @Column(name = "portion_id", nullable = false)
    private UUID portionId;

    @Column(name = "dish_name_snapshot", nullable = false, length = 255)
    private String dishNameSnapshot;

    @Column(name = "portion_name_snapshot", nullable = false, length = 100)
    private String portionNameSnapshot;

    @Column(name = "sla_deadline")
    private Instant slaDeadline;

    @Column(name = "is_expedited", nullable = false)
    private Boolean isExpedited;

    @Column(name = "expedited_at")
    private Instant expeditedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
