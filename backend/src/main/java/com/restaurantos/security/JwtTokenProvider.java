package com.restaurantos.security;

import com.restaurantos.common.enums.Permission;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Quản lý sinh và xác thực JWT cho 3 loại phiên tách biệt:
 * 1. STAFF: Phiên đăng nhập cá nhân của nhân sự (TTL mặc định 8 giờ).
 * 2. KDS_TABLET: Phiên trạm bếp KDS dùng chung (TTL mặc định 12 giờ, chỉ cấp quyền KDS).
 * 3. MANAGER_APPROVAL: Token phê duyệt ngoại lệ ngắn hạn sau khi xác thực PIN Quản lý (TTL 60 giây).
 */
@Component
@Slf4j
public class JwtTokenProvider {

    public static final String TOKEN_TYPE_STAFF = "STAFF";
    public static final String TOKEN_TYPE_KDS = "KDS_TABLET";
    public static final String TOKEN_TYPE_MANAGER_APPROVAL = "MANAGER_APPROVAL";

    private static final String DEFAULT_DEV_SECRET =
            "RestaurantOS-Dev-Default-JWT-Secret-Key-Must-Be-Overridden-In-Prod-2026!";

    /**
     * Tập quyền tối thiểu cho phiên KDS Tablet (Least Privilege: không cấp quyền HR/POS/Admin).
     */
    public static final Set<String> KDS_TABLET_AUTHORITIES;

    static {
        Set<String> kdsAuths = new LinkedHashSet<>();
        kdsAuths.add("ROLE_CHEF");
        kdsAuths.add(Permission.KDS_QUEUE_VIEW.getAuthority());
        kdsAuths.add(Permission.KDS_COOKING_STATUS_UPDATE.getAuthority());
        kdsAuths.add(Permission.KDS_WASTAGE_CREATE.getAuthority());
        kdsAuths.add(Permission.MENU_CATALOG_VIEW.getAuthority());
        kdsAuths.add(Permission.MENU_BOM_RECIPE_VIEW.getAuthority());
        kdsAuths.add(Permission.MENU_AVAILABILITY_UPDATE.getAuthority());
        kdsAuths.add(Permission.ORDER_ACTIVE_VIEW.getAuthority());
        kdsAuths.add(Permission.INVENTORY_STOCK_VIEW.getAuthority());
        kdsAuths.add(Permission.INVENTORY_PREP_PRODUCTION_EXECUTE.getAuthority());
        KDS_TABLET_AUTHORITIES = Collections.unmodifiableSet(kdsAuths);
    }

    private final SecretKey signingKey;
    private final long staffExpirationSeconds;
    private final long kdsExpirationSeconds;
    private final long approvalExpirationSeconds;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:${JWT_SECRET:" + DEFAULT_DEV_SECRET + "}}") String secret,
            @Value("${app.jwt.staff-expiration-seconds:28800}") long staffExpirationSeconds,
            @Value("${app.jwt.kds-expiration-seconds:43200}") long kdsExpirationSeconds,
            @Value("${app.jwt.approval-expiration-seconds:60}") long approvalExpirationSeconds
    ) {
        if (DEFAULT_DEV_SECRET.equals(secret)) {
            log.warn("CẢNH BÁO BẢO MẬT: Đang sử dụng JWT_SECRET mặc định của môi trường dev! "
                    + "Bắt buộc cấu hình biến môi trường JWT_SECRET riêng khi triển khai staging/production.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.staffExpirationSeconds = staffExpirationSeconds;
        this.kdsExpirationSeconds = kdsExpirationSeconds;
        this.approvalExpirationSeconds = approvalExpirationSeconds;
    }

    public String generateStaffToken(UserEntity user, UserRole role) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(staffExpirationSeconds);
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("tokenType", TOKEN_TYPE_STAFF)
                .claim("role", role.name())
                .claim("employeeCode", user.getEmployeeCode())
                .claim("fullName", user.getFullName())
                .claim("discountCeiling", role.getDefaultDiscountCeiling())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public String generateKdsToken(UserEntity user, UserRole role, String tabletId) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(kdsExpirationSeconds);
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("tokenType", TOKEN_TYPE_KDS)
                .claim("role", role.name())
                .claim("tabletId", tabletId != null ? tabletId : "tablet-main-kitchen")
                .claim("fullName", user.getFullName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public String generateManagerApprovalToken(
            UserEntity approver,
            UserRole role,
            Permission approvedPermission,
            Integer requestedDiscountPercent
    ) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(approvalExpirationSeconds);
        var builder = Jwts.builder()
                .subject(approver.getId().toString())
                .claim("tokenType", TOKEN_TYPE_MANAGER_APPROVAL)
                .claim("role", role.name())
                .claim("discountCeiling", role.getDefaultDiscountCeiling())
                .claim("approvedPermission", approvedPermission != null
                        ? approvedPermission.getAuthority()
                        : Permission.AUTH_MANAGER_PIN_APPROVE.getAuthority())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry));

        if (requestedDiscountPercent != null) {
            builder.claim("requestedDiscountPercent", requestedDiscountPercent);
        }

        return builder.signWith(signingKey).compact();
    }

    public String generateManagerApprovalToken(UserEntity approver, UserRole role) {
        return generateManagerApprovalToken(approver, role, Permission.AUTH_MANAGER_PIN_APPROVE, null);
    }

    /**
     * Xác thực approvalToken ngắn hạn (60s) cho các API duyệt ngoại lệ (hủy món, hoàn bill, chiết khấu vượt trần).
     * Trả về UUID của người phê duyệt (approverId) nếu hợp lệ.
     */
    public UUID validateManagerApprovalToken(
            String approvalToken,
            Permission requiredPermission,
            Integer requestedDiscountPercent
    ) {
        Claims claims = parseAndValidate(approvalToken);
        if (!TOKEN_TYPE_MANAGER_APPROVAL.equals(extractTokenType(claims))) {
            throw new IllegalArgumentException("Token không phải loại MANAGER_APPROVAL");
        }
        if (requiredPermission != null) {
            String approvedPerm = claims.get("approvedPermission", String.class);
            if (!requiredPermission.getAuthority().equals(approvedPerm)) {
                throw new IllegalArgumentException("Approval token không khớp với quyền yêu cầu: " + requiredPermission.getAuthority());
            }
        }
        if (requestedDiscountPercent != null) {
            Integer approvedDiscount = claims.get("requestedDiscountPercent", Integer.class);
            Integer ceiling = claims.get("discountCeiling", Integer.class);
            if (approvedDiscount == null || requestedDiscountPercent > approvedDiscount
                    || (ceiling != null && requestedDiscountPercent > ceiling)) {
                throw new IllegalArgumentException("Mức chiết khấu vượt quá phạm vi đã phê duyệt trong approvalToken");
            }
        }
        return extractUserId(claims);
    }

    public Claims parseAndValidate(String token) throws JwtException, IllegalArgumentException {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public String extractTokenType(Claims claims) {
        Object type = claims.get("tokenType");
        return type != null ? type.toString() : TOKEN_TYPE_STAFF;
    }

    public long getStaffExpirationSeconds() {
        return staffExpirationSeconds;
    }

    public long getKdsExpirationSeconds() {
        return kdsExpirationSeconds;
    }

    public long getApprovalExpirationSeconds() {
        return approvalExpirationSeconds;
    }
}
