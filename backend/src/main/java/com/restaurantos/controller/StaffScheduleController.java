package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.OpenShiftDto;
import com.restaurantos.common.dto.ShiftRegistrationDto;
import com.restaurantos.common.enums.Permission;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.StaffScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/schedule")
@RequiredArgsConstructor
@Tag(name = "Staff Schedule", description = "Quản lý ca làm việc, đăng ký và huỷ đăng ký")
@Validated
public class StaffScheduleController {

    private final StaffScheduleService staffScheduleService;

    @GetMapping("/open-shifts")
    @PreAuthorize("hasAuthority('HR:SCHEDULE_OPEN:VIEW')")
    @Operation(summary = "Lấy danh sách ca mở", description = "Trả về các ca mở cho ngày được chỉ định (yyyy-MM-dd)")
    public ResponseEntity<ApiResponse<List<OpenShiftDto>>> getOpenShifts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateKey) {
        List<OpenShiftDto> shifts = staffScheduleService.listOpenShifts(dateKey);
        return ResponseEntity.ok(ApiResponse.success(shifts, "Lấy danh sách ca mở thành công"));
    }

    @PostMapping("/registrations")
    @PreAuthorize("hasAuthority('HR:SHIFT_REGISTER:EXECUTE')")
    @Operation(summary = "Đăng ký ca làm việc", description = "Tạo một đăng ký mới cho nhân viên đang đăng nhập (idempotent, chống IDOR)")
    public ResponseEntity<ApiResponse<ShiftRegistrationDto>> registerShift(
            @Valid @RequestBody ShiftRegistrationDto request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đăng ký ca");
        }
        // Luôn ép buộc dùng ID của user đang đăng nhập để chống IDOR
        request.setStaffId(currentUser.getId());

        ShiftRegistrationDto result = staffScheduleService.registerShift(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Đăng ký ca thành công"));
    }

    @DeleteMapping("/registrations/{id}")
    @PreAuthorize("hasAuthority('HR:SHIFT_REGISTER:EXECUTE')")
    @Operation(summary = "Huỷ đăng ký", description = "Xóa một đăng ký theo UUID (kiểm tra quyền sở hữu hoặc quyền quản lý ca)")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để hủy ca");
        }
        boolean canManageOthers = hasScheduleApproveAuthority(authentication);
        staffScheduleService.cancelRegistration(id, currentUser.getId(), canManageOthers);
        return ResponseEntity.ok(ApiResponse.success(null, "Huỷ đăng ký thành công"));
    }

    private boolean hasScheduleApproveAuthority(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String required = Permission.HR_ROSTER_SHIFT_CREATE_APPROVE.getAuthority();
        return authentication.getAuthorities().stream()
                .anyMatch(a -> required.equals(a.getAuthority()));
    }
}
