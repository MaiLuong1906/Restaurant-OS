package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Tùy chọn con trong nhóm (e.g. Size Lớn, Thêm phô mai)")
public record DishOptionItemDto(
        @Schema(description = "ID định danh của option", example = "opt_1")
        @NotBlank(message = "ID lựa chọn không được để trống")
        String id,

        @Schema(description = "Tên lựa chọn", example = "Size Lớn")
        @NotBlank(message = "Tên lựa chọn không được để trống")
        @Size(max = 100, message = "Tên lựa chọn không được vượt quá 100 ký tự")
        String name,

        @Schema(description = "Giá phụ thu VND (>= 0)", example = "20000")
        @NotNull(message = "Giá phụ thu không được để trống")
        @Min(value = 0, message = "Giá phụ thu không được nhỏ hơn 0 VND")
        Long extraPrice,

        @Schema(description = "Là lựa chọn mặc định", example = "false")
        Boolean isDefault,

        @Schema(description = "Trạng thái sẵn sàng phục vụ", example = "true")
        Boolean isAvailable
) {
}
