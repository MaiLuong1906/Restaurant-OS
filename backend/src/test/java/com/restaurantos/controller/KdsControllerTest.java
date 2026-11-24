package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.service.KdsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KdsControllerTest {

    @Mock
    private KdsService kdsService;

    @InjectMocks
    private KdsController kdsController;

    @Test
    @DisplayName("K1: getTickets returns 200 with ticket list")
    void getTickets_returnsSuccess() {
        KdsTicketDto ticket = new KdsTicketDto(UUID.randomUUID(), "Bàn 01", UUID.randomUUID(), "WAITING", Instant.now(), Instant.now(), List.of());
        when(kdsService.getTickets()).thenReturn(List.of(ticket));

        ResponseEntity<ApiResponse<List<KdsTicketDto>>> response = kdsController.getTickets();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).hasSize(1);
    }

    @Test
    @DisplayName("K2: getTicketById returns 404 when ticket not found")
    void getTicketById_notFound_returns404() {
        UUID missingId = UUID.randomUUID();
        when(kdsService.getTicketById(missingId)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<KdsTicketDto>> response = kdsController.getTicketById(missingId);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
    }

    @Test
    @DisplayName("K6: getActiveItems returns 200 with active item list")
    void getActiveItems_returnsSuccess() {
        KdsItemDto item = new KdsItemDto(UUID.randomUUID(), UUID.randomUUID(), "Phở Bò", 1, null, null, "WAITING", Instant.now(), false);
        when(kdsService.getActiveItems()).thenReturn(List.of(item));

        ResponseEntity<ApiResponse<List<KdsItemDto>>> response = kdsController.getActiveItems();

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data()).hasSize(1);
    }
}
