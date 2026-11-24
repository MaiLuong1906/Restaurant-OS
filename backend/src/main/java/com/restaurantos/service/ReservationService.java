package com.restaurantos.service;

import com.restaurantos.dto.reservation.AvailableTableResponse;
import com.restaurantos.dto.reservation.CancelReservationRequest;
import com.restaurantos.dto.reservation.CreateReservationRequest;
import com.restaurantos.dto.reservation.DiningZoneResponse;
import com.restaurantos.dto.reservation.ReservationResponse;
import com.restaurantos.dto.reservation.UpdateReservationRequest;
import com.restaurantos.enums.ReservationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReservationService {

    List<DiningZoneResponse> listDiningZones();

    List<AvailableTableResponse> getAvailableTables(Instant reservationTime, Integer guestCount, UUID zoneId);

    ReservationResponse createReservation(CreateReservationRequest request, String idempotencyKey);

    List<ReservationResponse> listReservations(LocalDate date, ReservationStatus status, String search);

    ReservationResponse getReservationById(UUID id);

    ReservationResponse updateReservation(UUID id, UpdateReservationRequest request);

    ReservationResponse checkInReservation(UUID id);

    ReservationResponse cancelReservation(UUID id, CancelReservationRequest request);

    ReservationResponse markNoShow(UUID id);
}
