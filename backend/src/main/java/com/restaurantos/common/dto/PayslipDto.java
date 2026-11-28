package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayslipDto {
    private UUID id;
    private UUID staffId;
    private String staffName;
    private String month;
    private String monthLabel;
    private String status;
    private String paymentStatus;
    private String periodLabel;
    private String paymentDateLabel;
    private String paymentNote;
    private Long baseSalary;
    private Integer workedHours;
    private Long hourlyRate;
    private Long allowance;
    private Long bonus;
    private Long tipAmount;
    private Long deductions;
    private Long bhxhAmount;
    private Long advanceAmount;
    private Long netSalary;
    private OffsetDateTime paidAt;
}
