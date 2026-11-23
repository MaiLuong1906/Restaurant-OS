package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "Yêu cầu khai báo món con bên trong Combo")
public record ComboItemRequest(
        @Schema(description = "UUID của món con lẻ trong thực đơn", example = "16c69716-6f12-4314-8ca7-dc7dff29cf93")
        @NotNull(message = "ID món con không được để trống")
        UUID dishId,

        @Schema(description = "Số lượng món con cấu thành trong combo", example = "1")
        @NotNull(message = "Số lượng món con không được để trống")
        @Min(value = 1, message = "Số lượng món con trong combo phải lớn hơn hoặc bằng 1")
        Integer quantity
) {
}
