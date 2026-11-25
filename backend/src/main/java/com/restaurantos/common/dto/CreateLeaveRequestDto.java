package com.restaurantos.common.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeaveRequestDto {
    private UUID staffId;
    private String staffName;

    @NotBlank(message = "Loại nghỉ phép không được để trống")
    @Pattern(regexp = "ANNUAL|SICK|UNPAID", message = "Loại nghỉ phép phải là ANNUAL, SICK hoặc UNPAID")
    private String type;

    @NotNull(message = "startDate không được để trống")
    private LocalDate startDate;

    @NotNull(message = "endDate không được để trống")
    private LocalDate endDate;

    @NotBlank(message = "Lý do xin nghỉ không được để trống")
    @Size(max = 500, message = "Lý do xin nghỉ không được vượt quá 500 ký tự")
    private String reason;

    private String idempotencyKey;
}
