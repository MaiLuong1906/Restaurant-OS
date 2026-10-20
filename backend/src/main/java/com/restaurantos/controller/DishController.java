package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.entity.DishEntity;
import com.restaurantos.repository.DishRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dishes")
@RequiredArgsConstructor
@Tag(name = "Dishes & Menu", description = "Quản lý danh mục món ăn & Thực đơn điện tử")
public class DishController {

    private final DishRepository dishRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách thực đơn", description = "Trả về toàn bộ danh sách món ăn đang phục vụ tại nhà hàng kèm giá tiền VND")
    public ResponseEntity<ApiResponse<List<DishEntity>>> getAllDishes(
            @Parameter(description = "Lọc theo danh mục: MAIN, APPETIZER, DRINK, DESSERT")
            @RequestParam(required = false) String category
    ) {
        List<DishEntity> dishes = (category != null && !category.isBlank())
                ? dishRepository.findByCategory(category.toUpperCase())
                : dishRepository.findByIsAvailableTrue();

        return ResponseEntity.ok(ApiResponse.success(dishes, "Lấy danh sách món ăn thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết món ăn", description = "Lấy thông tin chi tiết một món ăn cụ thể theo UUID")
    public ResponseEntity<ApiResponse<DishEntity>> getDishById(
            @Parameter(description = "Mã định danh duy nhất (UUID) của món ăn")
            @PathVariable UUID id
    ) {
        return dishRepository.findById(id)
                .map(dish -> ResponseEntity.ok(ApiResponse.success(dish, "Lấy thông tin món ăn thành công")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy món ăn với ID: " + id, null)));
    }
}
