package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceDto {
    private UUID staffId;
    private Integer totalDays;
    private Integer usedDays;
    private Integer remainingDays;
    private Integer pendingRequestsCount;
}
