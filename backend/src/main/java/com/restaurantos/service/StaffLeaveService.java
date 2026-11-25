package com.restaurantos.service;

import com.restaurantos.common.dto.CreateLeaveRequestDto;
import com.restaurantos.common.dto.LeaveBalanceDto;
import com.restaurantos.common.dto.LeaveRequestDto;
import com.restaurantos.entity.LeaveRequestEntity;
import com.restaurantos.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffLeaveService {

    public static final int DEFAULT_ANNUAL_LEAVE_QUOTA = 12;

    private final LeaveRequestRepository leaveRequestRepository;

    @Transactional(readOnly = true)
    public LeaveBalanceDto getLeaveBalance(UUID staffId) {
        if (staffId == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        List<LeaveRequestEntity> requests = leaveRequestRepository.findByStaffIdOrderByCreatedAtDesc(staffId);

        int usedDays = requests.stream()
                .filter(r -> "ANNUAL".equalsIgnoreCase(r.getType()) && "APPROVED".equalsIgnoreCase(r.getStatus()))
                .mapToInt(r -> r.getCalendarDays() != null ? r.getCalendarDays() : 1)
                .sum();

        // Hold Pending Days: trừ tạm số ngày phép năm đang chờ duyệt để chống gửi trùng vượt quota
        int pendingAnnualDays = requests.stream()
                .filter(r -> "ANNUAL".equalsIgnoreCase(r.getType()) && "PENDING".equalsIgnoreCase(r.getStatus()))
                .mapToInt(r -> r.getCalendarDays() != null ? r.getCalendarDays() : 1)
                .sum();

        int pendingCount = (int) requests.stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .count();

        int remainingDays = Math.max(0, DEFAULT_ANNUAL_LEAVE_QUOTA - usedDays - pendingAnnualDays);

        return new LeaveBalanceDto(
                staffId,
                DEFAULT_ANNUAL_LEAVE_QUOTA,
                usedDays,
                remainingDays,
                pendingCount
        );
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getLeaveRequests(UUID staffId) {
        if (staffId == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        return leaveRequestRepository.findByStaffIdOrderByCreatedAtDesc(staffId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeaveRequestDto createLeaveRequest(CreateLeaveRequestDto request) {
        if (request.getStaffId() == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Ngày bắt đầu và ngày kết thúc không được để trống");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc không được trước ngày bắt đầu");
        }
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new IllegalArgumentException("Lý do xin nghỉ không được để trống");
        }

        // 1. Kiểm tra Idempotency
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            var existing = leaveRequestRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                return toDto(existing.get());
            }
        }

        int calendarDays = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        // 2. Nếu là phép năm (ANNUAL), kiểm tra số ngày khả dụng (đã trừ cả APPROVED và PENDING giữ chỗ)
        if ("ANNUAL".equalsIgnoreCase(request.getType())) {
            LeaveBalanceDto balance = getLeaveBalance(request.getStaffId());
            if (calendarDays > balance.getRemainingDays()) {
                throw new IllegalArgumentException(
                        String.format("Số ngày nghỉ (%d ngày) vượt quá quỹ phép năm khả dụng (%d ngày)",
                                calendarDays, balance.getRemainingDays())
                );
            }
        }

        LeaveRequestEntity entity = new LeaveRequestEntity();
        entity.setStaffId(request.getStaffId());
        entity.setStaffName(
                request.getStaffName() != null && !request.getStaffName().isBlank()
                        ? request.getStaffName()
                        : "Nhân Viên Vận Hành"
        );
        entity.setType(request.getType().toUpperCase());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setReason(request.getReason().trim());
        entity.setStatus("PENDING");
        entity.setCalendarDays(calendarDays);
        entity.setAffectedShifts(calendarDays);
        entity.setIdempotencyKey(request.getIdempotencyKey());
        entity.setCreatedAt(OffsetDateTime.now());
        entity.setUpdatedAt(OffsetDateTime.now());

        LeaveRequestEntity saved = leaveRequestRepository.save(entity);
        return toDto(saved);
    }

    /**
     * Rút đơn xin nghỉ (Soft Cancel: status = CANCELLED để bảo toàn Audit Trail).
     */
    @Transactional
    public LeaveRequestDto withdrawLeaveRequest(UUID leaveId, UUID currentUserId, boolean isManagerOrOwner) {
        LeaveRequestEntity entity = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn xin nghỉ"));

        if (currentUserId != null && !isManagerOrOwner && !currentUserId.equals(entity.getStaffId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền rút đơn xin nghỉ của nhân viên khác");
        }

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể rút đơn xin nghỉ khi đang ở trạng thái Chờ duyệt");
        }

        entity.setStatus("CANCELLED");
        entity.setUpdatedAt(OffsetDateTime.now());
        LeaveRequestEntity saved = leaveRequestRepository.save(entity);
        return toDto(saved);
    }

    /**
     * Phê duyệt đơn xin nghỉ phép (dành cho Quản lý / Chủ nhà hàng - UC_MGR_09).
     */
    @Transactional
    public LeaveRequestDto approveLeaveRequest(UUID leaveId, String approverName) {
        LeaveRequestEntity entity = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn xin nghỉ"));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể phê duyệt đơn xin nghỉ đang ở trạng thái Chờ duyệt");
        }

        entity.setStatus("APPROVED");
        entity.setApprovedBy(approverName != null && !approverName.isBlank() ? approverName : "Quản lý");
        entity.setUpdatedAt(OffsetDateTime.now());
        return toDto(leaveRequestRepository.save(entity));
    }

    /**
     * Từ chối đơn xin nghỉ phép (dành cho Quản lý / Chủ nhà hàng - UC_MGR_09).
     */
    @Transactional
    public LeaveRequestDto rejectLeaveRequest(UUID leaveId, String approverName) {
        LeaveRequestEntity entity = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn xin nghỉ"));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể từ chối đơn xin nghỉ đang ở trạng thái Chờ duyệt");
        }

        entity.setStatus("REJECTED");
        entity.setApprovedBy(approverName != null && !approverName.isBlank() ? approverName : "Quản lý");
        entity.setUpdatedAt(OffsetDateTime.now());
        return toDto(leaveRequestRepository.save(entity));
    }

    private LeaveRequestDto toDto(LeaveRequestEntity e) {
        return new LeaveRequestDto(
                e.getId(),
                e.getStaffId(),
                e.getStaffName(),
                e.getType(),
                e.getStartDate(),
                e.getEndDate(),
                e.getReason(),
                e.getStatus(),
                e.getApprovedBy(),
                e.getCreatedAt(),
                e.getCalendarDays(),
                e.getAffectedShifts(),
                e.getIdempotencyKey()
        );
    }
}
