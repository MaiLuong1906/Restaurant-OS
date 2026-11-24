package com.restaurantos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurantos.config.SecurityConfig;
import com.restaurantos.dto.reservation.*;
import com.restaurantos.enums.DepositMethod;
import com.restaurantos.enums.ReservationStatus;
import com.restaurantos.enums.TableStatus;
import com.restaurantos.exception.BusinessException;
import com.restaurantos.exception.GlobalExceptionHandler;
import com.restaurantos.service.ReservationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReservationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservationService reservationService;

    @BeforeEach
    void setUpCashierAuth() {
        var auth = new UsernamePasswordAuthenticationToken(
                "cashier-test",
                null,
                List.of(
                        new SimpleGrantedAuthority("ROLE_CASHIER"),
                        new SimpleGrantedAuthority("TABLE:RESERVATION:VIEW"),
                        new SimpleGrantedAuthority("TABLE:RESERVATION:CREATE"),
                        new SimpleGrantedAuthority("TABLE:RESERVATION:UPDATE")
                )
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAvailableTables_returns200AndEnvelope() throws Exception {
        UUID tableId = UUID.randomUUID();
        UUID zoneId = UUID.randomUUID();
        Instant futureTime = Instant.now().plus(2, ChronoUnit.HOURS);

        AvailableTableResponse availableTable = new AvailableTableResponse(
                tableId, "Bàn 01", 4, TableStatus.VACANT, zoneId, "Tầng 1 - Sảnh Chính", "token-table-01"
        );
        when(reservationService.getAvailableTables(any(), eq(4), isNull()))
                .thenReturn(List.of(availableTable));

        mockMvc.perform(get("/api/v1/reservations/available-tables")
                        .param("time", futureTime.toString())
                        .param("guestCount", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].tableNumber").value("Bàn 01"))
                .andExpect(jsonPath("$.data[0].status").value("VACANT"));
    }

    @Test
    void createReservation_validPayload_returns201Created() throws Exception {
        UUID resId = UUID.randomUUID();
        UUID tableId = UUID.randomUUID();
        Instant futureTime = Instant.now().plus(2, ChronoUnit.HOURS);

        CreateReservationRequest req = new CreateReservationRequest(
                tableId, "Nguyễn Minh Quân", "0903456789", 4, futureTime,
                200000L, DepositMethod.VIETQR, "Bàn gần cửa sổ", null
        );

        ReservationResponse mockRes = new ReservationResponse(
                resId, tableId, "Bàn 03", 4, TableStatus.RESERVED, "token-table-03",
                UUID.randomUUID(), "Tầng 1 - Sảnh Chính", "Nguyễn Minh Quân", "0903456789",
                4, futureTime, 200000L, DepositMethod.VIETQR, ReservationStatus.CONFIRMED,
                "Bàn gần cửa sổ", null, null, null, null, Instant.now(), Instant.now()
        );

        when(reservationService.createReservation(any(CreateReservationRequest.class), eq("idem-key-123")))
                .thenReturn(mockRes);

        mockMvc.perform(post("/api/v1/reservations")
                        .header("X-Idempotency-Key", "idem-key-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(resId.toString()))
                .andExpect(jsonPath("$.data.depositAmount").value(200000))
                .andExpect(jsonPath("$.data.tableStatus").value("RESERVED"));
    }

    @Test
    void createReservation_invalidPayload_returns400ValidationError() throws Exception {
        String invalidJson = """
                {
                  "customerName": "",
                  "customerPhone": "abc",
                  "guestCount": 0
                }
                """;

        mockMvc.perform(post("/api/v1/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void checkInReservation_conflictStatus_returns409Conflict() throws Exception {
        UUID resId = UUID.randomUUID();
        when(reservationService.checkInReservation(resId))
                .thenThrow(BusinessException.conflict("RESERVATION_ALREADY_SEATED", "Đơn đặt bàn này đã được check-in"));

        mockMvc.perform(post("/api/v1/reservations/{id}/check-in", resId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("RESERVATION_ALREADY_SEATED"));
    }
}
