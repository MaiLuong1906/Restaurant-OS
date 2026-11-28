package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(description = "Nhóm tùy chọn món ăn (e.g. Kích cỡ, Mức cay, Topping)")
public record DishOptionGroupDto(
        @Schema(description = "ID định danh nhóm option", example = "grp_size")
        @NotBlank(message = "ID nhóm tùy chọn không được để trống")
        String id,

        @Schema(description = "Tên nhóm tùy chọn", example = "Kích cỡ phần ăn")
        @NotBlank(message = "Tên nhóm tùy chọn không được để trống")
        @Size(max = 100, message = "Tên nhóm tùy chọn không được vượt quá 100 ký tự")
        String name,

        @Schema(description = "Bắt buộc chọn", example = "true")
        Boolean isRequired,

        @Schema(description = "Số lượng lựa chọn tối thiểu", example = "1")
        @Min(value = 0, message = "Số lượng lựa chọn tối thiểu không được nhỏ hơn 0")
        Integer minSelections,

        @Schema(description = "Số lượng lựa chọn tối đa (1 = Single choice / Radio, >1 = Multi choice / Topping)", example = "1")
        @Min(value = 1, message = "Số lượng lựa chọn tối đa phải từ 1 trở lên")
        Integer maxSelections,

        @Schema(description = "Danh sách các lựa chọn con")
        @NotNull(message = "Danh sách lựa chọn con không được để trống")
        @NotEmpty(message = "Nhóm tùy chọn phải có ít nhất 1 lựa chọn con")
        List<@Valid DishOptionItemDto> items
) {
}
