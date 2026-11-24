package com.restaurantos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Yêu cầu cập nhật trạng thái món KDS (K4)")
public record UpdateItemStatusRequest(
        @NotNull(message = "Trạng thái không được để trống")
        @Schema(description = "Trạng thái đích: READY hoặc REJECTED", example = "READY", requiredMode = Schema.RequiredMode.REQUIRED)
        String status,

        @Size(max = 200, message = "Lý do từ chối tối đa 200 ký tự")
        @Schema(description = "Lý do từ chối (bắt buộc khi REJECTED, từ 5 đến 200 ký tự)", example = "Hết nguyên liệu thịt bò")
        String reason
) {
}
