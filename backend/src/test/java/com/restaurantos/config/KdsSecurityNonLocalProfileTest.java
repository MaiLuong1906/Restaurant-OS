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
    @DisplayName("Non-local profile denies unauthenticated access to /api/v1/kds/tickets with 403")
    void nonLocalProfile_blocksKdsEndpointsWithoutAuth() throws Exception {
        // Chưa có auth mechanism nên Spring trả 403 cho request không token — hành vi đúng hiện tại; khi JWT filter merge (trả 401) thì đổi test này sang 401
        mockMvc.perform(get("/api/v1/kds/tickets"))
                .andExpect(status().isForbidden());
    }
}
