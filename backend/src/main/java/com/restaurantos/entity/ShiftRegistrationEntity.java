package com.restaurantos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@ToString(exclude = "openShift")
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shift_registrations")
public class ShiftRegistrationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "staff_id", nullable = false, columnDefinition = "UUID")
    private UUID staffId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "open_shift_id", nullable = false, foreignKey = @ForeignKey(name = "fk_shift_reg_open_shift"))
    private OpenShiftEntity openShift;

    @Column(name = "date_key", nullable = false)
    private LocalDate dateKey;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "idempotency_key", length = 255, unique = true)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
