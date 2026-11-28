package com.restaurantos.config;

import com.restaurantos.controller.KdsController;
import com.restaurantos.service.KdsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KdsController.class)
@Import({SecurityConfig.class, KdsLocalSecurityConfig.class})
@ActiveProfiles("test")
class KdsSecurityNonLocalProfileTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KdsService kdsService;

    @Test
    @DisplayName("Non-local profile denies unauthenticated access to /api/v1/kds/tickets with 401")
    void nonLocalProfile_blocksKdsEndpointsWithoutAuth() throws Exception {
        // Sau khi cấu hình AuthenticationEntryPoint trả JSON 401 theo Rule 06, request không token trả 401 Unauthorized
        mockMvc.perform(get("/api/v1/kds/tickets"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/kds/order-changes"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/kds/order-changes/00000000-0000-0000-0000-000000000001/acknowledge"))
                .andExpect(status().isUnauthorized());
    }
}
