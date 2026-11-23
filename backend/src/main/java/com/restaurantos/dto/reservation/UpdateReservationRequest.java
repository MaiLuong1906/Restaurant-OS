package com.restaurantos.dto.reservation;

import com.restaurantos.enums.DepositMethod;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * Payload cập nhật thông tin đặt bàn (đổi giờ, đổi bàn, đổi số khách hoặc ghi chú).
 */
public record UpdateReservationRequest(
        UUID tableId,

        @Size(max = 150, message = "Họ tên khách hàng tối đa 150 ký tự")
        String customerName,

        @Pattern(regexp = "^[0-9+\\-\\s()]{8,20}$", message = "Số điện thoại không đúng định dạng (8-20 ký tự)")
        String customerPhone,

        @Min(value = 1, message = "Số lượng khách phải từ 1 người trở lên")
        @Max(value = 100, message = "Số lượng khách tối đa là 100 người")
        Integer guestCount,

        @Future(message = "Thời gian đặt bàn phải ở tương lai")
        Instant reservationTime,

        @Min(value = 0, message = "Tiền cọc phải là số nguyên VND không âm")
        Long depositAmount,

        DepositMethod depositMethod,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String notes
) {}
