package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenShiftDto {
    private UUID id;
    private LocalDate dateKey;
    private LocalTime startTime;
    private LocalTime endTime;
    private String role;
    private String title;
    private String zone;
    private Integer slotsTotal;
    private Integer slotsTaken;
    private UUID postedById;
    private String note;
}
