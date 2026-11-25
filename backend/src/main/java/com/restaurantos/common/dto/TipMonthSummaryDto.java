package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipMonthSummaryDto {
    private String monthKey;
    private String monthLabel;
    private Long totalAmount;
    private String paymentStatus;
    private String paymentNote;
    private List<TipDailyEntryDto> dailyEntries;
}
