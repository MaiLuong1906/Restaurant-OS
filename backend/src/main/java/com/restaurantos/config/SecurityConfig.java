package com.restaurantos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Cấu hình bảo mật tầng nền (Sprint 0 Baseline Security).
 * Khóa các endpoint nhạy cảm, chỉ mở công khai Menu QR, Health check và WebSocket handshake.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 1. Hạ tầng kiểm tra trạng thái sống/chết (Health checks)
                .requestMatchers("/api/v1/health", "/actuator/health", "/actuator/info").permitAll()

                // 2. Tài liệu Swagger / OpenAPI 3 UI
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                // 3. Cổng kết nối WebSocket STOMP handshake
                .requestMatchers("/ws/**").permitAll()

                // 4. Menu công khai qua quét mã QR bàn (UC01, UC02)
                .requestMatchers(HttpMethod.GET, "/api/v1/dishes/**").permitAll()

                // 5. Xác thực người dùng (Auth endpoints)
                .requestMatchers("/api/v1/auth/**").permitAll()

                // Mọi endpoint nghiệp vụ còn lại bắt buộc phải xác thực Token
                .anyRequest().authenticated()
            );

        return http.build();
    }
}

