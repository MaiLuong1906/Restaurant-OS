package com.restaurantos.security;

import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String TEST_SECRET = "Test-Secret-Key-For-Restaurant-OS-Unit-Tests-At-Least-256-Bits!!";

    private final JwtTokenProvider provider = new JwtTokenProvider(TEST_SECRET, 3600, 7200, 60);

    @Test
    @DisplayName("Sinh và xác thực Staff JWT thành công với đầy đủ claims")
    void generateAndValidateStaffToken() {
        UUID userId = UUID.randomUUID();
        UserEntity user = UserEntity.builder()
                .id(userId)
                .employeeCode("QL001")
                .username("manager")
                .fullName("Trần Quản Lý")
                .build();

        String token = provider.generateStaffToken(user, UserRole.MANAGER);
        Claims claims = provider.parseAndValidate(token);

        assertThat(provider.extractUserId(claims)).isEqualTo(userId);
        assertThat(provider.extractTokenType(claims)).isEqualTo(JwtTokenProvider.TOKEN_TYPE_STAFF);
        assertThat(claims.get("role", String.class)).isEqualTo("MANAGER");
        assertThat(claims.get("discountCeiling", Integer.class)).isEqualTo(20);
    }

    @Test
    @DisplayName("Sinh và xác thực KDS Tablet Token thành công")
    void generateAndValidateKdsToken() {
        UUID userId = UUID.randomUUID();
        UserEntity chef = UserEntity.builder()
                .id(userId)
                .employeeCode("BP001")
                .fullName("Nguyễn Bếp Trưởng")
                .build();

        String token = provider.generateKdsToken(chef, UserRole.CHEF, "tablet-hot-01");
        Claims claims = provider.parseAndValidate(token);

        assertThat(provider.extractUserId(claims)).isEqualTo(userId);
        assertThat(provider.extractTokenType(claims)).isEqualTo(JwtTokenProvider.TOKEN_TYPE_KDS);
        assertThat(claims.get("tabletId", String.class)).isEqualTo("tablet-hot-01");
    }

    @Test
    @DisplayName("Từ chối token bị giả mạo chữ ký")
    void rejectTamperedToken() {
        JwtTokenProvider otherProvider = new JwtTokenProvider(
                "Another-Completely-Different-Secret-Key-With-256-Bit-Length-1234", 3600, 7200, 60);
        UserEntity user = UserEntity.builder().id(UUID.randomUUID()).fullName("Test").build();
        String forgedToken = otherProvider.generateStaffToken(user, UserRole.OWNER);

        assertThatThrownBy(() -> provider.parseAndValidate(forgedToken))
                .isInstanceOf(JwtException.class);
    }
}
