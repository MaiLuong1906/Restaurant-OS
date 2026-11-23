package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Yêu cầu bật/tắt nhanh trạng thái Còn món / Hết món")
public record UpdateDishAvailabilityRequest(
        @Schema(description = "Trạng thái sẵn sàng phục vụ: true (còn món), false (hết món/tạm ngưng)", example = "false")
        @NotNull(message = "Trạng thái phục vụ không được để trống")
        Boolean isAvailable,

        @Schema(description = "Lý do báo hết món (nếu có)", example = "Hết nước hầm xương")
        String soldOutReason
) {
}
