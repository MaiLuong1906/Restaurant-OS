package com.restaurantos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payslips")
public class PayslipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "UUID", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "staff_id", nullable = false, columnDefinition = "UUID")
    private UUID staffId;

    @Column(name = "staff_name", nullable = false)
    private String staffName;

    @Column(nullable = false, length = 7)
    private String month;

    @Column(name = "month_label", length = 50)
    private String monthLabel;

    @Column(nullable = false, length = 20)
    private String status = "PROVISIONAL";

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "EXPECTED";

    @Column(name = "period_label", length = 100)
    private String periodLabel;

    @Column(name = "payment_date_label", length = 50)
    private String paymentDateLabel;

    @Column(name = "payment_note", columnDefinition = "TEXT")
    private String paymentNote;

    @Column(name = "base_salary", nullable = false)
    private Long baseSalary;

    @Column(name = "worked_hours", nullable = false)
    private Integer workedHours;

    @Column(name = "hourly_rate", nullable = false)
    private Long hourlyRate;

    @Column(nullable = false)
    private Long allowance = 0L;

    @Column(nullable = false)
    private Long bonus = 0L;

    @Column(name = "tip_amount", nullable = false)
    private Long tipAmount = 0L;

    @Column(nullable = false)
    private Long deductions = 0L;

    @Column(name = "bhxh_amount", nullable = false)
    private Long bhxhAmount = 0L;

    @Column(name = "advance_amount", nullable = false)
    private Long advanceAmount = 0L;

    @Column(name = "net_salary", nullable = false)
    private Long netSalary;

    @Column(name = "paid_at", columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime paidAt;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
