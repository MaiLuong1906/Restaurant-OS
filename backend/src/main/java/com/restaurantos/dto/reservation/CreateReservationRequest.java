package com.restaurantos.dto.reservation;

import com.restaurantos.enums.DepositMethod;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * Payload tạo đặt bàn trước (UC_CASH_01: Create Table Reservation + Collect Booking Deposit).
 */
public record CreateReservationRequest(
        @NotNull(message = "Vui lòng chọn bàn cần đặt trước")
        UUID tableId,

        @NotBlank(message = "Họ tên khách hàng không được để trống")
        @Size(max = 150, message = "Họ tên khách hàng tối đa 150 ký tự")
        String customerName,

        @NotBlank(message = "Số điện thoại khách hàng không được để trống")
        @Pattern(regexp = "^[0-9+\\-\\s()]{8,20}$", message = "Số điện thoại không đúng định dạng (8-20 ký tự)")
        String customerPhone,

        @NotNull(message = "Số lượng khách không được để trống")
        @Min(value = 1, message = "Số lượng khách phải từ 1 người trở lên")
        @Max(value = 100, message = "Số lượng khách tối đa là 100 người")
        Integer guestCount,

        @NotNull(message = "Thời gian dự kiến đến không được để trống")
        @Future(message = "Thời gian đặt bàn phải ở tương lai")
        Instant reservationTime,

        @Min(value = 0, message = "Tiền cọc phải là số nguyên VND không âm")
        Long depositAmount,

        DepositMethod depositMethod,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String notes,

        UUID createdBy
) {
    public long resolvedDepositAmount() {
        return depositAmount == null ? 0L : depositAmount;
    }
}
