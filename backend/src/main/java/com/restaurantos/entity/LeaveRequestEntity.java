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
@Table(name = "leave_requests")
public class LeaveRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "staff_id", nullable = false, columnDefinition = "UUID")
    private UUID staffId;

    @Column(name = "staff_name", nullable = false)
    private String staffName;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "calendar_days", nullable = false)
    private Integer calendarDays;

    @Column(name = "affected_shifts", nullable = false)
    private Integer affectedShifts = 1;

    @Column(name = "idempotency_key", length = 255, unique = true)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
