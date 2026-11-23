package com.restaurantos.service.impl;

import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.dish.CreateDishRequest;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.common.dto.dish.UpdateDishRequest;
import com.restaurantos.entity.DishEntity;
import com.restaurantos.repository.DishRepository;
import com.restaurantos.service.DishService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DishServiceImpl implements DishService {

    private final DishRepository dishRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DishResponseDto> getDishesPaged(String category, String search, Boolean isAvailable, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "category").and(Sort.by(Sort.Direction.ASC, "name")));
        Page<DishEntity> dishPage = dishRepository.findDishesPaged(
                normalizeFilter(category),
                normalizeSearch(search),
                isAvailable,
                pageable
        );

        return PageResponse.from(dishPage, DishResponseDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DishResponseDto> getDishes(String category, String search, Boolean isAvailable) {
        return dishRepository.findDishes(
                normalizeFilter(category),
                normalizeSearch(search),
                isAvailable
        ).stream().map(DishResponseDto::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DishResponseDto getDishById(UUID id) {
        DishEntity dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn với ID: " + id));
        return DishResponseDto.fromEntity(dish);
    }

    @Override
    @Transactional
    public DishResponseDto createDish(CreateDishRequest request) {
        String trimmedName = request.name().trim();
        if (dishRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Món ăn với tên '" + trimmedName + "' đã tồn tại trong thực đơn");
        }

        Instant now = Instant.now();
        DishEntity dish = DishEntity.builder()
                .id(UUID.randomUUID())
                .name(trimmedName)
                .description(request.description() != null ? request.description().trim() : null)
                .price(request.price())
                .category(request.category().trim().toUpperCase())
                .imageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null)
                .isAvailable(request.isAvailable() != null ? request.isAvailable() : true)
                .isCombo(request.isCombo() != null ? request.isCombo() : false)
                .soldOutReason(Boolean.FALSE.equals(request.isAvailable()) ? "Tạm ngưng phục vụ" : null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        DishEntity saved = dishRepository.save(dish);
        log.info("Đã tạo mới món ăn ID: {}, Tên: '{}', Giá: {} VND, Danh mục: {}",
                saved.getId(), saved.getName(), saved.getPrice(), saved.getCategory());

        return DishResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public DishResponseDto updateDish(UUID id, UpdateDishRequest request) {
        DishEntity dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn với ID: " + id));

        String trimmedName = request.name().trim();
        if (dishRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên món ăn '" + trimmedName + "' đã được sử dụng bởi món khác");
        }

        dish.setName(trimmedName);
        dish.setDescription(request.description() != null ? request.description().trim() : null);
        dish.setPrice(request.price());
        dish.setCategory(request.category().trim().toUpperCase());
        dish.setImageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null);

        if (request.isAvailable() != null) {
            dish.setIsAvailable(request.isAvailable());
            if (Boolean.TRUE.equals(request.isAvailable())) {
                dish.setSoldOutReason(null);
            } else {
                dish.setSoldOutReason(request.soldOutReason() != null ? request.soldOutReason().trim() : "Tạm ngưng phục vụ");
            }
        }

        if (request.isCombo() != null) {
            dish.setIsCombo(request.isCombo());
        }

        dish.setUpdatedAt(Instant.now());
        DishEntity updated = dishRepository.save(dish);
        log.info("Đã cập nhật món ăn ID: {}, Tên: '{}', Giá: {} VND", updated.getId(), updated.getName(), updated.getPrice());

        return DishResponseDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public DishResponseDto updateAvailability(UUID id, UpdateDishAvailabilityRequest request) {
        DishEntity dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn với ID: " + id));

        dish.setIsAvailable(request.isAvailable());
        if (Boolean.TRUE.equals(request.isAvailable())) {
            dish.setSoldOutReason(null);
        } else {
            dish.setSoldOutReason(request.soldOutReason() != null && !request.soldOutReason().isBlank()
                    ? request.soldOutReason().trim()
                    : "Tạm ngưng phục vụ");
        }

        dish.setUpdatedAt(Instant.now());
        DishEntity updated = dishRepository.save(dish);
        log.info("Đã đổi trạng thái món ăn ID: {}, isAvailable: {}, Lý do: {}",
                updated.getId(), updated.getIsAvailable(), updated.getSoldOutReason());

        return DishResponseDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteDish(UUID id) {
        DishEntity dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn với ID: " + id));

        dishRepository.delete(dish);
        log.info("Đã xóa món ăn ID: {}, Tên: '{}'", id, dish.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return dishRepository.findAll().stream()
                .map(DishEntity::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return value.trim();
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }
}
