package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tùy chọn con trong nhóm (e.g. Size Lớn, Thêm phô mai)")
public record DishOptionItemDto(
        @Schema(description = "ID định danh của option", example = "opt_1")
        String id,

        @Schema(description = "Tên lựa chọn", example = "Size Lớn")
        String name,

        @Schema(description = "Giá phụ thu VND (>= 0)", example = "20000")
        Long extraPrice,

        @Schema(description = "Là lựa chọn mặc định", example = "false")
        Boolean isDefault,

        @Schema(description = "Trạng thái sẵn sàng phục vụ", example = "true")
        Boolean isAvailable
) {
}
