package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.dto.CompleteTicketRequest;
import com.restaurantos.dto.UpdateItemStatusRequest;
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

    @Test
    @DisplayName("K3: completeTicket returns 200 on success")
    void completeTicket_returnsSuccess() {
        UUID ticketId = UUID.randomUUID();
        KdsTicketDto ticket = new KdsTicketDto(ticketId, "Bàn 01", UUID.randomUUID(), "READY", Instant.now(), Instant.now(), List.of());
        when(kdsService.completeTicket(ticketId, null)).thenReturn(Optional.of(ticket));

        ResponseEntity<ApiResponse<KdsTicketDto>> response = kdsController.completeTicket(ticketId, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data().status()).isEqualTo("READY");
    }

    @Test
    @DisplayName("K3: completeTicket returns 404 when ticket not found")
    void completeTicket_notFound_returns404() {
        UUID missingId = UUID.randomUUID();
        when(kdsService.completeTicket(missingId, null)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<KdsTicketDto>> response = kdsController.completeTicket(missingId, null);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
    }

    @Test
    @DisplayName("K4: updateItemStatus returns 200 on success")
    void updateItemStatus_returnsSuccess() {
        UUID itemId = UUID.randomUUID();
        UpdateItemStatusRequest request = new UpdateItemStatusRequest("READY", null);
        KdsItemDto item = new KdsItemDto(itemId, UUID.randomUUID(), "Phở Bò", 1, null, null, "READY", null, false);
        when(kdsService.updateItemStatus(itemId, request)).thenReturn(Optional.of(item));

        ResponseEntity<ApiResponse<KdsItemDto>> response = kdsController.updateItemStatus(itemId, request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().data().status()).isEqualTo("READY");
    }

    @Test
    @DisplayName("K4: updateItemStatus returns 404 when item not found")
    void updateItemStatus_notFound_returns404() {
        UUID missingId = UUID.randomUUID();
        UpdateItemStatusRequest request = new UpdateItemStatusRequest("READY", null);
        when(kdsService.updateItemStatus(missingId, request)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<KdsItemDto>> response = kdsController.updateItemStatus(missingId, request);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
    }
}
