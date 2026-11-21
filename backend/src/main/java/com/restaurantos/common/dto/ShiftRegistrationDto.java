package com.restaurantos.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRegistrationDto {
    private UUID id;
    private UUID staffId;
    private UUID openShiftId;
    private LocalDate dateKey;
    private String status;
    private String note;
    private String idempotencyKey;
}
