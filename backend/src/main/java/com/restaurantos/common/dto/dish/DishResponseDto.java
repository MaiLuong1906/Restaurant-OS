package com.restaurantos.common.dto.dish;

import com.restaurantos.entity.DishEntity;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Thông tin chi tiết món ăn trả về cho Client & Admin")
public record DishResponseDto(
        @Schema(description = "ID định danh món ăn (UUID)", example = "00000000-0000-0000-0000-000000000001")
        UUID id,

        @Schema(description = "Tên món ăn", example = "Bò Lúc Lắc Wagyu A4")
        String name,

        @Schema(description = "Mô tả chi tiết món ăn", example = "Thịt bò Wagyu áp chảo sốt tiêu đen kèm khoai tây nghiền")
        String description,

        @Schema(description = "Giá niêm yết VND (số nguyên)", example = "480000")
        Long price,

        @Schema(description = "Phân loại danh mục", example = "MAIN")
        String category,

        @Schema(description = "UUID danh mục trong hệ thống", example = "00000000-0000-0000-0000-000000000052")
        UUID categoryId,

        @Schema(description = "URL ảnh đại diện", example = "https://images.unsplash.com/photo-1544025162-d76694265947")
        String imageUrl,

        @Schema(description = "Trạng thái sẵn sàng phục vụ", example = "true")
        Boolean isAvailable,

        @Schema(description = "Có phải là món Combo không", example = "false")
        Boolean isCombo,

        @Schema(description = "Lý do hết món nếu tạm ngưng phục vụ", example = "null")
        String soldOutReason,

        @Schema(description = "Thời gian tạo món ăn")
        Instant createdAt,

        @Schema(description = "Thời gian cập nhật gần nhất")
        Instant updatedAt,

        @Schema(description = "Danh sách món con cấu thành nếu là món Combo")
        java.util.List<ComboItemResponse> comboItems,

        @Schema(description = "Danh sách các nhóm tùy chọn (Kích cỡ, Độ cay, Topping)")
        java.util.List<DishOptionGroupDto> optionGroups
) {
    // Secondary constructor giữ tương thích ngược với code cũ và unit tests
    public DishResponseDto(
            UUID id,
            String name,
            String description,
            Long price,
            String category,
            UUID categoryId,
            String imageUrl,
            Boolean isAvailable,
            Boolean isCombo,
            String soldOutReason,
            Instant createdAt,
            Instant updatedAt,
            java.util.List<ComboItemResponse> comboItems
    ) {
        this(id, name, description, price, category, categoryId, imageUrl, isAvailable, isCombo, soldOutReason, createdAt, updatedAt, comboItems, java.util.Collections.emptyList());
    }

    public static DishResponseDto fromEntity(
            DishEntity entity,
            java.util.List<ComboItemResponse> comboItems,
            java.util.List<DishOptionGroupDto> optionGroups
    ) {
        if (entity == null) {
            return null;
        }
        return new DishResponseDto(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getCategory(),
                entity.getCategoryId(),
                entity.getImageUrl(),
                entity.getIsAvailable() != null ? entity.getIsAvailable() : true,
                entity.getIsCombo() != null ? entity.getIsCombo() : false,
                entity.getSoldOutReason(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                comboItems != null ? comboItems : java.util.Collections.emptyList(),
                optionGroups != null ? optionGroups : java.util.Collections.emptyList()
        );
    }
}
