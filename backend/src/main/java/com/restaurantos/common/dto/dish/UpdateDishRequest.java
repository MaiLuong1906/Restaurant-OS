package com.restaurantos.common.dto.dish;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Yêu cầu cập nhật thông tin món ăn")
public record UpdateDishRequest(
        @Schema(description = "Tên món ăn", example = "Bò Lúc Lắc Wagyu A4")
        @NotBlank(message = "Tên món ăn không được để trống")
        @Size(max = 255, message = "Tên món ăn không được vượt quá 255 ký tự")
        String name,

        @Schema(description = "Mô tả chi tiết món ăn", example = "Thịt bò Wagyu áp chảo sốt tiêu đen kèm khoai tây nghiền")
        String description,

        @Schema(description = "Giá niêm yết tính bằng VND (số nguyên >= 0)", example = "490000")
        @NotNull(message = "Giá tiền không được để trống")
        @Min(value = 0, message = "Giá tiền món ăn không được nhỏ hơn 0 VND")
        Long price,

        @Schema(description = "Phân loại danh mục", example = "MON_CHINH")
        @NotBlank(message = "Danh mục món ăn không được để trống")
        @Size(max = 100, message = "Danh mục không được vượt quá 100 ký tự")
        String category,

        @Schema(description = "URL ảnh đại diện món ăn", example = "https://images.unsplash.com/photo-1544025162-d76694265947")
        String imageUrl,

        @Schema(description = "Trạng thái sẵn sàng phục vụ", example = "true")
        Boolean isAvailable,

        @Schema(description = "Đánh dấu là món Combo", example = "false")
        Boolean isCombo,

        @Schema(description = "Lý do hết món nếu tạm ngưng phục vụ", example = "Hết nguyên liệu thịt Wagyu")
        String soldOutReason,

        @Schema(description = "Danh sách món con cấu thành nếu là món Combo")
        java.util.List<ComboItemRequest> comboItems
) {
}
