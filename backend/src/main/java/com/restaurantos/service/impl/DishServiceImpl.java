package com.restaurantos.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.dish.ComboItemRequest;
import com.restaurantos.common.dto.dish.ComboItemResponse;
import com.restaurantos.common.dto.dish.CreateDishRequest;
import com.restaurantos.common.dto.dish.DishOptionGroupDto;
import com.restaurantos.common.dto.dish.DishOptionItemDto;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.common.dto.dish.UpdateDishRequest;
import com.restaurantos.common.enums.DishCategory;
import com.restaurantos.entity.DishComboEntity;
import com.restaurantos.entity.DishEntity;
import com.restaurantos.repository.DishComboRepository;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DishServiceImpl implements DishService {

    private final DishRepository dishRepository;
    private final DishComboRepository dishComboRepository;
    private final ObjectMapper objectMapper;

    public DishServiceImpl(
            DishRepository dishRepository,
            DishComboRepository dishComboRepository,
            ObjectMapper objectMapper
    ) {
        this.dishRepository = dishRepository;
        this.dishComboRepository = dishComboRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    private List<DishOptionGroupDto> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<List<DishOptionGroupDto>>() {});
        } catch (Exception e) {
            log.warn("Lỗi parse JSON options món ăn: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private String serializeOptions(List<DishOptionGroupDto> options) {
        if (options == null || options.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(options);
        } catch (Exception e) {
            log.warn("Lỗi serialize options sang JSON: {}", e.getMessage());
            return "[]";
        }
    }

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

        return PageResponse.from(dishPage, d -> DishResponseDto.fromEntity(
                d,
                Boolean.TRUE.equals(d.getIsCombo()) ? loadComboItems(d.getId()) : Collections.emptyList(),
                parseOptions(d.getOptions())
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DishResponseDto> getDishes(String category, String search, Boolean isAvailable) {
        return dishRepository.findDishes(
                normalizeFilter(category),
                normalizeSearch(search),
                isAvailable
        ).stream().map(d -> DishResponseDto.fromEntity(
                d,
                Boolean.TRUE.equals(d.getIsCombo()) ? loadComboItems(d.getId()) : Collections.emptyList(),
                parseOptions(d.getOptions())
        )).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DishResponseDto getDishById(UUID id) {
        DishEntity dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn với ID: " + id));
        return DishResponseDto.fromEntity(
                dish,
                Boolean.TRUE.equals(dish.getIsCombo()) ? loadComboItems(dish.getId()) : Collections.emptyList(),
                parseOptions(dish.getOptions())
        );
    }

    @Override
    @Transactional
    public DishResponseDto createDish(CreateDishRequest request) {
        String trimmedName = request.name().trim();
        if (dishRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Món ăn với tên '" + trimmedName + "' đã tồn tại trong thực đơn");
        }

        DishCategory categoryEnum = DishCategory.fromCode(request.category())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Danh mục không hợp lệ: '" + request.category() + "'. Danh mục hợp lệ: " + Arrays.toString(DishCategory.values())));

        validateAndNormalizeOptions(request.options());

        Instant now = Instant.now();
        DishEntity dish = DishEntity.builder()
                .id(UUID.randomUUID())
                .name(trimmedName)
                .description(request.description() != null ? request.description().trim() : null)
                .price(request.price())
                .category(categoryEnum.name())
                .categoryId(categoryEnum.getDefaultCategoryId())
                .imageUrl(request.imageUrl() != null ? request.imageUrl().trim() : null)
                .isAvailable(request.isAvailable() != null ? request.isAvailable() : true)
                .isCombo(request.isCombo() != null ? request.isCombo() : false)
                .soldOutReason(Boolean.FALSE.equals(request.isAvailable()) ? "Tạm ngưng phục vụ" : null)
                .options(serializeOptions(request.options()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        DishEntity saved = dishRepository.save(dish);

        List<ComboItemResponse> comboItems = Collections.emptyList();
        if (Boolean.TRUE.equals(saved.getIsCombo()) && request.comboItems() != null && !request.comboItems().isEmpty()) {
            comboItems = saveComboItems(saved.getId(), request.comboItems());
        }

        log.info("Đã tạo mới món ăn ID: {}, Tên: '{}', Giá: {} VND, Danh mục: {}, isCombo: {}",
                saved.getId(), saved.getName(), saved.getPrice(), saved.getCategory(), saved.getIsCombo());

        return DishResponseDto.fromEntity(saved, comboItems, parseOptions(saved.getOptions()));
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

        DishCategory categoryEnum = DishCategory.fromCode(request.category())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Danh mục không hợp lệ: '" + request.category() + "'. Danh mục hợp lệ: " + Arrays.toString(DishCategory.values())));

        dish.setName(trimmedName);
        dish.setDescription(request.description() != null ? request.description().trim() : null);
        dish.setPrice(request.price());
        dish.setCategory(categoryEnum.name());
        dish.setCategoryId(categoryEnum.getDefaultCategoryId());
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

        if (request.options() != null) {
            validateAndNormalizeOptions(request.options());
            dish.setOptions(serializeOptions(request.options()));
        }

        dish.setUpdatedAt(Instant.now());
        DishEntity updated = dishRepository.save(dish);

        List<ComboItemResponse> comboItems = Collections.emptyList();
        if (Boolean.TRUE.equals(updated.getIsCombo())) {
            if (request.comboItems() != null) {
                dishComboRepository.deleteByComboDishId(id);
                comboItems = saveComboItems(id, request.comboItems());
            } else {
                comboItems = loadComboItems(id);
            }
        }

        log.info("Đã cập nhật món ăn ID: {}, Tên: '{}', Giá: {} VND", updated.getId(), updated.getName(), updated.getPrice());

        return DishResponseDto.fromEntity(updated, comboItems, parseOptions(updated.getOptions()));
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

        List<ComboItemResponse> comboItems = Boolean.TRUE.equals(updated.getIsCombo()) ? loadComboItems(id) : Collections.emptyList();
        return DishResponseDto.fromEntity(updated, comboItems, parseOptions(updated.getOptions()));
    }

    @Override
    @Transactional
    public void deleteDish(UUID id) {
        DishEntity dish = dishRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn với ID: " + id));

        dishComboRepository.deleteByComboDishId(id);
        dishRepository.delete(dish);
        log.info("Đã xóa món ăn ID: {}, Tên: '{}'", id, dish.getName());
    }

    private List<ComboItemResponse> saveComboItems(UUID comboDishId, List<ComboItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }
        List<DishComboEntity> entities = new ArrayList<>();
        Set<UUID> seenIds = new HashSet<>();
        Instant now = Instant.now();

        for (ComboItemRequest itemReq : items) {
            UUID itemDishId = itemReq.dishId();
            if (itemDishId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID món con trong combo không được để trống");
            }
            if (!seenIds.add(itemDishId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Danh sách món con trong combo bị trùng lặp dishId: " + itemDishId);
            }
            if (comboDishId.equals(itemDishId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Món combo không thể tự chứa chính nó làm món con");
            }
            DishEntity subDish = dishRepository.findById(itemDishId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Món con với ID '" + itemDishId + "' không tồn tại trong thực đơn"));

            if (Boolean.TRUE.equals(subDish.getIsCombo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Món con '" + subDish.getName() + "' là một combo, không thể lồng combo bên trong combo");
            }

            entities.add(DishComboEntity.builder()
                    .id(UUID.randomUUID())
                    .comboDishId(comboDishId)
                    .itemDishId(itemDishId)
                    .quantity(itemReq.quantity() != null && itemReq.quantity() > 0 ? itemReq.quantity() : 1)
                    .createdAt(now)
                    .build());
        }

        dishComboRepository.saveAll(entities);
        return loadComboItems(comboDishId);
    }

    private List<ComboItemResponse> loadComboItems(UUID comboDishId) {
        List<DishComboEntity> combos = dishComboRepository.findByComboDishId(comboDishId);
        if (combos.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> subDishIds = combos.stream().map(DishComboEntity::getItemDishId).toList();
        Map<UUID, DishEntity> dishMap = dishRepository.findAllById(subDishIds).stream()
                .collect(Collectors.toMap(DishEntity::getId, d -> d));

        return combos.stream().map(c -> {
            DishEntity sub = dishMap.get(c.getItemDishId());
            return new ComboItemResponse(
                    c.getId(),
                    c.getItemDishId(),
                    sub != null ? sub.getName() : "Món đã bị xóa",
                    sub != null ? sub.getPrice() : 0L,
                    sub != null ? sub.getCategory() : null,
                    sub != null ? sub.getImageUrl() : null,
                    c.getQuantity()
            );
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return Arrays.stream(DishCategory.values())
                .map(Enum::name)
                .toList();
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return DishCategory.fromCode(value.trim())
                .map(Enum::name)
                .orElse(value.trim());
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }

    private void validateAndNormalizeOptions(List<DishOptionGroupDto> options) {
        if (options == null || options.isEmpty()) {
            return;
        }

        Set<String> groupIds = new HashSet<>();
        for (DishOptionGroupDto group : options) {
            if (group.id() == null || group.id().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID nhóm tùy chọn không được để trống");
            }
            if (!groupIds.add(group.id())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trùng ID nhóm tùy chọn: " + group.id());
            }
            if (group.name() == null || group.name().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên nhóm tùy chọn không được để trống");
            }

            int minSel = group.minSelections() != null ? group.minSelections() : (Boolean.TRUE.equals(group.isRequired()) ? 1 : 0);
            int maxSel = group.maxSelections() != null ? group.maxSelections() : 1;

            if (minSel < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "minSelections không được nhỏ hơn 0");
            }
            if (maxSel < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxSelections phải từ 1 trở lên");
            }
            if (maxSel < minSel) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxSelections không được nhỏ hơn minSelections");
            }
            if (Boolean.TRUE.equals(group.isRequired()) && minSel < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhóm bắt buộc chọn phải có minSelections >= 1");
            }

            if (group.items() == null || group.items().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhóm tùy chọn '" + group.name() + "' phải có ít nhất 1 lựa chọn con");
            }

            Set<String> itemIds = new HashSet<>();
            int defaultCount = 0;
            for (DishOptionItemDto item : group.items()) {
                if (item.id() == null || item.id().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID lựa chọn không được để trống");
                }
                if (!itemIds.add(item.id())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trùng ID lựa chọn trong cùng một nhóm: " + item.id());
                }
                if (item.name() == null || item.name().isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên lựa chọn con không được để trống");
                }
                if (item.extraPrice() == null || item.extraPrice() < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá phụ thu không được âm");
                }
                if (Boolean.TRUE.equals(item.isDefault())) {
                    defaultCount++;
                }
            }

            if (maxSel == 1 && defaultCount > 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhóm chọn 1 duy nhất không được có quá 1 lựa chọn mặc định");
            }
        }
    }
}
