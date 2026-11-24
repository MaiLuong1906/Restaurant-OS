package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.CreateLeaveRequestDto;
import com.restaurantos.common.dto.LeaveBalanceDto;
import com.restaurantos.common.dto.LeaveRequestDto;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.StaffLeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

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
    @Operation(summary = "Lấy quỹ phép năm của nhân viên", description = "Trả về tổng số ngày phép, đã dùng, còn lại và số đơn đang chờ duyệt")
    public ResponseEntity<ApiResponse<LeaveBalanceDto>> getLeaveBalance(
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser);
        LeaveBalanceDto balance = staffLeaveService.getLeaveBalance(resolvedStaffId);
        return ResponseEntity.ok(ApiResponse.success(balance, "Lấy thông tin quỹ phép thành công"));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách đơn xin nghỉ của nhân viên", description = "Trả về danh sách đơn xin nghỉ sắp xếp theo thời gian mới nhất")
    public ResponseEntity<ApiResponse<List<LeaveRequestDto>>> getLeaveRequests(
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser);
        List<LeaveRequestDto> requests = staffLeaveService.getLeaveRequests(resolvedStaffId);
        return ResponseEntity.ok(ApiResponse.success(requests, "Lấy danh sách đơn xin nghỉ thành công"));
    }

    @PostMapping
    @Operation(summary = "Gửi đơn xin nghỉ mới", description = "Tạo đơn xin nghỉ ở trạng thái PENDING (idempotent, kiểm tra quỹ phép năm)")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequestDto request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser != null && currentUser.getId() != null) {
            request.setStaffId(currentUser.getId());
            if (currentUser.getFullName() != null) {
                request.setStaffName(currentUser.getFullName());
            }
        } else if (request.getStaffId() == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }

        LeaveRequestDto created = staffLeaveService.createLeaveRequest(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Gửi đơn xin nghỉ thành công"));
    }

    @PatchMapping("/{id}/withdraw")
    @Operation(summary = "Rút đơn xin nghỉ", description = "Chuyển trạng thái đơn xin nghỉ đang PENDING sang CANCELLED (giữ Audit Trail)")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> withdrawLeaveRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;
        boolean isManagerOrOwner = isManagerOrOwner(currentUser);
        LeaveRequestDto withdrawn = staffLeaveService.withdrawLeaveRequest(id, currentUserId, isManagerOrOwner);
        return ResponseEntity.ok(ApiResponse.success(withdrawn, "Rút đơn xin nghỉ thành công"));
    }

    private UUID resolveStaffId(UUID requestStaffId, UserEntity currentUser) {
        if (currentUser != null && currentUser.getId() != null) {
            return currentUser.getId();
        }
        if (requestStaffId == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        return requestStaffId;
    }

    private boolean isManagerOrOwner(UserEntity currentUser) {
        if (currentUser != null && currentUser.getRole() != null && currentUser.getRole().getCode() != null) {
            String roleCode = currentUser.getRole().getCode();
            return "OWNER".equalsIgnoreCase(roleCode) || "MANAGER".equalsIgnoreCase(roleCode);
        }
        return false;
    }
}
