package com.restaurantos.security;

import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Bộ lọc xác thực JWT chạy một lần cho mỗi request.
 * - Đọc Authorization: Bearer <token>
 * - Kiểm tra chữ ký, hạn sử dụng và trạng thái tài khoản trong DB (isActive = true, deletedAt = null)
 * - Nạp UserEntity làm Principal và đầy đủ ROLE_<CODE> + Permission authorities vào SecurityContextHolder
 *
 * Lưu ý: Không gắn @Component trực tiếp để tránh @WebMvcTest slice test tự động scan Filter
 * khi không có UserRepository; Filter được đăng ký có điều kiện trong SecurityConfig.
 */
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtTokenProvider.parseAndValidate(token);
            String tokenType = jwtTokenProvider.extractTokenType(claims);

            // Không dùng token MANAGER_APPROVAL (60s) để thay thế phiên đăng nhập chính
            if (JwtTokenProvider.TOKEN_TYPE_MANAGER_APPROVAL.equals(tokenType)) {
                filterChain.doFilter(request, response);
                return;
            }

            UUID userId = jwtTokenProvider.extractUserId(claims);
            UserEntity user = userRepository.findById(userId)
                    .filter(u -> u.getDeletedAt() == null && Boolean.TRUE.equals(u.getIsActive()))
                    .orElse(null);

            if (user != null && user.getRole() != null) {
                Set<String> authorityStrings;
                if (JwtTokenProvider.TOKEN_TYPE_KDS.equals(tokenType)) {
                    // Phiên KDS Tablet chỉ được cấp tập quyền KDS giới hạn
                    authorityStrings = JwtTokenProvider.KDS_TABLET_AUTHORITIES;
                } else {
                    UserRole role = UserRole.fromCode(user.getRole().getCode()).orElse(UserRole.STAFF);
                    authorityStrings = role.getAllAuthorities();
                }

                List<SimpleGrantedAuthority> authorities = authorityStrings.stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("JWT không hợp lệ hoặc đã hết hạn: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
