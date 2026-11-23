package com.restaurantos.service;

import com.restaurantos.common.dto.OpenShiftDto;
import com.restaurantos.common.dto.ShiftRegistrationDto;
import com.restaurantos.entity.OpenShiftEntity;
import com.restaurantos.entity.ShiftRegistrationEntity;
import com.restaurantos.repository.OpenShiftRepository;
import com.restaurantos.repository.ShiftRegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffScheduleServiceTest {

    @Mock
    private OpenShiftRepository openShiftRepository;

    @Mock
    private ShiftRegistrationRepository shiftRegistrationRepository;

    @InjectMocks
    private StaffScheduleService staffScheduleService;

    private UUID shiftId;
    private UUID staffId;
    private LocalDate dateKey;
    private OpenShiftEntity sampleOpenShift;

    @BeforeEach
    void setUp() {
        shiftId = UUID.randomUUID();
        staffId = UUID.randomUUID();
        dateKey = LocalDate.of(2026, 11, 25);

        sampleOpenShift = new OpenShiftEntity(
                shiftId,
                dateKey,
                LocalTime.of(8, 0),
                LocalTime.of(14, 0),
                "WAITER",
                "Ca sáng phục vụ",
                "Sảnh A",
                3,
                1,
                UUID.randomUUID(),
                "Đúng giờ",
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );
    }

    @Test
    @DisplayName("Lấy danh sách ca mở theo ngày thành công")
    void listOpenShifts_returnsDtos() {
        when(openShiftRepository.findByDateKey(dateKey)).thenReturn(List.of(sampleOpenShift));

        List<OpenShiftDto> result = staffScheduleService.listOpenShifts(dateKey);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(shiftId);
        assertThat(result.get(0).getSlotsTotal()).isEqualTo(3);
        assertThat(result.get(0).getSlotsTaken()).isEqualTo(1);
    }

    @Test
    @DisplayName("Đăng ký ca thành công - sử dụng Pessimistic Lock và tăng slotsTaken")
    void registerShift_success() {
        ShiftRegistrationDto request = new ShiftRegistrationDto(
                null, staffId, shiftId, dateKey, "REGISTERED", "Xin đăng ký", "idem-key-1"
        );

        when(shiftRegistrationRepository.findByIdempotencyKey("idem-key-1")).thenReturn(Optional.empty());
        when(openShiftRepository.findByIdWithLock(shiftId)).thenReturn(Optional.of(sampleOpenShift));
        when(shiftRegistrationRepository.findByStaffIdAndDateKey(staffId, dateKey)).thenReturn(Collections.emptyList());

        ShiftRegistrationDto result = staffScheduleService.registerShift(request);

        assertThat(result.getStaffId()).isEqualTo(staffId);
        assertThat(result.getOpenShiftId()).isEqualTo(shiftId);
        assertThat(sampleOpenShift.getSlotsTaken()).isEqualTo(2);
        verify(shiftRegistrationRepository).save(any(ShiftRegistrationEntity.class));
        verify(openShiftRepository).save(sampleOpenShift);
    }

    @Test
    @DisplayName("Đăng ký ca Idempotent - trùng idempotencyKey trả về bản ghi cũ, không tăng slot")
    void registerShift_idempotentReturnsExisting() {
        ShiftRegistrationEntity existing = new ShiftRegistrationEntity();
        existing.setId(UUID.randomUUID());
        existing.setStaffId(staffId);
        existing.setOpenShift(sampleOpenShift);
        existing.setDateKey(dateKey);
        existing.setStatus("REGISTERED");
        existing.setIdempotencyKey("idem-dup");

        when(shiftRegistrationRepository.findByIdempotencyKey("idem-dup")).thenReturn(Optional.of(existing));

        ShiftRegistrationDto request = new ShiftRegistrationDto(
                null, staffId, shiftId, dateKey, "REGISTERED", null, "idem-dup"
        );
        ShiftRegistrationDto result = staffScheduleService.registerShift(request);

        assertThat(result.getId()).isEqualTo(existing.getId());
        assertThat(sampleOpenShift.getSlotsTaken()).isEqualTo(1);
        verify(openShiftRepository, never()).findByIdWithLock(any());
        verify(shiftRegistrationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng ký ca thất bại khi đã hết slot - ném IllegalArgumentException")
    void registerShift_throwsWhenFull() {
        sampleOpenShift.setSlotsTaken(3);
        when(openShiftRepository.findByIdWithLock(shiftId)).thenReturn(Optional.of(sampleOpenShift));

        ShiftRegistrationDto request = new ShiftRegistrationDto(
                null, staffId, shiftId, dateKey, null, null, null
        );

        assertThatThrownBy(() -> staffScheduleService.registerShift(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết chỗ");
    }

    @Test
    @DisplayName("Đăng ký ca thất bại khi nhân viên đã đăng ký trùng ca - ném IllegalArgumentException")
    void registerShift_throwsWhenAlreadyRegistered() {
        ShiftRegistrationEntity existingReg = new ShiftRegistrationEntity();
        existingReg.setId(UUID.randomUUID());
        existingReg.setStaffId(staffId);
        existingReg.setOpenShift(sampleOpenShift);
        existingReg.setDateKey(dateKey);

        when(openShiftRepository.findByIdWithLock(shiftId)).thenReturn(Optional.of(sampleOpenShift));
        when(shiftRegistrationRepository.findByStaffIdAndDateKey(staffId, dateKey)).thenReturn(List.of(existingReg));

        ShiftRegistrationDto request = new ShiftRegistrationDto(
                null, staffId, shiftId, dateKey, null, null, null
        );

        assertThatThrownBy(() -> staffScheduleService.registerShift(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã đăng ký");
    }

    @Test
    @DisplayName("Hủy đăng ký ca thành công bởi chính nhân viên sở hữu - giảm slotsTaken với lock")
    void cancelRegistration_successByOwner() {
        UUID regId = UUID.randomUUID();
        ShiftRegistrationEntity entity = new ShiftRegistrationEntity();
        entity.setId(regId);
        entity.setStaffId(staffId);
        entity.setOpenShift(sampleOpenShift);

        when(shiftRegistrationRepository.findById(regId)).thenReturn(Optional.of(entity));
        when(openShiftRepository.findByIdWithLock(shiftId)).thenReturn(Optional.of(sampleOpenShift));

        staffScheduleService.cancelRegistration(regId, staffId, false);

        assertThat(sampleOpenShift.getSlotsTaken()).isEqualTo(0);
        verify(openShiftRepository).save(sampleOpenShift);
        verify(shiftRegistrationRepository).delete(entity);
    }

    @Test
    @DisplayName("Chặn IDOR: nhân viên khác cố hủy ca bị từ chối với 403 FORBIDDEN")
    void cancelRegistration_blocksIdorFromOtherStaff() {
        UUID regId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        ShiftRegistrationEntity entity = new ShiftRegistrationEntity();
        entity.setId(regId);
        entity.setStaffId(staffId);
        entity.setOpenShift(sampleOpenShift);

        when(shiftRegistrationRepository.findById(regId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> staffScheduleService.cancelRegistration(regId, attackerId, false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));

        verify(shiftRegistrationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("MANAGER hoặc OWNER được phép hủy ca của nhân viên bất kỳ")
    void cancelRegistration_allowedForManager() {
        UUID regId = UUID.randomUUID();
        UUID managerId = UUID.randomUUID();
        ShiftRegistrationEntity entity = new ShiftRegistrationEntity();
        entity.setId(regId);
        entity.setStaffId(staffId);
        entity.setOpenShift(sampleOpenShift);

        when(shiftRegistrationRepository.findById(regId)).thenReturn(Optional.of(entity));
        when(openShiftRepository.findByIdWithLock(shiftId)).thenReturn(Optional.of(sampleOpenShift));

        staffScheduleService.cancelRegistration(regId, managerId, true);

        assertThat(sampleOpenShift.getSlotsTaken()).isEqualTo(0);
        verify(shiftRegistrationRepository).delete(entity);
    }
}
