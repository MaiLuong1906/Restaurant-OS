package com.restaurantos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_item_voids")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemVoidEntity {

    @Id
    private UUID id;

    @Column(name = "order_item_id", nullable = false)
    private UUID orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", insertable = false, updatable = false)
    private OrderItemEntity orderItem;

    @Column(name = "quantity_voided", nullable = false)
    private Integer quantityVoided;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private Boolean wasted;

    @Column(name = "requested_by", nullable = false)
    private UUID requestedBy;

    @Column(name = "approved_by", nullable = false)
    private UUID approvedBy;

    @Column(name = "approved_at", nullable = false)
    private Instant approvedAt;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "is_post_cooking", nullable = false)
    private Boolean isPostCooking;
}
