package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.dto.CompleteBatchRequest;
import com.restaurantos.dto.CompleteTicketRequest;
import com.restaurantos.dto.UpdateItemStatusRequest;
import com.restaurantos.exception.GlobalExceptionHandler;
import com.restaurantos.service.KdsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Test
    @DisplayName("K5: completeBatch returns 200 with list of 2 updated tickets")
    void completeBatch_returnsSuccessWithTwoTickets() {
        UUID item1 = UUID.randomUUID();
        UUID item2 = UUID.randomUUID();
        CompleteBatchRequest request = new CompleteBatchRequest(List.of(item1, item2));

        KdsTicketDto ticket1 = new KdsTicketDto(UUID.randomUUID(), "Bàn 01", UUID.randomUUID(), "READY", Instant.now(), Instant.now(), List.of());
        KdsTicketDto ticket2 = new KdsTicketDto(UUID.randomUUID(), "Bàn 04", UUID.randomUUID(), "WAITING", Instant.now(), Instant.now(), List.of());
        when(kdsService.completeBatch(request)).thenReturn(Optional.of(List.of(ticket1, ticket2)));

        ResponseEntity<ApiResponse<List<KdsTicketDto>>> response = kdsController.completeBatch(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isTrue();
        assertThat(response.getBody().data()).hasSize(2);
    }

    @Test
    @DisplayName("K5: completeBatch returns 404 when service returns Optional.empty()")
    void completeBatch_notFound_returns404() {
        CompleteBatchRequest request = new CompleteBatchRequest(List.of(UUID.randomUUID()));
        when(kdsService.completeBatch(request)).thenReturn(Optional.empty());

        ResponseEntity<ApiResponse<List<KdsTicketDto>>> response = kdsController.completeBatch(request);

        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().error().code()).isEqualTo("NOT_FOUND");
    }

    @Test
    @DisplayName("K5: completeBatch returns 409 when service throws 409 CONFLICT")
    void completeBatch_conflict_returns409() throws Exception {
        UUID itemId = UUID.randomUUID();
        CompleteBatchRequest request = new CompleteBatchRequest(List.of(itemId));
        when(kdsService.completeBatch(request))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Không thể hoàn tất mẻ vì có món đã ở trạng thái REJECTED"));

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(kdsController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mockMvc.perform(post("/api/v1/kds/batches/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemIds\":[\"" + itemId + "\"]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    @DisplayName("K5: completeBatch with empty itemIds returns 400 Bad Request via @Valid @NotEmpty")
    void completeBatch_emptyItemIds_returns400() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(kdsController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mockMvc.perform(post("/api/v1/kds/batches/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemIds\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
