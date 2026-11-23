package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.dish.CreateDishRequest;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.common.dto.dish.UpdateDishRequest;
import com.restaurantos.service.DishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/dishes")
@RequiredArgsConstructor
@Tag(name = "Admin Menu Management", description = "Quản trị thực đơn món ăn, cấu hình đơn giá VND, phân mục & trạng thái (UC_OWN_02)")
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class AdminDishController {

    private final DishService dishService;

    @GetMapping
    @Operation(summary = "Lấy danh sách món ăn quản trị có phân trang",
               description = "Trả về danh sách món ăn có phân trang cho Admin Portal, hỗ trợ tìm kiếm theo tên, lọc danh mục và trạng thái phục vụ")
    public ResponseEntity<ApiResponse<PageResponse<DishResponseDto>>> getDishesPaged(
            @Parameter(description = "Lọc theo danh mục (ví dụ: KHAI_VI, MON_CHINH, DO_UONG, TRANG_MIENG, COMBO hoặc ALL)")
            @RequestParam(required = false) String category,

            @Parameter(description = "Từ khóa tìm kiếm theo tên món ăn")
            @RequestParam(required = false) String search,

            @Parameter(description = "Lọc theo trạng thái: true (còn món), false (hết món/ngưng bán)")
            @RequestParam(required = false) Boolean isAvailable,

            @Parameter(description = "Số thứ tự trang (bắt đầu từ 0)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Số lượng bản ghi mỗi trang (mặc định 10)")
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<DishResponseDto> response = dishService.getDishesPaged(category, search, isAvailable, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách món ăn thành công"));
    }

    @GetMapping("/categories")
    @Operation(summary = "Lấy danh sách các danh mục món ăn hiện có",
               description = "Trả về toàn bộ danh mục độc bản hiện đang có trong thực đơn phục vụ bộ lọc UI")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = dishService.getCategories();
        return ResponseEntity.ok(ApiResponse.success(categories, "Lấy danh mục món ăn thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem thông tin chi tiết một món ăn theo ID")
    public ResponseEntity<ApiResponse<DishResponseDto>> getDishById(
            @Parameter(description = "UUID của món ăn")
            @PathVariable UUID id
    ) {
        DishResponseDto dish = dishService.getDishById(id);
        return ResponseEntity.ok(ApiResponse.success(dish, "Lấy thông tin món ăn thành công"));
    }

    @PostMapping
    @Operation(summary = "Tạo mới món ăn vào thực đơn",
               description = "Tạo mới món ăn với đơn giá niêm yết nguyên VND, danh mục và cấu hình tuỳ chọn")
    public ResponseEntity<ApiResponse<DishResponseDto>> createDish(
            @Valid @RequestBody CreateDishRequest request
    ) {
        DishResponseDto created = dishService.createDish(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo món ăn mới thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật toàn diện thông tin món ăn",
               description = "Chỉnh sửa tên, đơn giá, danh mục, mô tả hoặc ảnh của món ăn")
    public ResponseEntity<ApiResponse<DishResponseDto>> updateDish(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDishRequest request
    ) {
        DishResponseDto updated = dishService.updateDish(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật món ăn thành công"));
    }

    @PatchMapping("/{id}/availability")
    @Operation(summary = "Bật/Tắt nhanh trạng thái Còn món / Hết món",
               description = "Cập nhật cờ isAvailable và lý do hết món tức thời (phục vụ quản lý và bếp UC20)")
    public ResponseEntity<ApiResponse<DishResponseDto>> updateAvailability(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDishAvailabilityRequest request
    ) {
        DishResponseDto updated = dishService.updateAvailability(id, request);
        String message = Boolean.TRUE.equals(request.isAvailable())
                ? "Đã mở lại trạng thái phục vụ cho món ăn"
                : "Đã đánh dấu hết món / tạm ngưng phục vụ";
        return ResponseEntity.ok(ApiResponse.success(updated, message));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa món ăn khỏi thực đơn",
               description = "Xóa vĩnh viễn món ăn khỏi danh mục (nếu chưa phát sinh dữ liệu ràng buộc)")
    public ResponseEntity<ApiResponse<Void>> deleteDish(
            @PathVariable UUID id
    ) {
        dishService.deleteDish(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa món ăn khỏi thực đơn thành công"));
    }
}
