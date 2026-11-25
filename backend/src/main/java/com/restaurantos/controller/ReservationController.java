package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.reservation.*;
import com.restaurantos.enums.ReservationStatus;
import com.restaurantos.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Tag(name = "Table Reservations (POS)", description = "Nghiệp vụ đặt bàn trước & Check-in (UC_CASH_01, UC_CASH_02)")
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping("/zones")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:VIEW')")
    @Operation(summary = "Danh sách phân khu bàn ăn")
    public ResponseEntity<ApiResponse<List<DiningZoneResponse>>> getDiningZones() {
        List<DiningZoneResponse> zones = reservationService.listDiningZones();
        return ResponseEntity.ok(ApiResponse.success(zones, "Lấy danh sách phân khu thành công"));
    }

    @GetMapping("/available-tables")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:VIEW')")
    @Operation(summary = "Kiểm tra bàn trống khả dụng (UC_CASH_01 <<include>>)")
    public ResponseEntity<ApiResponse<List<AvailableTableResponse>>> getAvailableTables(
            @RequestParam("time") Instant reservationTime,
            @RequestParam(value = "guestCount", defaultValue = "2") Integer guestCount,
            @RequestParam(value = "zoneId", required = false) UUID zoneId
    ) {
        List<AvailableTableResponse> tables =
                reservationService.getAvailableTables(reservationTime, guestCount, zoneId);
        return ResponseEntity.ok(ApiResponse.success(tables, "Kiểm tra bàn trống thành công"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:CREATE')")
    @Operation(summary = "Tạo đơn đặt bàn mới & thu cọc (UC_CASH_01)")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateReservationRequest request
    ) {
        ReservationResponse created = reservationService.createReservation(request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Tạo đặt bàn thành công"));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:VIEW')")
    @Operation(summary = "Tra cứu danh sách đặt bàn theo ngày, trạng thái hoặc SĐT/tên khách")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> listReservations(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "status", required = false) ReservationStatus status,
            @RequestParam(value = "search", required = false) String search
    ) {
        List<ReservationResponse> results = reservationService.listReservations(date, status, search);
        return ResponseEntity.ok(ApiResponse.success(results, "Lấy danh sách đặt bàn thành công"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:VIEW')")
    @Operation(summary = "Chi tiết đơn đặt bàn theo UUID")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(@PathVariable UUID id) {
        ReservationResponse detail = reservationService.getReservationById(id);
        return ResponseEntity.ok(ApiResponse.success(detail, "Lấy chi tiết đặt bàn thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:UPDATE')")
    @Operation(summary = "Cập nhật thông tin đặt bàn (đổi giờ, đổi bàn, số khách, tiền cọc)")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateReservation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReservationRequest request
    ) {
        ReservationResponse updated = reservationService.updateReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật đặt bàn thành công"));
    }

    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:UPDATE')")
    @Operation(summary = "Check-in nhận bàn đã đặt trước (UC_CASH_02)")
    public ResponseEntity<ApiResponse<ReservationResponse>> checkInReservation(@PathVariable UUID id) {
        ReservationResponse checkedIn = reservationService.checkInReservation(id);
        return ResponseEntity.ok(ApiResponse.success(checkedIn, "Check-in nhận bàn thành công"));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:UPDATE')")
    @Operation(summary = "Hủy đơn đặt bàn & giải phóng bàn")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CancelReservationRequest request
    ) {
        ReservationResponse cancelled = reservationService.cancelReservation(id, request);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Hủy đặt bàn thành công"));
    }

    @PostMapping("/{id}/no-show")
    @PreAuthorize("hasAuthority('TABLE:RESERVATION:UPDATE')")
    @Operation(summary = "Đánh dấu khách không đến (No-Show) & giải phóng bàn")
    public ResponseEntity<ApiResponse<ReservationResponse>> markNoShow(@PathVariable UUID id) {
        ReservationResponse result = reservationService.markNoShow(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Đã đánh dấu khách không đến (No-Show)"));
    }
}
