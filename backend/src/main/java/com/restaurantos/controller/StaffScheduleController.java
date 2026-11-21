package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.OpenShiftDto;
import com.restaurantos.common.dto.ShiftRegistrationDto;
import com.restaurantos.service.StaffScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff/schedule")
@RequiredArgsConstructor
@Tag(name = "Staff Schedule", description = "Quản lý ca làm việc, đăng ký và huỷ đăng ký")
public class StaffScheduleController {

    private final StaffScheduleService staffScheduleService;

    @GetMapping("/open-shifts")
    @Operation(summary = "Lấy danh sách ca mở", description = "Trả về các ca mở cho ngày được chỉ định (yyyy-MM-dd)")
    public ResponseEntity<ApiResponse<List<OpenShiftDto>>> getOpenShifts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateKey) {
        List<OpenShiftDto> shifts = staffScheduleService.listOpenShifts(dateKey);
        return ResponseEntity.ok(ApiResponse.success(shifts, "Lấy danh sách ca mở thành công"));
    }

    @PostMapping("/registrations")
    @Operation(summary = "Đăng ký ca làm việc", description = "Tạo một đăng ký mới cho nhân viên (idempotent)")
    public ResponseEntity<ApiResponse<ShiftRegistrationDto>> registerShift(@RequestBody ShiftRegistrationDto request) {
        ShiftRegistrationDto result = staffScheduleService.registerShift(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Đăng ký ca thành công"));
    }

    @DeleteMapping("/registrations/{id}")
    @Operation(summary = "Huỷ đăng ký", description = "Xóa một đăng ký theo UUID")
    public ResponseEntity<ApiResponse<Void>> cancelRegistration(@PathVariable UUID id) {
        staffScheduleService.cancelRegistration(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Huỷ đăng ký thành công"));
    }
}
