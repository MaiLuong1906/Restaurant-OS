package com.restaurantos.service;

import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.dish.CreateDishRequest;
import com.restaurantos.common.dto.dish.DishResponseDto;
import com.restaurantos.common.dto.dish.UpdateDishAvailabilityRequest;
import com.restaurantos.common.dto.dish.UpdateDishRequest;
import com.restaurantos.entity.DishEntity;
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
                .category("MON_CHINH")
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
        when(dishRepository.findDishesPaged(eq("MON_CHINH"), eq("bò"), eq(true), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<DishResponseDto> result = dishService.getDishesPaged("MON_CHINH", "bò", true, 0, 10);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).name()).isEqualTo("Bò Lúc Lắc Wagyu A4");
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Lấy danh sách món không phân trang thành công")
    void getDishes_Success() {
        when(dishRepository.findDishes(eq("MON_CHINH"), isNull(), eq(true)))
                .thenReturn(List.of(sampleDish));

        List<DishResponseDto> result = dishService.getDishes("MON_CHINH", null, true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).category()).isEqualTo("MON_CHINH");
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
                false
        );

        when(dishRepository.existsByNameIgnoreCase("Phở Bò Tái Lăn")).thenReturn(false);
        when(dishRepository.save(any(DishEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DishResponseDto result = dishService.createDish(request);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Phở Bò Tái Lăn");
        assertThat(result.price()).isEqualTo(65000L);
        assertThat(result.category()).isEqualTo("MON_CHINH");
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
                false
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

        verify(dishRepository, times(1)).delete(sampleDish);
    }
}
