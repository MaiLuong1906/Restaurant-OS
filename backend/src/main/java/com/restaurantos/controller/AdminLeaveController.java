package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.LeaveRequestDto;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.StaffLeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/leaves")
@RequiredArgsConstructor
@Tag(name = "Admin Leave Approval", description = "Phê duyệt hoặc từ chối đơn xin nghỉ phép của nhân viên (UC_MGR_09)")
public class AdminLeaveController {

    private final StaffLeaveService staffLeaveService;

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('HR:ROSTER_SHIFT:CREATE_APPROVE')")
    @Operation(summary = "Phê duyệt đơn xin nghỉ phép", description = "Chuyển trạng thái đơn từ PENDING sang APPROVED và trừ chính thức vào quỹ phép năm")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> approveLeave(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser) {
        String approverName = currentUser != null && currentUser.getFullName() != null
                ? currentUser.getFullName()
                : "Quản lý";
        LeaveRequestDto approved = staffLeaveService.approveLeaveRequest(id, approverName);
        return ResponseEntity.ok(ApiResponse.success(approved, "Phê duyệt đơn xin nghỉ thành công"));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('HR:ROSTER_SHIFT:CREATE_APPROVE')")
    @Operation(summary = "Từ chối đơn xin nghỉ phép", description = "Chuyển trạng thái đơn từ PENDING sang REJECTED và giải phóng số ngày phép đang giữ chỗ")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> rejectLeave(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser) {
        String approverName = currentUser != null && currentUser.getFullName() != null
                ? currentUser.getFullName()
                : "Quản lý";
        LeaveRequestDto rejected = staffLeaveService.rejectLeaveRequest(id, approverName);
        return ResponseEntity.ok(ApiResponse.success(rejected, "Từ chối đơn xin nghỉ thành công"));
    }
}
