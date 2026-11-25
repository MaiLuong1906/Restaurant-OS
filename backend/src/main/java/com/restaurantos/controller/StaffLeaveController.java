package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.CreateLeaveRequestDto;
import com.restaurantos.common.dto.LeaveBalanceDto;
import com.restaurantos.common.dto.LeaveRequestDto;
import com.restaurantos.common.enums.Permission;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.StaffLeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/leaves")
@RequiredArgsConstructor
@Tag(name = "Staff Leave", description = "Quản lý quỹ phép năm và đơn xin nghỉ phép của nhân viên (UC_STF_04)")
@Validated
public class StaffLeaveController {

    private final StaffLeaveService staffLeaveService;

    @GetMapping("/balance")
    @PreAuthorize("hasAuthority('HR:SHIFT_SWAP_LEAVE:REQUEST')")
    @Operation(summary = "Lấy quỹ phép năm của nhân viên", description = "Trả về tổng số ngày phép, đã dùng, còn lại (đã trừ giữ chỗ PENDING) và số đơn đang chờ duyệt")
    public ResponseEntity<ApiResponse<LeaveBalanceDto>> getLeaveBalance(
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser, authentication);
        LeaveBalanceDto balance = staffLeaveService.getLeaveBalance(resolvedStaffId);
        return ResponseEntity.ok(ApiResponse.success(balance, "Lấy thông tin quỹ phép thành công"));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('HR:SHIFT_SWAP_LEAVE:REQUEST')")
    @Operation(summary = "Lấy danh sách đơn xin nghỉ của nhân viên", description = "Trả về danh sách đơn xin nghỉ sắp xếp theo thời gian mới nhất")
    public ResponseEntity<ApiResponse<List<LeaveRequestDto>>> getLeaveRequests(
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser, authentication);
        List<LeaveRequestDto> requests = staffLeaveService.getLeaveRequests(resolvedStaffId);
        return ResponseEntity.ok(ApiResponse.success(requests, "Lấy danh sách đơn xin nghỉ thành công"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('HR:SHIFT_SWAP_LEAVE:REQUEST')")
    @Operation(summary = "Gửi đơn xin nghỉ mới", description = "Tạo đơn xin nghỉ ở trạng thái PENDING (idempotent, kiểm tra quỹ phép năm và chống IDOR)")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequestDto request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để gửi đơn xin nghỉ");
        }
        // Luôn ép buộc dùng ID và họ tên của user đang đăng nhập để chống IDOR
        request.setStaffId(currentUser.getId());
        if (currentUser.getFullName() != null && !currentUser.getFullName().isBlank()) {
            request.setStaffName(currentUser.getFullName());
        }

        LeaveRequestDto created = staffLeaveService.createLeaveRequest(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Gửi đơn xin nghỉ thành công"));
    }

    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasAuthority('HR:SHIFT_SWAP_LEAVE:REQUEST')")
    @Operation(summary = "Rút đơn xin nghỉ", description = "Chuyển trạng thái đơn xin nghỉ đang PENDING sang CANCELLED (giữ Audit Trail)")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> withdrawLeaveRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để rút đơn xin nghỉ");
        }
        boolean canManageOthers = hasLeaveApproveAuthority(authentication);
        LeaveRequestDto withdrawn = staffLeaveService.withdrawLeaveRequest(id, currentUser.getId(), canManageOthers);
        return ResponseEntity.ok(ApiResponse.success(withdrawn, "Rút đơn xin nghỉ thành công"));
    }

    private UUID resolveStaffId(UUID requestStaffId, UserEntity currentUser, Authentication authentication) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để truy cập thông tin đơn nghỉ");
        }
        if (requestStaffId != null && hasLeaveApproveAuthority(authentication)) {
            return requestStaffId;
        }
        return currentUser.getId();
    }

    private boolean hasLeaveApproveAuthority(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String required = Permission.HR_ROSTER_SHIFT_CREATE_APPROVE.getAuthority();
        return authentication.getAuthorities().stream()
                .anyMatch(a -> required.equals(a.getAuthority()));
    }
}
