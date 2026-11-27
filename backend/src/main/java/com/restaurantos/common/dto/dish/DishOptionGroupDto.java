package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Nhóm tùy chọn món ăn (e.g. Kích cỡ, Mức cay, Topping)")
public record DishOptionGroupDto(
        @Schema(description = "ID định danh nhóm option", example = "grp_size")
        String id,

        @Schema(description = "Tên nhóm tùy chọn", example = "Kích cỡ phần ăn")
        String name,

        @Schema(description = "Bắt buộc chọn", example = "true")
        Boolean isRequired,

        @Schema(description = "Số lượng lựa chọn tối thiểu", example = "1")
        Integer minSelections,

        @Schema(description = "Số lượng lựa chọn tối đa (1 = Single choice / Radio, >1 = Multi choice / Topping)", example = "1")
        Integer maxSelections,

        @Schema(description = "Danh sách các lựa chọn con")
        List<DishOptionItemDto> items
) {
}
