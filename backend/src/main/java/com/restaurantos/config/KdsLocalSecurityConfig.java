package com.restaurantos.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.security.JwtAuthenticationFilter;
import com.restaurantos.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Cấu hình bảo mật riêng cho KDS ở môi trường local (JWT + RBAC).
 * Bắt buộc xác thực JWT và kiểm tra quyền KDS:QUEUE:VIEW / KDS:COOKING_STATUS:UPDATE
 * đồng bộ với SecurityConfig chung.
 */
@Configuration
@Profile("local")
public class KdsLocalSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain kdsSecurityFilterChain(
            HttpSecurity http,
            ObjectProvider<JwtTokenProvider> jwtTokenProvider,
            ObjectProvider<UserRepository> userRepositoryProvider,
            ObjectProvider<ObjectMapper> objectMapperProvider) throws Exception {
        ObjectMapper objectMapper = objectMapperProvider.getIfAvailable(
                () -> new ObjectMapper().findAndRegisterModules());

        http
            .securityMatcher("/api/v1/kds/**")
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    objectMapper.writeValue(
                            response.getWriter(),
                            ApiResponse.error("UNAUTHORIZED", "Vui lòng đăng nhập để truy cập tài nguyên này.", null)
                    );
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    objectMapper.writeValue(
                            response.getWriter(),
                            ApiResponse.error("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.", null)
                    );
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/v1/kds/**").hasAuthority("KDS:QUEUE:VIEW")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/kds/**").hasAuthority("KDS:COOKING_STATUS:UPDATE")
                .requestMatchers(HttpMethod.POST, "/api/v1/kds/batches/complete").hasAuthority("KDS:COOKING_STATUS:UPDATE")
                .anyRequest().authenticated()
            );

        JwtTokenProvider tokenProvider = jwtTokenProvider.getIfAvailable();
        UserRepository userRepo = userRepositoryProvider.getIfAvailable();
        if (tokenProvider != null && userRepo != null) {
            http.addFilterBefore(
                    new JwtAuthenticationFilter(tokenProvider, userRepo),
                    UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }
}
