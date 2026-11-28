package com.restaurantos.service;

import com.restaurantos.common.dto.auth.*;
import com.restaurantos.common.enums.Permission;
import com.restaurantos.entity.RoleEntity;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private PasswordEncoder passwordEncoder;
    private JwtTokenProvider jwtTokenProvider;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        jwtTokenProvider = new JwtTokenProvider(
                "Test-Secret-Key-For-Restaurant-OS-Auth-Service-Tests-256-Bits!!",
                28800, 43200, 60);
        authService = new AuthService(userRepository, passwordEncoder, jwtTokenProvider);
    }

    private UserEntity buildUser(String roleCode, String username, String phone, String rawPass, String rawPin, boolean active) {
        RoleEntity role = RoleEntity.builder()
                .id(UUID.randomUUID())
                .code(roleCode)
                .name(roleCode)
                .build();
        return UserEntity.builder()
                .id(UUID.randomUUID())
                .employeeCode(roleCode + "001")
                .username(username)
                .phone(phone)
                .fullName("User " + roleCode)
                .passwordHash(passwordEncoder.encode(rawPass))
                .pinCodeHash(rawPin != null ? passwordEncoder.encode(rawPin) : null)
                .role(role)
                .isActive(active)
                .build();
    }

    @Test
    @DisplayName("Đăng nhập nhân sự thành công bằng SĐT, trả về JWT và danh sách Permission")
    void loginStaff_success() {
        UserEntity waiter = buildUser("WAITER", "waiter1", "0901234567", "secret123", null, true);
        when(userRepository.findByPhoneAndDeletedAtIsNull("0901234567")).thenReturn(Optional.of(waiter));

        LoginResponse res = authService.loginStaff(new LoginRequest("0901234567", "secret123"));

        assertThat(res.accessToken()).isNotBlank();
        assertThat(res.user().getRoleCode()).isEqualTo("WAITER");
        assertThat(res.permissions()).contains(Permission.ORDER_CREATE_APPEND_EXECUTE.getAuthority());
        assertThat(res.permissions()).doesNotContain(Permission.USER_ACCOUNT_DELETE.getAuthority());
    }

    @Test
    @DisplayName("Từ chối đăng nhập 403 nếu tài khoản bị khóa (isActive = false)")
    void loginStaff_lockedAccount_throws403() {
        UserEntity locked = buildUser("CASHIER", "cash1", "0909999999", "secret123", null, false);
        when(userRepository.findByPhoneAndDeletedAtIsNull("0909999999")).thenReturn(Optional.of(locked));

        assertThatThrownBy(() -> authService.loginStaff(new LoginRequest("0909999999", "secret123")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Đăng nhập KDS PIN thành công cho CHEF và từ chối PIN của WAITER")
    void loginKdsPin_allowsChef_deniesWaiter() {
        UserEntity chefWithPin = buildUser("CHEF", "chef1", "0902222222", "pass", "2222", true);
        when(userRepository.findActiveUsersWithPinByRoleCodes(List.of("CHEF", "MANAGER", "OWNER")))
                .thenReturn(List.of(chefWithPin));

        // PIN sai hoặc không thuộc nhóm KDS -> 401
        assertThatThrownBy(() -> authService.loginKdsPin(new KdsPinLoginRequest("1111", "tablet-1")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        // CHEF có quyền -> thành công
        KdsSessionResponse session = authService.loginKdsPin(new KdsPinLoginRequest("2222", "tablet-1"));
        assertThat(session.accessToken()).isNotBlank();
        assertThat(session.roleCode()).isEqualTo("CHEF");
        assertThat(session.permissions()).contains(Permission.KDS_COOKING_STATUS_UPDATE.getAuthority());
    }

    @Test
    @DisplayName("Đăng nhập KDS PIN 4 số '1234' thành công (trả token KDS), PIN sai 4 số trả 401")
    void loginKdsPin_seeded4Digits1234_succeedsAndWrong4DigitsThrows401() {
        UserEntity managerWithSeedPin = buildUser("MANAGER", "mgr1", "0903333333", "admin123", "1234", true);
        when(userRepository.findActiveUsersWithPinByRoleCodes(List.of("CHEF", "MANAGER", "OWNER")))
                .thenReturn(List.of(managerWithSeedPin));

        KdsSessionResponse session = authService.loginKdsPin(new KdsPinLoginRequest("1234", "tablet-1"));
        assertThat(session.accessToken()).isNotBlank();
        assertThat(session.roleCode()).isEqualTo("MANAGER");
        assertThat(session.permissions()).contains(Permission.KDS_QUEUE_VIEW.getAuthority());

        assertThatThrownBy(() -> authService.loginKdsPin(new KdsPinLoginRequest("9999", "tablet-1")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Verify Manager PIN: MANAGER duyệt được <= 20%, bị chặn 403 nếu yêu cầu 30% (chỉ OWNER duyệt được)")
    void verifyManagerPin_enforcesDiscountCeiling() {
        UserEntity manager = buildUser("MANAGER", "mgr1", "0903333333", "pass", "8841", true);
        UserEntity owner = buildUser("OWNER", "owner1", "0904444444", "pass", "9999", true);
        when(userRepository.findActiveUsersWithPinByRoleCodes(List.of("MANAGER", "OWNER")))
                .thenReturn(List.of(manager, owner));

        // Manager duyệt 15% -> OK
        VerifyManagerPinResponse okRes = authService.verifyManagerPin(
                new VerifyManagerPinRequest("8841", Permission.POS_DISCOUNT_OVERRIDE_APPROVE.getAuthority(), 15));
        assertThat(okRes.approved()).isTrue();
        assertThat(okRes.approverRole()).isEqualTo("MANAGER");
        assertThat(okRes.approvalToken()).isNotBlank();
        assertThat(jwtTokenProvider.validateManagerApprovalToken(
                okRes.approvalToken(), Permission.POS_DISCOUNT_OVERRIDE_APPROVE, 15)).isEqualTo(manager.getId());

        // Manager duyệt 30% (> trần 20%) -> 403
        assertThatThrownBy(() -> authService.verifyManagerPin(
                new VerifyManagerPinRequest("8841", Permission.POS_DISCOUNT_OVERRIDE_APPROVE.getAuthority(), 30)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        // Owner duyệt 30% (<= trần 100%) -> OK
        VerifyManagerPinResponse ownerRes = authService.verifyManagerPin(
                new VerifyManagerPinRequest("9999", Permission.POS_DISCOUNT_OVERRIDE_APPROVE.getAuthority(), 30));
        assertThat(ownerRes.approved()).isTrue();
        assertThat(ownerRes.approverRole()).isEqualTo("OWNER");
    }

    @Test
    @DisplayName("Verify Manager PIN: trả 400 Bad Request nếu requiredPermission không tồn tại")
    void verifyManagerPin_invalidPermission_throws400() {
        assertThatThrownBy(() -> authService.verifyManagerPin(
                new VerifyManagerPinRequest("8841", "INVALID:PERM:CODE", 10)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("GET /auth/me cho phiên KDS_TABLET của OWNER chỉ trả về quyền KDS, không lộ quyền quản trị")
    void getCurrentSessionInfo_kdsSession_doesNotLeakOwnerPermissions() {
        UserEntity owner = buildUser("OWNER", "owner1", "0904444444", "pass", "9999", true);
        var kdsAuth = new UsernamePasswordAuthenticationToken(
                owner,
                null,
                JwtTokenProvider.KDS_TABLET_AUTHORITIES.stream().map(SimpleGrantedAuthority::new).toList()
        );

        LoginResponse me = authService.getCurrentSessionInfo(owner, kdsAuth);
        assertThat(me.permissions()).contains(Permission.KDS_COOKING_STATUS_UPDATE.getAuthority());
        assertThat(me.permissions()).doesNotContain(Permission.USER_ACCOUNT_DELETE.getAuthority());
        assertThat(me.permissions()).doesNotContain(Permission.REPORT_FINANCE_PNL_BCG_VIEW.getAuthority());
    }
}
