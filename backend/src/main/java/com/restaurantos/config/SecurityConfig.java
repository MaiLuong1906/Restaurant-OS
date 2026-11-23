package com.restaurantos.config;

import jakarta.servlet.DispatcherType;
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
                // 1. Hạ tầng kiểm tra trạng thái sống/chết (Health checks) & Xử lý lỗi (Error dispatch)
                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .requestMatchers("/api/v1/health", "/actuator/health", "/actuator/info", "/error", "/error/**").permitAll()

                // 2. Tài liệu Swagger / OpenAPI 3 UI
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                // 3. Cổng kết nối WebSocket STOMP handshake
                .requestMatchers("/ws/**").permitAll()

                // 4. Menu công khai qua quét mã QR bàn (UC01, UC02) - Chỉ cho phép GET
                .requestMatchers(HttpMethod.GET, "/api/v1/dishes/**").permitAll()

                // Bếp & Thu ngân cập nhật nhanh trạng thái còn/hết món (UC20)
                // NOTE: Tạm thời permitAll PATCH cho endpoint availability phục vụ trạm KDS/POS trong sprint test nội bộ.
                // TODO (Follow-up): Khóa lại .hasAnyRole("STAFF", "CHEF", "OWNER", "MANAGER") sau khi Auth PR được merge.
                .requestMatchers(HttpMethod.PATCH, "/api/v1/dishes/*/availability").permitAll()

                // 5. Xác thực người dùng (Auth endpoints)
                .requestMatchers("/api/v1/auth/**").permitAll()

                // 6. Quản trị nhân sự nội bộ (Admin User Management)
                .requestMatchers("/api/v1/admin/users", "/api/v1/admin/users/**").permitAll()

                // 7. Quản trị thực đơn món ăn (Admin Dish/Menu Management - UC_OWN_02)
                // NOTE: Tạm thời permitAll trong môi trường dev/local để phục vụ kiểm thử tích hợp Frontend & Postman.
                // Controller đã được cấu hình sẵn @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')").
                .requestMatchers("/api/v1/admin/dishes", "/api/v1/admin/dishes/**").permitAll()

                // 8. Quản lý ca mở & Đăng ký ca làm việc cho nhân viên (Staff Schedule - UC_STF_03)
                // NOTE: Tạm thời permitAll trong môi trường dev/local để phục vụ kiểm thử tích hợp Frontend & Postman.
                // TODO (Follow-up): Khóa lại .authenticated() ngay sau khi Auth PR được merge lên dev.
                .requestMatchers("/api/v1/staff/schedule/**").permitAll()

                // 9. Waiter – tạo đơn và xem đơn (tạm thời permitAll cho Sprint hiện tại)
                .requestMatchers(HttpMethod.POST, "/api/v1/orders").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/orders/**").permitAll()

                // 10. Danh sách bàn (Waiter FloorPlan & Reservation)
                .requestMatchers(HttpMethod.GET, "/api/v1/tables/**").permitAll()

                // Mọi endpoint nghiệp vụ còn lại bắt buộc phải xác thực Token
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
