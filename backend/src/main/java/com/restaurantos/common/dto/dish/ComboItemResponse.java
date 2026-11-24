package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "Chi tiết món con cấu thành bên trong Combo")
public record ComboItemResponse(
        @Schema(description = "ID liên kết combo (UUID)")
        UUID id,

        @Schema(description = "ID món con (UUID)")
        UUID dishId,

        @Schema(description = "Tên món con", example = "Phở Bò Tái Lăn")
        String dishName,

        @Schema(description = "Đơn giá niêm yết lẻ của món con (VND)", example = "65000")
        Long dishPrice,

        @Schema(description = "Danh mục của món con", example = "MAIN")
        String dishCategory,

        @Schema(description = "Ảnh món con")
        String dishImageUrl,

        @Schema(description = "Số lượng trong combo", example = "2")
        Integer quantity
) {
}
