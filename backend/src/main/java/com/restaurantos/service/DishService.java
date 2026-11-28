package com.restaurantos.service;

import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.dish.CreateDishRequest;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.common.dto.dish.UpdateDishRequest;

import java.util.List;
import java.util.UUID;

public interface DishService {

    /**
     * Lấy danh sách món ăn có phân trang (dành cho Admin / Quản lý)
     */
    PageResponse<DishResponseDto> getDishesPaged(String category, String search, Boolean isAvailable, int page, int size);

    /**
     * Lấy toàn bộ danh sách món ăn không phân trang (có hỗ trợ lọc theo danh mục, từ khóa, trạng thái)
     */
    List<DishResponseDto> getDishes(String category, String search, Boolean isAvailable);

    /**
     * Lấy thông tin chi tiết một món ăn theo ID
     */
    DishResponseDto getDishById(UUID id);

    /**
     * Tạo mới một món ăn vào thực đơn
     */
    DishResponseDto createDish(CreateDishRequest request);

    /**
     * Cập nhật thông tin chi tiết món ăn
     */
    DishResponseDto updateDish(UUID id, UpdateDishRequest request);

    /**
     * Cập nhật nhanh trạng thái Còn món / Hết món (phục vụ Bếp & Quản lý)
     */
    DishResponseDto updateAvailability(UUID id, UpdateDishAvailabilityRequest request);

    /**
     * Xóa một món ăn khỏi thực đơn
     */
    void deleteDish(UUID id);

    /**
     * Lấy danh sách toàn bộ danh mục món ăn hiện có trong thực đơn
     */
    List<String> getCategories();
}
