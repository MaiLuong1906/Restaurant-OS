package com.restaurantos.config;

import com.restaurantos.security.JwtAuthenticationFilter;
import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.ObjectProvider;
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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Cấu hình bảo mật tầng nền (RBAC + JWT Stateless Security).
 * Khóa các endpoint nhạy cảm, chỉ mở công khai Menu QR, Auth Login/KDS-PIN,
 * Health check và WebSocket handshake.
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
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilterProvider) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. Hạ tầng kiểm tra trạng thái sống/chết (Health checks) & Xử lý lỗi (Error
                        // dispatch)
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/v1/health", "/actuator/health", "/actuator/info", "/error", "/error/**")
                        .permitAll()

                        // 2. Tài liệu Swagger / OpenAPI 3 UI
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                        // 3. Cổng kết nối WebSocket STOMP handshake
                        .requestMatchers("/ws/**").permitAll()

                        // 4. Menu công khai qua quét mã QR bàn (UC01, UC02) - Chỉ cho phép GET
                        .requestMatchers(HttpMethod.GET, "/api/v1/dishes/**").permitAll()

                        // Bếp & Quản lý cập nhật nhanh trạng thái còn/hết món (UC20)
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/dishes/*/availability")
                        .hasAuthority("MENU:AVAILABILITY:UPDATE")

                        // 5. Xác thực người dùng (Auth endpoints): Login & KDS-PIN công khai; /me &
                        // /verify-manager-pin yêu cầu đăng nhập
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/kds-pin").permitAll()
                        .requestMatchers("/api/v1/auth/**").authenticated()

                        // 6. KDS Bếp chính (non-local; profile local dùng KdsLocalSecurityConfig @Order(1))
                        .requestMatchers(HttpMethod.GET, "/api/v1/kds/**").hasAuthority("KDS:QUEUE:VIEW")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/kds/**").hasAuthority("KDS:COOKING_STATUS:UPDATE")

                        // 7. Quản trị nhân sự & thực đơn (kết hợp @PreAuthorize chi tiết theo từng method)
                        .requestMatchers("/api/v1/admin/users", "/api/v1/admin/users/**").authenticated()
                        .requestMatchers("/api/v1/admin/dishes", "/api/v1/admin/dishes/**").authenticated()

                        // 8. Quản lý ca mở & Đăng ký ca làm việc (kết hợp @PreAuthorize & chống IDOR)
                        .requestMatchers("/api/v1/staff/schedule/**").authenticated()

                        // 9. Đặt bàn & Check-in POS (kết hợp @PreAuthorize chi tiết theo từng method)
                        .requestMatchers("/api/v1/reservations/**").authenticated()

                        // 10. Đơn hàng: /active bắt buộc đăng nhập; POST /orders & GET /orders/{id} sẽ gắn Customer QR Token ở Giai đoạn 4
                        .requestMatchers(HttpMethod.GET, "/api/v1/orders/active").hasAuthority("ORDER:ACTIVE:VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/v1/orders").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/orders/*").permitAll()

                        // 11. Danh sách bàn: GET /api/v1/tables bắt buộc đăng nhập; GET /api/v1/tables/{id} mở cho QR bàn
                        .requestMatchers(HttpMethod.GET, "/api/v1/tables").hasAuthority("TABLE:FLOOR_PLAN:VIEW")
                        .requestMatchers(HttpMethod.GET, "/api/v1/tables/*").permitAll()

                        // Mọi endpoint nghiệp vụ còn lại bắt buộc phải xác thực Token
                        .anyRequest().authenticated());

        JwtAuthenticationFilter jwtFilter = jwtAuthenticationFilterProvider.getIfAvailable();
        if (jwtFilter != null) {
            http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }
}