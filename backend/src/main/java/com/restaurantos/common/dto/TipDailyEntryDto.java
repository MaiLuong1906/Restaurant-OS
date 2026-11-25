package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipDailyEntryDto {
    private LocalDate date;
    private String dateLabel;
    private String shiftLabel;
    private Long amount;
}
