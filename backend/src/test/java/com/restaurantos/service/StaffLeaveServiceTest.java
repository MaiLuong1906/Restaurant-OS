package com.restaurantos.service;

import com.restaurantos.common.dto.CreateLeaveRequestDto;
import com.restaurantos.common.dto.LeaveBalanceDto;
import com.restaurantos.common.dto.LeaveRequestDto;
import com.restaurantos.entity.LeaveRequestEntity;
import com.restaurantos.repository.LeaveRequestRepository;
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
class StaffLeaveServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @InjectMocks
    private StaffLeaveService staffLeaveService;

    private UUID staffId;

    @BeforeEach
    void setUp() {
        staffId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Tính đúng quỹ phép năm: totalDays = 12, trừ các đơn ANNUAL đã APPROVED")
    void getLeaveBalance_calculatesCorrectly() {
        LeaveRequestEntity approvedAnnual = new LeaveRequestEntity(
                UUID.randomUUID(), staffId, "Nhân Viên A", "ANNUAL",
                LocalDate.of(2026, 11, 10), LocalDate.of(2026, 11, 12),
                "Việc gia đình", "APPROVED", "Quản lý", 3, 3, "idem-1",
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        LeaveRequestEntity pendingSick = new LeaveRequestEntity(
                UUID.randomUUID(), staffId, "Nhân Viên A", "SICK",
                LocalDate.of(2026, 11, 20), LocalDate.of(2026, 11, 20),
                "Khám bệnh", "PENDING", null, 1, 1, "idem-2",
                OffsetDateTime.now(), OffsetDateTime.now()
        );

        when(leaveRequestRepository.findByStaffIdOrderByCreatedAtDesc(staffId))
                .thenReturn(List.of(pendingSick, approvedAnnual));

        LeaveBalanceDto balance = staffLeaveService.getLeaveBalance(staffId);

        assertThat(balance.getTotalDays()).isEqualTo(12);
        assertThat(balance.getUsedDays()).isEqualTo(3);
        assertThat(balance.getRemainingDays()).isEqualTo(9);
        assertThat(balance.getPendingRequestsCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Tạo đơn xin nghỉ phép năm thành công và tính đúng số ngày nghỉ")
    void createLeaveRequest_success() {
        when(leaveRequestRepository.findByIdempotencyKey("idem-create-1")).thenReturn(Optional.empty());
        when(leaveRequestRepository.findByStaffIdOrderByCreatedAtDesc(staffId)).thenReturn(Collections.emptyList());
        when(leaveRequestRepository.save(any(LeaveRequestEntity.class))).thenAnswer(inv -> {
            LeaveRequestEntity arg = inv.getArgument(0);
            arg.setId(UUID.randomUUID());
            return arg;
        });

        CreateLeaveRequestDto req = new CreateLeaveRequestDto(
                staffId, "Nhân Viên A", "ANNUAL",
                LocalDate.of(2026, 11, 16), LocalDate.of(2026, 11, 18),
                "Nghỉ phép năm", "idem-create-1"
        );

        LeaveRequestDto result = staffLeaveService.createLeaveRequest(req);

        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getCalendarDays()).isEqualTo(3);
        assertThat(result.getAffectedShifts()).isEqualTo(3);
        verify(leaveRequestRepository).save(any(LeaveRequestEntity.class));
    }

    @Test
    @DisplayName("Idempotency: gửi trùng idempotencyKey trả về bản ghi cũ, không tạo đơn mới")
    void createLeaveRequest_idempotent() {
        LeaveRequestEntity existing = new LeaveRequestEntity(
                UUID.randomUUID(), staffId, "Nhân Viên A", "SICK",
                LocalDate.of(2026, 11, 16), LocalDate.of(2026, 11, 16),
                "Nghỉ ốm", "PENDING", null, 1, 1, "idem-dup-leave",
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(leaveRequestRepository.findByIdempotencyKey("idem-dup-leave")).thenReturn(Optional.of(existing));

        CreateLeaveRequestDto req = new CreateLeaveRequestDto(
                staffId, "Nhân Viên A", "SICK",
                LocalDate.of(2026, 11, 16), LocalDate.of(2026, 11, 16),
                "Nghỉ ốm", "idem-dup-leave"
        );

        LeaveRequestDto result = staffLeaveService.createLeaveRequest(req);

        assertThat(result.getId()).isEqualTo(existing.getId());
        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("Từ chối tạo đơn ANNUAL khi vượt quá số ngày phép năm còn lại")
    void createLeaveRequest_throwsWhenExceedingAnnualQuota() {
        LeaveRequestEntity used11Days = new LeaveRequestEntity(
                UUID.randomUUID(), staffId, "Nhân Viên A", "ANNUAL",
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 11),
                "Nghỉ hè", "APPROVED", "Quản lý", 11, 11, "idem-old",
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(leaveRequestRepository.findByStaffIdOrderByCreatedAtDesc(staffId)).thenReturn(List.of(used11Days));

        CreateLeaveRequestDto req = new CreateLeaveRequestDto(
                staffId, "Nhân Viên A", "ANNUAL",
                LocalDate.of(2026, 11, 16), LocalDate.of(2026, 11, 18),
                "Xin nghỉ 3 ngày", "idem-over"
        );

        assertThatThrownBy(() -> staffLeaveService.createLeaveRequest(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vượt quá quỹ phép năm");
    }

    @Test
    @DisplayName("Rút đơn xin nghỉ PENDING chuyển trạng thái sang CANCELLED (Soft Cancel)")
    void withdrawLeaveRequest_softCancelsPendingRequest() {
        UUID leaveId = UUID.randomUUID();
        LeaveRequestEntity entity = new LeaveRequestEntity(
                leaveId, staffId, "Nhân Viên A", "UNPAID",
                LocalDate.of(2026, 11, 22), LocalDate.of(2026, 11, 22),
                "Việc cá nhân", "PENDING", null, 1, 1, "idem-w1",
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(leaveRequestRepository.findById(leaveId)).thenReturn(Optional.of(entity));
        when(leaveRequestRepository.save(entity)).thenReturn(entity);

        LeaveRequestDto result = staffLeaveService.withdrawLeaveRequest(leaveId, staffId, false);

        assertThat(result.getStatus()).isEqualTo("CANCELLED");
        verify(leaveRequestRepository).save(entity);
    }

    @Test
    @DisplayName("Chặn IDOR: nhân viên khác cố rút đơn xin nghỉ bị chặn với 403 FORBIDDEN")
    void withdrawLeaveRequest_blocksIdor() {
        UUID leaveId = UUID.randomUUID();
        UUID attackerId = UUID.randomUUID();
        LeaveRequestEntity entity = new LeaveRequestEntity(
                leaveId, staffId, "Nhân Viên A", "UNPAID",
                LocalDate.of(2026, 11, 22), LocalDate.of(2026, 11, 22),
                "Việc cá nhân", "PENDING", null, 1, 1, "idem-w2",
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(leaveRequestRepository.findById(leaveId)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> staffLeaveService.withdrawLeaveRequest(leaveId, attackerId, false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
