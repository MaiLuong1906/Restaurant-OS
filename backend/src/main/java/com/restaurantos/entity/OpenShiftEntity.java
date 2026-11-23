package com.restaurantos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "open_shifts")
public class OpenShiftEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "date_key", nullable = false)
    private LocalDate dateKey;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String zone;

    @Column(name = "slots_total", nullable = false)
    private Integer slotsTotal;

    @Column(name = "slots_taken", nullable = false)
    private Integer slotsTaken = 0;

    @Column(name = "posted_by_id", nullable = false, columnDefinition = "UUID")
    private UUID postedById;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
