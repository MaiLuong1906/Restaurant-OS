package com.restaurantos.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

@Schema(description = "Yêu cầu hoàn tất mẻ nấu KDS (K5)")
public record CompleteBatchRequest(
        @NotEmpty(message = "Danh sách món không được để trống")
        @Schema(
                description = "Danh sách UUID các món (order_items.id) trong mẻ cần hoàn tất",
                example = "[\"2c8bb9f5-cd32-47c7-98de-9bd8134ee349\", \"719cf9f1-ebb8-43bc-9ba2-2f4e9680cbee\"]",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        List<UUID> itemIds
) {
}
