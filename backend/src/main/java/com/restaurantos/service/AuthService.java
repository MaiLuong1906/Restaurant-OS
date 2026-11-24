package com.restaurantos.service;

import com.restaurantos.common.dto.auth.*;
import com.restaurantos.common.dto.user.UserResponseDto;
import com.restaurantos.common.enums.Permission;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Đăng nhập tài khoản nhân sự bằng Số điện thoại / Username / Mã nhân viên + Mật khẩu.
     */
    @Transactional(readOnly = true)
    public LoginResponse loginStaff(LoginRequest request) {
        String identifier = request.identifier().trim();
        UserEntity user = userRepository.findByPhoneAndDeletedAtIsNull(identifier)
                .or(() -> userRepository.findByUsernameAndDeletedAtIsNull(identifier))
                .or(() -> userRepository.findByEmployeeCodeIgnoreCaseAndDeletedAtIsNull(identifier))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Thông tin đăng nhập không chính xác"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Tài khoản đang bị tạm khóa. Vui lòng liên hệ Quản lý.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Thông tin đăng nhập không chính xác");
        }

        UserRole role = resolveUserRole(user);
        String token = jwtTokenProvider.generateStaffToken(user, role);
        Set<String> permissions = role.getPermissions().stream()
                .map(Permission::getAuthority)
                .collect(Collectors.toUnmodifiableSet());

        log.info("Đăng nhập nhân sự thành công: username={}, role={}", user.getUsername(), role.name());
        return new LoginResponse(
                token,
                "Bearer",
                jwtTokenProvider.getStaffExpirationSeconds(),
                UserResponseDto.fromEntity(user),
                permissions
        );
    }

    /**
     * Đăng nhập trạm KDS bằng mã PIN cá nhân (chỉ cho phép tài khoản có quyền AUTH:KDS_PIN:EXECUTE).
     */
    @Transactional(readOnly = true)
    public KdsSessionResponse loginKdsPin(KdsPinLoginRequest request) {
        List<UserEntity> activeUsers = userRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();

        UserEntity matchedUser = activeUsers.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> u.getPinCodeHash() != null && !u.getPinCodeHash().isBlank())
                .filter(u -> resolveUserRole(u).hasPermission(Permission.AUTH_KDS_PIN_EXECUTE))
                .filter(u -> matchesPin(request.pin(), u.getPinCodeHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Mã PIN KDS không đúng hoặc tài khoản không có quyền vào bếp"));

        UserRole role = resolveUserRole(matchedUser);
        String tabletId = (request.tabletId() != null && !request.tabletId().isBlank())
                ? request.tabletId().trim()
                : "tablet-main-kitchen";

        String token = jwtTokenProvider.generateKdsToken(matchedUser, role, tabletId);
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(jwtTokenProvider.getKdsExpirationSeconds());

        log.info("Đăng nhập KDS PIN thành công: employeeCode={}, role={}, tabletId={}",
                matchedUser.getEmployeeCode(), role.name(), tabletId);

        return new KdsSessionResponse(
                token,
                "Bearer",
                jwtTokenProvider.getKdsExpirationSeconds(),
                tabletId,
                matchedUser.getId(),
                matchedUser.getEmployeeCode(),
                matchedUser.getFullName(),
                role.name(),
                JwtTokenProvider.KDS_TABLET_AUTHORITIES,
                now,
                expiresAt
        );
    }

    /**
     * Xác thực mã PIN Quản lý / Chủ quán để phê duyệt ngoại lệ (hủy món, hoàn bill, chiết khấu vượt trần).
     */
    @Transactional(readOnly = true)
    public VerifyManagerPinResponse verifyManagerPin(VerifyManagerPinRequest request) {
        Permission requiredPerm = Permission.fromAuthority(request.requiredPermission())
                .orElse(Permission.AUTH_MANAGER_PIN_APPROVE);

        List<UserEntity> activeUsers = userRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();

        UserEntity approver = activeUsers.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> u.getPinCodeHash() != null && !u.getPinCodeHash().isBlank())
                .filter(u -> resolveUserRole(u).hasPermission(Permission.AUTH_MANAGER_PIN_APPROVE))
                .filter(u -> matchesPin(request.pin(), u.getPinCodeHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Mã PIN Quản lý không đúng hoặc không có thẩm quyền phê duyệt"));

        UserRole approverRole = resolveUserRole(approver);

        if (!approverRole.hasPermission(requiredPerm)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản " + approverRole.getDisplayName() + " không có quyền phê duyệt: " + requiredPerm.getAuthority());
        }

        if (request.requestedDiscountPercent() != null
                && request.requestedDiscountPercent() > approverRole.getDefaultDiscountCeiling()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Mức giảm giá " + request.requestedDiscountPercent() + "% vượt quá trần cho phép ("
                            + approverRole.getDefaultDiscountCeiling() + "%) của " + approverRole.getDisplayName()
                            + ". Vui lòng yêu cầu Chủ nhà hàng duyệt.");
        }

        String approvalToken = jwtTokenProvider.generateManagerApprovalToken(approver, approverRole);
        log.info("Xác thực PIN duyệt ngoại lệ thành công: approver={}, role={}", approver.getUsername(), approverRole.name());

        return new VerifyManagerPinResponse(
                true,
                approver.getId(),
                approver.getEmployeeCode(),
                approver.getFullName(),
                approverRole.name(),
                approverRole.getDefaultDiscountCeiling(),
                approvalToken,
                jwtTokenProvider.getApprovalExpirationSeconds()
        );
    }

    /**
     * Lấy thông tin người dùng hiện tại từ phiên đăng nhập JWT.
     */
    public LoginResponse getCurrentSessionInfo(UserEntity currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
        }
        UserRole role = resolveUserRole(currentUser);
        Set<String> permissions = role.getPermissions().stream()
                .map(Permission::getAuthority)
                .collect(Collectors.toUnmodifiableSet());
        return new LoginResponse(
                null,
                "Bearer",
                0,
                UserResponseDto.fromEntity(currentUser),
                permissions
        );
    }

    private UserRole resolveUserRole(UserEntity user) {
        String code = user.getRole() != null ? user.getRole().getCode() : "STAFF";
        return UserRole.fromCode(code).orElse(UserRole.STAFF);
    }

    /**
     * Hỗ trợ so khớp cả BCrypt (mã PIN tạo qua AdminUserController) và SHA-256 hex (seed data V2).
     */
    private boolean matchesPin(String rawPin, String storedHash) {
        if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPin, storedHash);
        }
        // Tương thích seed data V2 dùng SHA-256 hex (64 ký tự)
        if (storedHash.length() == 64) {
            return storedHash.equalsIgnoreCase(sha256Hex(rawPin));
        }
        return false;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 không khả dụng", e);
        }
    }
}
