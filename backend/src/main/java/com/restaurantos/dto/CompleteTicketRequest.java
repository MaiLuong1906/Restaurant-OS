package com.restaurantos.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Yêu cầu hoàn tất ticket KDS (K3)")
public record CompleteTicketRequest(
        @Schema(description = "Trạng thái đích (mặc định READY)", example = "READY")
        String status
) {
}
