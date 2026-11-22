package com.restaurantos.service;

import com.restaurantos.common.dto.OpenShiftDto;
import com.restaurantos.common.dto.ShiftRegistrationDto;
import com.restaurantos.entity.OpenShiftEntity;
import com.restaurantos.entity.ShiftRegistrationEntity;
import com.restaurantos.repository.OpenShiftRepository;
import com.restaurantos.repository.ShiftRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffScheduleService {

    private final OpenShiftRepository openShiftRepository;
    private final ShiftRegistrationRepository shiftRegistrationRepository;

    /**
     * Lấy danh sách các ca mở cho ngày cụ thể.
     */
    @Transactional(readOnly = true)
    public List<OpenShiftDto> listOpenShifts(LocalDate dateKey) {
        return openShiftRepository.findByDateKey(dateKey)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Đăng ký một ca cho nhân viên. Kiểm tra idempotencyKey, slot còn trống và không đăng ký trùng ngày.
     */
    @Transactional
    public ShiftRegistrationDto registerShift(ShiftRegistrationDto request) {
        // Idempotency check
        if (request.getIdempotencyKey() != null) {
            var existing = shiftRegistrationRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return toDto(existing.get());
            }
        }

        // Kiểm tra ca tồn tại (với pessimistic lock)
        OpenShiftEntity openShift = openShiftRepository.findByIdWithLock(request.getOpenShiftId())
                .orElseThrow(() -> new IllegalArgumentException("Open shift not found"));

        // Kiểm tra slot còn khả dụng
        if (openShift.getSlotsTaken() >= openShift.getSlotsTotal()) {
            throw new IllegalStateException("No available slots for this shift");
        }

        // Kiểm tra nhân viên chưa đăng ký trùng ngày
        boolean already = shiftRegistrationRepository.findByStaffIdAndDateKey(request.getStaffId(), request.getDateKey())
                .stream()
                .anyMatch(reg -> reg.getOpenShift().getId().equals(openShift.getId()));
        if (already) {
            throw new IllegalStateException("Staff already registered for a shift on this date");
        }

        // Tạo entity
        ShiftRegistrationEntity entity = new ShiftRegistrationEntity();
        entity.setStaffId(request.getStaffId());
        entity.setOpenShift(openShift);
        entity.setDateKey(request.getDateKey());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : "REGISTERED");
        entity.setNote(request.getNote());
        entity.setIdempotencyKey(request.getIdempotencyKey());
        shiftRegistrationRepository.save(entity);

        // Cập nhật slot
        openShift.setSlotsTaken(openShift.getSlotsTaken() + 1);
        openShiftRepository.save(openShift);

        return toDto(entity);
    }

    /**
     * Huỷ đăng ký.
     */
    @Transactional
    public void cancelRegistration(UUID registrationId) {
        ShiftRegistrationEntity entity = shiftRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        // Giảm slot
        OpenShiftEntity openShift = entity.getOpenShift();
        openShift.setSlotsTaken(Math.max(0, openShift.getSlotsTaken() - 1));
        openShiftRepository.save(openShift);
        // Xóa đăng ký
        shiftRegistrationRepository.delete(entity);
    }

    private OpenShiftDto toDto(OpenShiftEntity e) {
        return new OpenShiftDto(
                e.getId(),
                e.getDateKey(),
                e.getStartTime(),
                e.getEndTime(),
                e.getRole(),
                e.getTitle(),
                e.getZone(),
                e.getSlotsTotal(),
                e.getSlotsTaken(),
                e.getPostedById(),
                e.getNote()
        );
    }

    private ShiftRegistrationDto toDto(ShiftRegistrationEntity e) {
        return new ShiftRegistrationDto(
                e.getId(),
                e.getStaffId(),
                e.getOpenShift().getId(),
                e.getDateKey(),
                e.getStatus(),
                e.getNote(),
                e.getIdempotencyKey()
        );
    }
}
