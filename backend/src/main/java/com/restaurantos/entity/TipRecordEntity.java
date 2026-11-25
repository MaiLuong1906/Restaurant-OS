package com.restaurantos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tip_records")
public class TipRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "staff_id", nullable = false, columnDefinition = "UUID")
    private UUID staffId;

    @Column(name = "tip_date", nullable = false)
    private LocalDate tipDate;

    @Column(name = "month_key", nullable = false, length = 7)
    private String monthKey;

    @Column(name = "date_label", length = 100)
    private String dateLabel;

    @Column(name = "shift_label", nullable = false, length = 100)
    private String shiftLabel;

    @Column(name = "pool_amount", nullable = false)
    private Long poolAmount = 0L;

    @Column(name = "allocated_amount", nullable = false)
    private Long allocatedAmount;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "UNPAID";

    @Column(name = "payment_note", columnDefinition = "TEXT")
    private String paymentNote;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
