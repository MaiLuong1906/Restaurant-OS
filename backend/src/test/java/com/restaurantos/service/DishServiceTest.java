package com.restaurantos.service;

import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.dish.ComboItemRequest;
import com.restaurantos.common.dto.dish.CreateDishRequest;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.common.dto.dish.UpdateDishRequest;
import com.restaurantos.entity.DishComboEntity;
import com.restaurantos.entity.DishEntity;
import com.restaurantos.repository.DishComboRepository;
import com.restaurantos.repository.DishRepository;
import com.restaurantos.service.impl.DishServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DishServiceTest {

    @Mock
    private DishRepository dishRepository;

    @Mock
    private DishComboRepository dishComboRepository;

    @org.mockito.Spy
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @InjectMocks
    private DishServiceImpl dishService;

    private DishEntity sampleDish;
    private UUID sampleId;

    @BeforeEach
    void setUp() {
        sampleId = UUID.randomUUID();
        sampleDish = DishEntity.builder()
                .id(sampleId)
                .name("Bò Lúc Lắc Wagyu A4")
                .description("Thịt bò Wagyu áp chảo sốt tiêu đen")
                .price(480000L)
                .category("MAIN")
                .categoryId(UUID.fromString("00000000-0000-0000-0000-000000000052"))
                .imageUrl("https://example.com/dish.jpg")
                .isAvailable(true)
                .isCombo(false)
                .soldOutReason(null)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách món có phân trang thành công")
    void getDishesPaged_Success() {
        PageImpl<DishEntity> page = new PageImpl<>(List.of(sampleDish));
        when(dishRepository.findDishesPaged(eq("MAIN"), eq("bò"), eq(true), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<DishResponseDto> result = dishService.getDishesPaged("MAIN", "bò", true, 0, 10);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Bò Lúc Lắc Wagyu A4");
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Lấy danh sách món không phân trang thành công")
    void getDishes_Success() {
        when(dishRepository.findDishes(eq("MAIN"), isNull(), eq(true)))
                .thenReturn(List.of(sampleDish));

        List<DishResponseDto> result = dishService.getDishes("MAIN", null, true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).category()).isEqualTo("MAIN");
    }

    @Test
    @DisplayName("Lấy chi tiết món ăn theo ID thành công")
    void getDishById_Success() {
        when(dishRepository.findById(sampleId)).thenReturn(Optional.of(sampleDish));

        DishResponseDto result = dishService.getDishById(sampleId);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(sampleId);
        assertThat(result.price()).isEqualTo(480000L);
    }

    @Test
    @DisplayName("Lấy chi tiết món ăn ném 404 khi không tồn tại")
    void getDishById_NotFound_ThrowsException() {
        UUID randomId = UUID.randomUUID();
        when(dishRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dishService.getDishById(randomId))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    @DisplayName("Tạo mới món ăn thành công với giá VND hợp lệ")
    void createDish_Success() {
        CreateDishRequest request = new CreateDishRequest(
                "Phở Bò Tái Lăn",
                "Phở bò tái lăn gia truyền",
                65000L,
                "MON_CHINH",
                "https://example.com/pho.jpg",
                true,
                false,
                null
        );

        when(dishRepository.existsByNameIgnoreCase("Phở Bò Tái Lăn")).thenReturn(false);
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DishResponseDto result = dishService.createDish(request);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Phở Bò Tái Lăn");
        assertThat(result.price()).isEqualTo(65000L);
        assertThat(result.category()).isEqualTo("MAIN");
        assertThat(result.isAvailable()).isTrue();
        assertThat(result.id()).isNotNull();

        verify(dishRepository, times(1)).save(any(DishEntity.class));
    }

    @Test
    @DisplayName("Tạo mới món ăn ném 409 CONFLICT khi tên món đã tồn tại")
    void createDish_ConflictName_ThrowsException() {
        CreateDishRequest request = new CreateDishRequest(
                "Bò Lúc Lắc Wagyu A4",
                "Mô tả",
                480000L,
                "MON_CHINH",
                null,
                true,
                false,
                null
        );

        when(dishRepository.existsByNameIgnoreCase("Bò Lúc Lắc Wagyu A4")).thenReturn(true);

        assertThatThrownBy(() -> dishService.createDish(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                });

        verify(dishRepository, never()).save(any(DishEntity.class));
    }

    @Test
    @DisplayName("Cập nhật thông tin món ăn thành công")
    void updateDish_Success() {
        UpdateDishRequest request = new UpdateDishRequest(
                "Bò Lúc Lắc Wagyu Thượng Hạng",
                "Mô tả mới",
                520000L,
                "MON_CHINH",
                "https://example.com/new.jpg",
                true,
                false,
                null,
                null
        );

        when(dishRepository.findById(sampleId)).thenReturn(Optional.of(sampleDish));
        when(dishRepository.existsByNameIgnoreCaseAndIdNot("Bò Lúc Lắc Wagyu Thượng Hạng", sampleId)).thenReturn(false);
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DishResponseDto result = dishService.updateDish(sampleId, request);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Bò Lúc Lắc Wagyu Thượng Hạng");
        assertThat(result.price()).isEqualTo(520000L);
        verify(dishRepository, times(1)).save(any(DishEntity.class));
    }

    @Test
    @DisplayName("Cập nhật món ăn ném 409 khi tên mới bị trùng với món khác")
    void updateDish_DuplicateName_ThrowsException() {
        UpdateDishRequest request = new UpdateDishRequest(
                "Cơm Gà Xối Mỡ",
                null,
                55000L,
                "MON_CHINH",
                null,
                true,
                false,
                null,
                null
        );

        when(dishRepository.findById(sampleId)).thenReturn(Optional.of(sampleDish));
        when(dishRepository.existsByNameIgnoreCaseAndIdNot("Cơm Gà Xối Mỡ", sampleId)).thenReturn(true);

        assertThatThrownBy(() -> dishService.updateDish(sampleId, request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                });

        verify(dishRepository, never()).save(any(DishEntity.class));
    }

    @Test
    @DisplayName("Cập nhật trạng thái hết món (isAvailable = false) kèm lý do thành công")
    void updateAvailability_SoldOut_Success() {
        UpdateDishAvailabilityRequest request = new UpdateDishAvailabilityRequest(false, "Hết thịt bò");

        when(dishRepository.findById(sampleId)).thenReturn(Optional.of(sampleDish));
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DishResponseDto result = dishService.updateAvailability(sampleId, request);

        assertThat(result.isAvailable()).isFalse();
        assertThat(result.soldOutReason()).isEqualTo("Hết thịt bò");
    }

    @Test
    @DisplayName("Mở lại món (isAvailable = true) tự động xóa lý do hết món")
    void updateAvailability_BackInStock_Success() {
        sampleDish.setIsAvailable(false);
        sampleDish.setSoldOutReason("Hết nguyên liệu");

        UpdateDishAvailabilityRequest request = new UpdateDishAvailabilityRequest(true, null);

        when(dishRepository.findById(sampleId)).thenReturn(Optional.of(sampleDish));
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DishResponseDto result = dishService.updateAvailability(sampleId, request);

        assertThat(result.isAvailable()).isTrue();
        assertThat(result.soldOutReason()).isNull();
    }

    @Test
    @DisplayName("Xóa món ăn thành công")
    void deleteDish_Success() {
        when(dishRepository.findById(sampleId)).thenReturn(Optional.of(sampleDish));

        dishService.deleteDish(sampleId);

        verify(dishComboRepository, times(1)).deleteByComboDishId(sampleId);
        verify(dishRepository, times(1)).delete(sampleDish);
    }

    @Test
    @DisplayName("Tạo món Combo với danh sách món con thành công")
    void createDish_ComboWithItems_Success() {
        UUID subDishId = UUID.randomUUID();
        DishEntity subDish = DishEntity.builder()
                .id(subDishId)
                .name("Trà Đào Cam Sả")
                .price(30000L)
                .category("DRINK")
                .isCombo(false)
                .build();

        CreateDishRequest request = new CreateDishRequest(
                "Combo 1 Người",
                "Combo cơm và nước",
                79000L,
                "COMBO",
                null,
                true,
                true,
                List.of(new ComboItemRequest(subDishId, 1))
        );

        when(dishRepository.existsByNameIgnoreCase("Combo 1 Người")).thenReturn(false);
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dishRepository.findById(subDishId)).thenReturn(Optional.of(subDish));
        when(dishComboRepository.findByComboDishId(any(UUID.class))).thenReturn(List.of(
                DishComboEntity.builder()
                        .id(UUID.randomUUID())
                        .comboDishId(UUID.randomUUID())
                        .itemDishId(subDishId)
                        .quantity(1)
                        .createdAt(Instant.now())
                        .build()
        ));
        when(dishRepository.findAllById(List.of(subDishId))).thenReturn(List.of(subDish));

        DishResponseDto result = dishService.createDish(request);

        assertThat(result).isNotNull();
        assertThat(result.isCombo()).isTrue();
        assertThat(result.comboItems()).hasSize(1);
        assertThat(result.comboItems().get(0).dishName()).isEqualTo("Trà Đào Cam Sả");
        verify(dishComboRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("Tạo món Combo với món con bị trùng dishId ném lỗi 400 Bad Request")
    void createDish_ComboWithDuplicateDishId_ThrowsBadRequest() {
        UUID subDishId = UUID.randomUUID();
        DishEntity subDish = DishEntity.builder()
                .id(subDishId)
                .name("Trà Đào Cam Sả")
                .price(30000L)
                .category("DRINK")
                .isCombo(false)
                .build();

        CreateDishRequest request = new CreateDishRequest(
                "Combo Trùng Món",
                "Mô tả",
                99000L,
                "COMBO",
                null,
                true,
                true,
                List.of(
                        new ComboItemRequest(subDishId, 1),
                        new ComboItemRequest(subDishId, 2)
                )
        );

        when(dishRepository.existsByNameIgnoreCase("Combo Trùng Món")).thenReturn(false);
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(dishRepository.findById(subDishId)).thenReturn(Optional.of(subDish));

        org.springframework.web.server.ResponseStatusException ex = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> dishService.createDish(request)
        );

        assertThat(ex.getStatusCode()).isEqualTo(org.springframework.http.HttpStatus.BAD_REQUEST);
        assertThat(ex.getReason()).contains("trùng lặp dishId");
    }
}
