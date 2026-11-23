package com.restaurantos.service;

import com.restaurantos.common.dto.OpenShiftDto;
import com.restaurantos.common.dto.ShiftRegistrationDto;
import com.restaurantos.entity.OpenShiftEntity;
import com.restaurantos.entity.ShiftRegistrationEntity;
import com.restaurantos.repository.OpenShiftRepository;
import com.restaurantos.repository.ShiftRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
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
     * Đăng ký một ca cho nhân viên.
     * Kiểm tra idempotencyKey, khóa ghi Pessimistic Lock chống overselling, và chống đăng ký trùng ca.
     */
    @Transactional
    public ShiftRegistrationDto registerShift(ShiftRegistrationDto request) {
        if (request.getStaffId() == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }

        // 1. Kiểm tra Idempotency
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            var existing = shiftRegistrationRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return toDto(existing.get());
            }
        }

        // 2. Khóa ghi ca mở chống overselling (Pessimistic Write Lock)
        OpenShiftEntity openShift = openShiftRepository.findByIdWithLock(request.getOpenShiftId())
                .orElseThrow(() -> new IllegalArgumentException("Ca làm việc không tồn tại"));

        // 3. Kiểm tra slot còn khả dụng
        if (openShift.getSlotsTaken() >= openShift.getSlotsTotal()) {
            throw new IllegalArgumentException("Ca làm việc đã hết chỗ khả dụng");
        }

        // 4. Kiểm tra nhân viên chưa đăng ký trùng ca làm việc này
        boolean alreadyRegistered = shiftRegistrationRepository
                .findByStaffIdAndDateKey(request.getStaffId(), request.getDateKey())
                .stream()
                .anyMatch(reg -> reg.getOpenShift().getId().equals(openShift.getId()));
        if (alreadyRegistered) {
            throw new IllegalArgumentException("Nhân viên đã đăng ký ca làm việc này");
        }

        // 5. Tạo bản ghi đăng ký và cập nhật slot an toàn
        ShiftRegistrationEntity entity = new ShiftRegistrationEntity();
        entity.setStaffId(request.getStaffId());
        entity.setOpenShift(openShift);
        entity.setDateKey(request.getDateKey());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : "REGISTERED");
        entity.setNote(request.getNote());
        entity.setIdempotencyKey(request.getIdempotencyKey());
        shiftRegistrationRepository.save(entity);

        openShift.setSlotsTaken(openShift.getSlotsTaken() + 1);
        openShiftRepository.save(openShift);

        return toDto(entity);
    }

    /**
     * Huỷ đăng ký ca làm việc (hỗ trợ kiểm tra quyền sở hữu chống IDOR và khóa ghi Pessimistic Lock).
     */
    @Transactional
    public void cancelRegistration(UUID registrationId, UUID currentUserId, boolean isManagerOrOwner) {
        ShiftRegistrationEntity entity = shiftRegistrationRepository.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi đăng ký ca"));

        if (currentUserId != null && !isManagerOrOwner && !currentUserId.equals(entity.getStaffId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền hủy ca của nhân viên khác");
        }

        OpenShiftEntity openShift = openShiftRepository.findByIdWithLock(entity.getOpenShift().getId())
                .orElse(entity.getOpenShift());
        openShift.setSlotsTaken(Math.max(0, openShift.getSlotsTaken() - 1));
        openShiftRepository.save(openShift);

        shiftRegistrationRepository.delete(entity);
    }

    @Transactional
    public void cancelRegistration(UUID registrationId) {
        cancelRegistration(registrationId, null, false);
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
