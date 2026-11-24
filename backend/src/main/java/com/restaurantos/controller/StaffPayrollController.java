package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.PayslipDto;
import com.restaurantos.common.dto.TipMonthSummaryDto;
import com.restaurantos.common.dto.TipRecordDto;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.StaffPayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
    @Operation(summary = "Lấy danh sách phiếu lương của nhân viên", description = "Trả về các phiếu lương theo tháng (số nguyên VND)")
    public ResponseEntity<ApiResponse<List<PayslipDto>>> getPayslips(
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) String month,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser);
        List<PayslipDto> payslips = staffPayrollService.getPayslips(resolvedStaffId, month);
        return ResponseEntity.ok(ApiResponse.success(payslips, "Lấy danh sách phiếu lương thành công"));
    }

    @GetMapping("/payslips/{id}")
    @Operation(summary = "Xem chi tiết phiếu lương theo ID", description = "Trả về chi tiết thu nhập và khấu trừ của phiếu lương")
    public ResponseEntity<ApiResponse<PayslipDto>> getPayslipById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID currentUserId = currentUser != null ? currentUser.getId() : null;
        boolean isManagerOrOwner = isManagerOrOwner(currentUser);
        PayslipDto payslip = staffPayrollService.getPayslipById(id, currentUserId, isManagerOrOwner);
        return ResponseEntity.ok(ApiResponse.success(payslip, "Lấy chi tiết phiếu lương thành công"));
    }

    @GetMapping("/tips")
    @Operation(summary = "Lấy danh sách bản ghi Tip theo khoảng ngày", description = "Trả về danh sách tiền Tip được phân bổ theo ca/ngày")
    public ResponseEntity<ApiResponse<List<TipRecordDto>>> getTips(
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser);
        List<TipRecordDto> tips = staffPayrollService.getTips(resolvedStaffId, from, to);
        return ResponseEntity.ok(ApiResponse.success(tips, "Lấy danh sách tip thành công"));
    }

    @GetMapping("/tips/months")
    @Operation(summary = "Lấy tổng hợp Tip theo từng tháng", description = "Trả về tổng tiền Tip theo tháng kèm chi tiết theo ngày cho tháng gần nhất")
    public ResponseEntity<ApiResponse<List<TipMonthSummaryDto>>> getTipMonths(
            @RequestParam(required = false) UUID staffId,
            @AuthenticationPrincipal UserEntity currentUser) {
        UUID resolvedStaffId = resolveStaffId(staffId, currentUser);
        List<TipMonthSummaryDto> tipMonths = staffPayrollService.getTipMonths(resolvedStaffId);
        return ResponseEntity.ok(ApiResponse.success(tipMonths, "Lấy tổng hợp tip theo tháng thành công"));
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
