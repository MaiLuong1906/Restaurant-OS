package com.restaurantos.config;

import com.restaurantos.controller.KdsController;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.entity.RoleEntity;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.security.JwtTokenProvider;
import com.restaurantos.service.KdsService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KdsController.class)
@Import({SecurityConfig.class, KdsLocalSecurityConfig.class})
@ActiveProfiles("local")
class KdsSecurityLocalProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KdsService kdsService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private void stubTokenForUser(String token, UserRole role) {
        UUID userId = UUID.randomUUID();
        Claims claims = new DefaultClaims(Map.of(
                "sub", userId.toString(),
                "role", role.name(),
                "token_type", JwtTokenProvider.TOKEN_TYPE_STAFF
        ));

        RoleEntity roleEntity = RoleEntity.builder()
                .id(UUID.randomUUID())
                .code(role.name())
                .name(role.name())
                .build();

        UserEntity user = UserEntity.builder()
                .id(userId)
                .username(role.name().toLowerCase())
                .fullName(role.name())
                .passwordHash("hash")
                .role(roleEntity)
                .isActive(true)
                .build();

        when(jwtTokenProvider.parseAndValidate(token)).thenReturn(claims);
        when(jwtTokenProvider.extractTokenType(claims)).thenReturn(JwtTokenProvider.TOKEN_TYPE_STAFF);
        when(jwtTokenProvider.extractUserId(claims)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("Local profile denies unauthenticated GET /api/v1/kds/tickets with 401 JSON")
    void localProfile_unauthenticatedGet_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/kds/tickets"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Local profile denies unauthenticated POST /api/v1/kds/batches/complete with 401 JSON")
    void localProfile_unauthenticatedPostBatch_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/kds/batches/complete")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemIds\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Local profile denies WAITER (no KDS authority) on GET/PATCH/POST with 403 JSON")
    void localProfile_waiterRole_returns403OnAllKdsEndpoints() throws Exception {
        String waiterToken = "waiter-jwt-token";
        stubTokenForUser(waiterToken, UserRole.WAITER);

        mockMvc.perform(get("/api/v1/kds/tickets")
                        .header("Authorization", "Bearer " + waiterToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));

        mockMvc.perform(patch("/api/v1/kds/tickets/{id}/complete", UUID.randomUUID())
                        .header("Authorization", "Bearer " + waiterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));

        mockMvc.perform(post("/api/v1/kds/batches/complete")
                        .header("Authorization", "Bearer " + waiterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemIds\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Local profile allows CHEF on GET/PATCH/POST with 200")
    void localProfile_chefRole_returns200OnGetPatchPost() throws Exception {
        String chefToken = "chef-jwt-token";
        stubTokenForUser(chefToken, UserRole.CHEF);

        UUID ticketId = UUID.randomUUID();
        UUID itemId = UUID.randomUUID();
        KdsTicketDto ticket = new KdsTicketDto(ticketId, "Bàn 01", UUID.randomUUID(), "READY", Instant.now(), Instant.now(), List.of());

        when(kdsService.getTickets()).thenReturn(List.of(ticket));
        when(kdsService.completeTicket(any(), any())).thenReturn(Optional.of(ticket));
        when(kdsService.completeBatch(any())).thenReturn(Optional.of(List.of(ticket)));

        mockMvc.perform(get("/api/v1/kds/tickets")
                        .header("Authorization", "Bearer " + chefToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(patch("/api/v1/kds/tickets/{id}/complete", ticketId)
                        .header("Authorization", "Bearer " + chefToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/v1/kds/batches/complete")
                        .header("Authorization", "Bearer " + chefToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"itemIds\":[\"" + itemId + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
