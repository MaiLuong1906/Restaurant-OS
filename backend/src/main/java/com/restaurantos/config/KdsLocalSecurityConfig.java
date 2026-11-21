package com.restaurantos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Cấu hình bảo mật riêng cho KDS ở môi trường local (CHỐT A theo spec).
 * Cho phép truy cập không cần token vào /api/v1/kds/** khi chạy profile "local".
 * Ở các profile khác (test, prod), request vào /api/v1/kds/** sẽ rơi vào SecurityConfig chung và bị chặn (401 Unauthorized).
 */
@Configuration
@Profile("local")
public class KdsLocalSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain kdsSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/v1/kds/**")
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/kds/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
