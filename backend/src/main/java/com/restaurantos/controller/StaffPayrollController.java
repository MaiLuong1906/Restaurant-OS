package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.PayslipDto;
import com.restaurantos.common.dto.TipMonthSummaryDto;
import com.restaurantos.common.dto.TipRecordDto;
import com.restaurantos.common.enums.Permission;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.StaffPayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/payroll")
@RequiredArgsConstructor
@Tag(name = "Staff Payroll & Tips", description = "Tra cứu phiếu lương và tiền Tip cá nhân theo tháng/ngày (UC_STF_05)")
public class StaffPayrollController {

    private final StaffPayrollService staffPayrollService;

    @GetMapping("/payslips")
    @PreAuthorize("hasAuthority('HR:PAYSLIP_SELF:VIEW')")
    @Operation(summary = "Lấy danh sách phiếu lương của nhân viên", description = "Trả về các phiếu lương theo tháng (số nguyên VND)")
    public ResponseEntity<ApiResponse<List<PayslipDto>>> getPayslips(
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser, authentication);
        List<PayslipDto> payslips = staffPayrollService.getPayslips(resolvedStaffId, month);
        return ResponseEntity.ok(ApiResponse.success(payslips, "Lấy danh sách phiếu lương thành công"));
    }

    @GetMapping("/payslips/{id}")
    @PreAuthorize("hasAuthority('HR:PAYSLIP_SELF:VIEW')")
    @Operation(summary = "Xem chi tiết phiếu lương theo ID", description = "Trả về chi tiết thu nhập và khấu trừ của phiếu lương (chống IDOR)")
    public ResponseEntity<ApiResponse<PayslipDto>> getPayslipById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để xem phiếu lương");
        }
        boolean canManagePayroll = hasPayrollApproveAuthority(authentication);
        PayslipDto payslip = staffPayrollService.getPayslipById(id, currentUser.getId(), canManagePayroll);
        return ResponseEntity.ok(ApiResponse.success(payslip, "Lấy chi tiết phiếu lương thành công"));
    }

    @GetMapping("/tips")
    @PreAuthorize("hasAuthority('HR:PAYSLIP_SELF:VIEW')")
    @Operation(summary = "Lấy danh sách bản ghi Tip theo khoảng ngày", description = "Trả về danh sách tiền Tip được phân bổ theo ca/ngày")
    public ResponseEntity<ApiResponse<List<TipRecordDto>>> getTips(
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser, authentication);
        List<TipRecordDto> tips = staffPayrollService.getTips(resolvedStaffId, from, to);
        return ResponseEntity.ok(ApiResponse.success(tips, "Lấy danh sách tip thành công"));
    }

    @GetMapping("/tips/months")
    @PreAuthorize("hasAuthority('HR:PAYSLIP_SELF:VIEW')")
    @Operation(summary = "Lấy tổng hợp Tip theo từng tháng", description = "Trả về tổng tiền Tip theo tháng kèm chi tiết theo ngày cho tháng gần nhất")
    public ResponseEntity<ApiResponse<List<TipMonthSummaryDto>>> getTipMonths(
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser, authentication);
        List<TipMonthSummaryDto> tipMonths = staffPayrollService.getTipMonths(resolvedStaffId);
        return ResponseEntity.ok(ApiResponse.success(tipMonths, "Lấy tổng hợp tip theo tháng thành công"));
    }

    private UUID resolveStaffId(UUID requestStaffId, UserEntity currentUser, Authentication authentication) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để truy cập thông tin lương và tip");
        }
        if (requestStaffId != null && hasPayrollApproveAuthority(authentication)) {
            return requestStaffId;
        }
        return currentUser.getId();
    }

    private boolean hasPayrollApproveAuthority(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String required = Permission.HR_PAYROLL_TIP_POOL_APPROVE.getAuthority();
        return authentication.getAuthorities().stream()
                .anyMatch(a -> required.equals(a.getAuthority()));
    }
}
