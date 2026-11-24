package com.restaurantos.security;

import com.restaurantos.common.enums.Permission;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Bảo vệ kết nối và đăng ký kênh WebSocket STOMP theo RBAC & Table QR Token:
 * - CONNECT: Xác thực Bearer JWT (Staff / KDS Tablet) hoặc lưu X-Table-Token (Customer).
 * - SUBSCRIBE: Kiểm tra quyền trên từng nhóm topic nội bộ (/topic/kds, /topic/pos, /topic/manager, /topic/admin, /topic/table/{id}).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ATTR_TABLE_TOKEN = "X-Table-Token";

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final CustomerTableAuthService customerTableAuthService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            handleConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            handleSubscribe(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            String token = authHeader.substring(BEARER_PREFIX.length()).trim();
            try {
                Claims claims = jwtTokenProvider.parseAndValidate(token);
                String tokenType = jwtTokenProvider.extractTokenType(claims);
                if (!JwtTokenProvider.TOKEN_TYPE_MANAGER_APPROVAL.equals(tokenType)) {
                    UUID userId = jwtTokenProvider.extractUserId(claims);
                    UserEntity user = userRepository.findById(userId)
                            .filter(u -> u.getDeletedAt() == null && Boolean.TRUE.equals(u.getIsActive()))
                            .orElse(null);

                    if (user != null && user.getRole() != null) {
                        Set<String> authStrings = JwtTokenProvider.TOKEN_TYPE_KDS.equals(tokenType)
                                ? JwtTokenProvider.KDS_TABLET_AUTHORITIES
                                : UserRole.fromCode(user.getRole().getCode()).orElse(UserRole.STAFF).getAllAuthorities();

                        List<SimpleGrantedAuthority> authorities = authStrings.stream()
                                .map(SimpleGrantedAuthority::new)
                                .toList();

                        Authentication auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
                        accessor.setUser(auth);
                    }
                }
            } catch (JwtException | IllegalArgumentException ex) {
                log.warn("STOMP CONNECT JWT không hợp lệ: {}", ex.getMessage());
            }
        }

        String tableToken = accessor.getFirstNativeHeader(ATTR_TABLE_TOKEN);
        if (tableToken != null && !tableToken.isBlank() && accessor.getSessionAttributes() != null) {
            accessor.getSessionAttributes().put(ATTR_TABLE_TOKEN, tableToken.trim());
        }
    }

    private void handleSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }

        Authentication auth = (accessor.getUser() instanceof Authentication a) ? a : null;

        if (destination.startsWith("/topic/kds")) {
            requireAuthority(auth, Permission.KDS_QUEUE_VIEW.getAuthority(), destination);
        } else if (destination.startsWith("/topic/pos")) {
            requireAnyAuthority(auth, Set.of(
                    Permission.POS_BILL_VIEW.getAuthority(),
                    Permission.TABLE_FLOOR_PLAN_VIEW.getAuthority()
            ), destination);
        } else if (destination.startsWith("/topic/manager") || destination.startsWith("/topic/admin")) {
            requireAuthority(auth, Permission.REPORT_OPERATIONS_KPI_VIEW.getAuthority(), destination);
        } else if (destination.startsWith("/topic/table/")) {
            // Staff đã đăng nhập được theo dõi bàn; Customer cần X-Table-Token khớp đúng tableId
            if (auth != null && auth.isAuthenticated()) {
                return;
            }
            UUID tableId = extractTableIdFromTopic(destination);
            String tableToken = extractSessionTableToken(accessor);
            if (!customerTableAuthService.isValidTableToken(tableId, tableToken)) {
                throw new AccessDeniedException("Không có quyền subscribe kênh bàn: " + destination);
            }
        }
        // /topic/menu/** là kênh công khai cho thực đơn QR
    }

    private void requireAuthority(Authentication auth, String required, String destination) {
        if (auth == null || !auth.isAuthenticated()
                || auth.getAuthorities().stream().noneMatch(a -> required.equals(a.getAuthority()))) {
            throw new AccessDeniedException("Không có quyền subscribe kênh: " + destination);
        }
    }

    private void requireAnyAuthority(Authentication auth, Set<String> allowed, String destination) {
        if (auth == null || !auth.isAuthenticated()
                || auth.getAuthorities().stream().noneMatch(a -> allowed.contains(a.getAuthority()))) {
            throw new AccessDeniedException("Không có quyền subscribe kênh: " + destination);
        }
    }

    private UUID extractTableIdFromTopic(String destination) {
        // /topic/table/{tableId}/cart hoặc /topic/table/{tableId}/orders
        String[] parts = destination.split("/");
        if (parts.length < 4) {
            return null;
        }
        try {
            return UUID.fromString(parts[3]);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String extractSessionTableToken(StompHeaderAccessor accessor) {
        String headerToken = accessor.getFirstNativeHeader(ATTR_TABLE_TOKEN);
        if (headerToken != null && !headerToken.isBlank()) {
            return headerToken.trim();
        }
        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null && attrs.get(ATTR_TABLE_TOKEN) instanceof String s) {
            return s;
        }
        return null;
    }
}
