package com.restaurantos.dto.reservation;

import jakarta.validation.constraints.Size;

public record CancelReservationRequest(
        @Size(max = 500, message = "Lý do hủy đặt bàn tối đa 500 ký tự")
        String reason
) {}
