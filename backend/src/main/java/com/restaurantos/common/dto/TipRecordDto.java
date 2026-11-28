package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipRecordDto {
    private UUID id;
    private UUID staffId;
    private LocalDate date;
    private Long poolAmount;
    private Long allocatedAmount;
    private String note;
}
