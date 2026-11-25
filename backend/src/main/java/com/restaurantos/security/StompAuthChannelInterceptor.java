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
 * Bảo vệ kết nối, đăng ký và gửi frame WebSocket STOMP theo RBAC & Table QR Token:
 * - CONNECT: Xác thực Bearer JWT (từ chối ngay nếu gửi JWT sai/hết hạn) hoặc lưu X-Table-Token.
 * - SUBSCRIBE: Kiểm tra quyền trên từng nhóm topic (/topic/kds, /topic/pos, /topic/manager, /topic/admin,
 *              /topic/inventory, /topic/table/{id}, /topic/tables/**).
 * - SEND: Chặn client gửi trực tiếp sự kiện giả mạo vào Simple Broker (/topic/**) ngoại trừ kênh giỏ hàng bàn hợp lệ.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String ATTR_TABLE_TOKEN = "X-Table-Token";

    private static final Set<String> TABLE_VIEW_AUTHORITIES = Set.of(
            Permission.ORDER_ACTIVE_VIEW.getAuthority(),
            Permission.TABLE_FLOOR_PLAN_VIEW.getAuthority()
    );

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
        } else if (StompCommand.SEND.equals(accessor.getCommand())) {
            handleSend(accessor);
        }

        return message;
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            String token = authHeader.substring(BEARER_PREFIX.length()).trim();
            if (token.isEmpty()) {
                throw new AccessDeniedException("JWT rỗng khi kết nối STOMP");
            }
            try {
                Claims claims = jwtTokenProvider.parseAndValidate(token);
                String tokenType = jwtTokenProvider.extractTokenType(claims);
                if (JwtTokenProvider.TOKEN_TYPE_MANAGER_APPROVAL.equals(tokenType)) {
                    throw new AccessDeniedException("Không được dùng MANAGER_APPROVAL token để kết nối STOMP");
                }

                UUID userId = jwtTokenProvider.extractUserId(claims);
                UserEntity user = userRepository.findById(userId)
                        .filter(u -> u.getDeletedAt() == null && Boolean.TRUE.equals(u.getIsActive()))
                        .orElseThrow(() -> new AccessDeniedException("Tài khoản không tồn tại hoặc đã bị khóa"));

                if (user.getRole() == null) {
                    throw new AccessDeniedException("Tài khoản chưa được gán vai trò");
                }

                Set<String> authStrings = JwtTokenProvider.TOKEN_TYPE_KDS.equals(tokenType)
                        ? JwtTokenProvider.KDS_TABLET_AUTHORITIES
                        : UserRole.fromCode(user.getRole().getCode()).orElse(UserRole.STAFF).getAllAuthorities();

                List<SimpleGrantedAuthority> authorities = authStrings.stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList();

                Authentication auth = new UsernamePasswordAuthenticationToken(user, null, authorities);
                accessor.setUser(auth);
            } catch (JwtException | IllegalArgumentException ex) {
                log.warn("STOMP CONNECT bị từ chối do JWT không hợp lệ: {}", ex.getMessage());
                throw new AccessDeniedException("JWT không hợp lệ hoặc đã hết hạn");
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
        } else if (destination.startsWith("/topic/inventory")) {
            requireAuthority(auth, Permission.INVENTORY_STOCK_VIEW.getAuthority(), destination);
        } else if (destination.startsWith("/topic/table/") || destination.startsWith("/topic/tables/")) {
            authorizeTableTopic(destination, auth, accessor);
        }
        // /topic/menu/** là kênh công khai cho thực đơn QR
    }

    private void handleSend(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            throw new AccessDeniedException("Destination không hợp lệ cho STOMP SEND");
        }

        Authentication auth = (accessor.getUser() instanceof Authentication a) ? a : null;

        // Chặn tuyệt đối client gửi trực tiếp frame SEND vào Simple Broker /topic/**
        // Ngoại lệ duy nhất: đồng bộ giỏ hàng nhóm tại bàn (/topic/table/{id}/cart hoặc /topic/tables/{id}/cart)
        if (destination.startsWith("/topic/")) {
            if ((destination.startsWith("/topic/table/") || destination.startsWith("/topic/tables/"))
                    && destination.endsWith("/cart")) {
                authorizeTableTopic(destination, auth, accessor);
                return;
            }
            throw new AccessDeniedException("Không được phép gửi trực tiếp STOMP SEND vào kênh broadcast: " + destination);
        }

        // Các destination /app/** yêu cầu đã xác thực Staff hoặc có X-Table-Token tồn tại hợp lệ trong DB
        if (destination.startsWith("/app/")) {
            if (auth != null && auth.isAuthenticated()) {
                return;
            }
            String tableToken = extractSessionTableToken(accessor);
            if (!customerTableAuthService.isValidAnyTableToken(tableToken)) {
                throw new AccessDeniedException("Yêu cầu xác thực hợp lệ khi gửi STOMP SEND tới: " + destination);
            }
        }
    }

    private void authorizeTableTopic(String destination, Authentication auth, StompHeaderAccessor accessor) {
        // 1. Staff phải có quyền ORDER:ACTIVE:VIEW hoặc TABLE:FLOOR_PLAN:VIEW (chặn STAFF thường xem trộm bàn)
        if (hasAnyAuthority(auth, TABLE_VIEW_AUTHORITIES)) {
            return;
        }
        // 2. Customer chỉ được truy cập đúng kênh bàn có UUID khớp X-Table-Token
        UUID tableId = extractTableIdFromTopic(destination);
        String tableToken = extractSessionTableToken(accessor);
        if (tableId != null && customerTableAuthService.isValidTableToken(tableId, tableToken)) {
            return;
        }
        throw new AccessDeniedException("Không có quyền truy cập kênh bàn: " + destination);
    }

    private void requireAuthority(Authentication auth, String required, String destination) {
        if (auth == null || !auth.isAuthenticated()
                || auth.getAuthorities().stream().noneMatch(a -> required.equals(a.getAuthority()))) {
            throw new AccessDeniedException("Không có quyền subscribe kênh: " + destination);
        }
    }

    private void requireAnyAuthority(Authentication auth, Set<String> allowed, String destination) {
        if (!hasAnyAuthority(auth, allowed)) {
            throw new AccessDeniedException("Không có quyền subscribe kênh: " + destination);
        }
    }

    private boolean hasAnyAuthority(Authentication auth, Set<String> allowed) {
        return auth != null && auth.isAuthenticated()
                && auth.getAuthorities().stream().anyMatch(a -> allowed.contains(a.getAuthority()));
    }

    private UUID extractTableIdFromTopic(String destination) {
        // /topic/table/{tableId}/cart hoặc /topic/tables/{tableId}/cart
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
