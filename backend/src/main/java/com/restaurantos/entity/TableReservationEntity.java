package com.restaurantos.entity;

import com.restaurantos.enums.DepositMethod;
import com.restaurantos.enums.ReservationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "table_reservations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableReservationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id")
    private RestaurantTableEntity table;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "guest_count", nullable = false)
    @Builder.Default
    private Integer guestCount = 2;

    @Column(name = "reservation_time", nullable = false)
    private Instant reservationTime;

    /**
     * Số tiền đặt cọc giữ chỗ — bắt buộc số nguyên VND (BIGINT).
     */
    @Column(name = "deposit_amount", nullable = false)
    @Builder.Default
    private Long depositAmount = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_method", length = 30)
    private DepositMethod depositMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.CONFIRMED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "checked_in_at")
    private Instant checkedInAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
