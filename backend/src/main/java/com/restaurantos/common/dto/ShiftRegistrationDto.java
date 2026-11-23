package com.restaurantos.common.dto;

import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "openShiftId không được để trống")
    private UUID openShiftId;

    @NotNull(message = "dateKey không được để trống")
    private LocalDate dateKey;

    private String status;
    private String note;
    private String idempotencyKey;
}
