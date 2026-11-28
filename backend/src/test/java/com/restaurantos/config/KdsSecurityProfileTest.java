package com.restaurantos.config;

import com.restaurantos.controller.KdsController;
import com.restaurantos.service.KdsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(KdsController.class)
@Import({SecurityConfig.class, KdsLocalSecurityConfig.class})
@ActiveProfiles("local")
class KdsSecurityProfileTest {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KdsService kdsService;

    @Test
    @DisplayName("Local profile enforces JWT and denies unauthenticated access to /api/v1/kds/tickets with 401")
    void localProfile_permitsKdsEndpoints() throws Exception {
        assertThat(context.containsBean("kdsSecurityFilterChain")).isTrue();
        mockMvc.perform(get("/api/v1/kds/tickets"))
                .andExpect(status().isUnauthorized());
    }
}
