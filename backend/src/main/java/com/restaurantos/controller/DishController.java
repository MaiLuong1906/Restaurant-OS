package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.service.DishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dishes")
@RequiredArgsConstructor
@Tag(name = "Dishes & Menu", description = "Quản lý danh mục món ăn & Thực đơn điện tử công khai")
public class DishController {

    private final DishService dishService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thực đơn",
               description = "Trả về toàn bộ danh sách món ăn đang phục vụ tại nhà hàng kèm giá tiền VND (hỗ trợ lọc theo category và search)")
    public ResponseEntity<ApiResponse<List<DishResponseDto>>> getAllDishes(
            @Parameter(description = "Lọc theo danh mục: KHAI_VI, MON_CHINH, DO_UONG, TRANG_MIENG, COMBO...")
            @RequestParam(required = false) String category,

            @Parameter(description = "Từ khóa tìm kiếm theo tên món")
            @RequestParam(required = false) String search,

            @Parameter(description = "Lọc theo trạng thái khả dụng (mặc định chỉ lấy món đang phục vụ nếu không truyền)")
            @RequestParam(required = false) Boolean isAvailable
    ) {
        Boolean availableFilter = (isAvailable != null) ? isAvailable : true;
        List<DishResponseDto> dishes = dishService.getDishes(category, search, availableFilter);
        return ResponseEntity.ok(ApiResponse.success(dishes, "Lấy danh sách món ăn thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết món ăn", description = "Lấy thông tin chi tiết một món ăn cụ thể theo UUID")
    public ResponseEntity<ApiResponse<DishResponseDto>> getDishById(
            @Parameter(description = "Mã định danh duy nhất (UUID) của món ăn")
            @PathVariable UUID id
    ) {
        DishResponseDto dish = dishService.getDishById(id);
        return ResponseEntity.ok(ApiResponse.success(dish, "Lấy thông tin món ăn thành công"));
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasAuthority('MENU:AVAILABILITY:UPDATE')")
    @Operation(summary = "Báo hết món hoặc mở lại món (Đầu bếp & Nhân viên UC20)",
               description = "Cập nhật nhanh trạng thái còn/hết món của thực đơn")
    public ResponseEntity<ApiResponse<DishResponseDto>> updateAvailability(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDishAvailabilityRequest request
    ) {
        DishResponseDto updated = dishService.updateAvailability(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái món ăn thành công"));
    }
}
