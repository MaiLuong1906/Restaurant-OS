package com.restaurantos.service;

import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.user.CreateUserRequest;
import com.restaurantos.common.dto.user.UpdatePinRequest;
import com.restaurantos.common.dto.user.UpdateUserRequest;
import com.restaurantos.common.dto.user.UserResponseDto;
import com.restaurantos.entity.RoleEntity;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.RoleRepository;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private RoleEntity roleManager;
    private UserEntity sampleUser;

    @BeforeEach
    void setUp() {
        roleManager = RoleEntity.builder()
                .id(UUID.randomUUID())
                .code("MANAGER")
                .name("Quản lý ca")
                .description("Quản lý ca trực")
                .build();

        sampleUser = UserEntity.builder()
                .id(UUID.randomUUID())
                .employeeCode("QL001")
                .username("mai.manager")
                .fullName("Trần Thị Mai")
                .email("mai.manager@restaurant.vn")
                .phone("0901234567")
                .role(roleManager)
                .passwordHash("hashed_password")
                .pinCodeHash("hashed_pin")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Lấy danh sách tất cả nhân sự chưa bị xóa mềm")
    void testGetAllUsers_Success() {
        when(userRepository.searchUsers(null, null, null))
                .thenReturn(List.of(sampleUser));

        List<UserResponseDto> result = userService.getAllUsers(null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUsername()).isEqualTo("mai.manager");
        assertThat(result.get(0).getEmployeeCode()).isEqualTo("QL001");
        assertThat(result.get(0).getRoleCode()).isEqualTo("MANAGER");
        assertThat(result.get(0).getDiscountCeiling()).isEqualTo(20);
        assertThat(result.get(0).isHasPin()).isTrue();
    }

    @Test
    @DisplayName("Lấy danh sách nhân sự có phân trang chuẩn Enterprise")
    void testGetUsersPaged_Success() {
        PageImpl<UserEntity> page = new PageImpl<>(List.of(sampleUser), PageRequest.of(0, 10), 1);
        when(userRepository.searchUsersPaged(eq("MANAGER"), eq("mai"), eq(true), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<UserResponseDto> result = userService.getUsersPaged("MANAGER", "mai", true, 0, 10);

        assertThat(result).isNotNull();
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getPage()).isEqualTo(0);
        assertThat(result.getSize()).isEqualTo(10);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.isFirst()).isTrue();
        assertThat(result.isLast()).isTrue();
        assertThat(result.getItems().get(0).getEmployeeCode()).isEqualTo("QL001");
    }

    @Test
    @DisplayName("Xem chi tiết nhân sự linh hoạt bằng Mã nhân viên (e.g. QL001)")
    void testGetUserByIdentifier_ByEmployeeCode() {
        when(userRepository.findByEmployeeCodeIgnoreCaseAndDeletedAtIsNull("QL001"))
                .thenReturn(Optional.of(sampleUser));

        UserResponseDto result = userService.getUserByIdentifier("QL001");

        assertThat(result).isNotNull();
        assertThat(result.getEmployeeCode()).isEqualTo("QL001");
        assertThat(result.getUsername()).isEqualTo("mai.manager");
    }

    @Test
    @DisplayName("Xem chi tiết nhân sự linh hoạt bằng Số điện thoại (e.g. 0901234567)")
    void testGetUserByIdentifier_ByPhone() {
        when(userRepository.findByEmployeeCodeIgnoreCaseAndDeletedAtIsNull("0901234567"))
                .thenReturn(Optional.empty());
        when(userRepository.findByUsernameAndDeletedAtIsNull("0901234567"))
                .thenReturn(Optional.empty());
        when(userRepository.findByPhoneAndDeletedAtIsNull("0901234567"))
                .thenReturn(Optional.of(sampleUser));

        UserResponseDto result = userService.getUserByIdentifier("0901234567");

        assertThat(result).isNotNull();
        assertThat(result.getPhone()).isEqualTo("0901234567");
        assertThat(result.getUsername()).isEqualTo("mai.manager");
    }

    @Test
    @DisplayName("Tạo nhân sự mới thành công với enum UserRole chuẩn")
    void testCreateUser_Success() {
        CreateUserRequest req = CreateUserRequest.builder()
                .fullName("Lê Thùy Linh")
                .username("linh.cashier")
                .password("password123")
                .roleCode("MANAGER")
                .pinCode("1234")
                .email("linh@restaurant.vn")
                .phone("0987654321")
                .build();

        when(userRepository.existsByPhone("0987654321")).thenReturn(false);
        when(userRepository.existsByUsername("linh.cashier")).thenReturn(false);
        when(userRepository.existsByEmail("linh@restaurant.vn")).thenReturn(false);
        when(roleRepository.findByCode("MANAGER")).thenReturn(Optional.of(roleManager));
        when(userRepository.findEmployeeCodesByPrefix("QL")).thenReturn(List.of());
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pass");
        when(passwordEncoder.encode("1234")).thenReturn("encoded_pin");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponseDto created = userService.createUser(req);

        assertThat(created).isNotNull();
        assertThat(created.getEmployeeCode()).isEqualTo("QL001");
        assertThat(created.getUsername()).isEqualTo("linh.cashier");
        assertThat(created.getFullName()).isEqualTo("Lê Thùy Linh");
        assertThat(created.getRoleCode()).isEqualTo("MANAGER");
        assertThat(created.getDiscountCeiling()).isEqualTo(20);
        verify(userRepository, times(1)).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Tạo nhân sự mới thành công với vai trò STAFF (tự sinh mã NV001)")
    void testCreateUser_StaffRole_Success() {
        RoleEntity roleStaff = RoleEntity.builder()
                .id(UUID.randomUUID())
                .code("STAFF")
                .name("Nhân viên tổng hợp")
                .description("Nhân viên phục vụ chung")
                .build();

        CreateUserRequest req = CreateUserRequest.builder()
                .fullName("Nguyễn Thử Việc")
                .password("password123")
                .roleCode("STAFF")
                .phone("0911223344")
                .build();

        when(userRepository.existsByPhone("0911223344")).thenReturn(false);
        when(userRepository.existsByUsername("0911223344")).thenReturn(false);
        when(roleRepository.findByCode("STAFF")).thenReturn(Optional.of(roleStaff));
        when(userRepository.findEmployeeCodesByPrefix("NV")).thenReturn(List.of());
        when(passwordEncoder.encode("password123")).thenReturn("encoded_pass");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponseDto created = userService.createUser(req);

        assertThat(created).isNotNull();
        assertThat(created.getEmployeeCode()).isEqualTo("NV001");
        assertThat(created.getUsername()).isEqualTo("0911223344"); // Tự động fallback lấy phone làm username
        assertThat(created.getRoleCode()).isEqualTo("STAFF");
        assertThat(created.getDiscountCeiling()).isEqualTo(0);
    }

    @Test
    @DisplayName("Ném lỗi Conflict khi số điện thoại đã được đăng ký")
    void testCreateUser_ConflictPhone() {
        CreateUserRequest req = CreateUserRequest.builder()
                .fullName("Trùng Phone")
                .phone("0901234567")
                .password("password123")
                .roleCode("MANAGER")
                .build();

        when(userRepository.existsByPhone("0901234567")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Số điện thoại '0901234567' đã được đăng ký");
    }

    @Test
    @DisplayName("Ném lỗi khi vai trò không nằm trong enum UserRole")
    void testCreateUser_InvalidRoleEnum() {
        CreateUserRequest req = CreateUserRequest.builder()
                .fullName("Người lạ")
                .username("nguoi.la")
                .phone("0912345678")
                .password("password123")
                .roleCode("SUPER_ADMIN_INVALID")
                .build();

        when(userRepository.existsByPhone("0912345678")).thenReturn(false);
        when(userRepository.existsByUsername("nguoi.la")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("Ném lỗi Conflict khi tên đăng nhập đã được sử dụng")
    void testCreateUser_ConflictUsername() {
        CreateUserRequest req = CreateUserRequest.builder()
                .fullName("Trùng tên")
                .username("mai.manager")
                .phone("0912345678")
                .password("password123")
                .roleCode("MANAGER")
                .build();

        when(userRepository.existsByPhone("0912345678")).thenReturn(false);
        when(userRepository.existsByUsername("mai.manager")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("Cập nhật mã PIN trạm thành công")
    void testUpdatePin_Success() {
        UUID userId = sampleUser.getId();
        UpdatePinRequest pinReq = new UpdatePinRequest("5678");

        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("5678")).thenReturn("new_hashed_pin");
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        UserResponseDto res = userService.updatePin(userId, pinReq);

        assertThat(res).isNotNull();
        assertThat(sampleUser.getPinCodeHash()).isEqualTo("new_hashed_pin");
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Khóa và mở khóa trạng thái tài khoản (Toggle Active Status)")
    void testToggleActiveStatus_Success() {
        UUID userId = sampleUser.getId();
        sampleUser.setIsActive(true);

        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        UserResponseDto res = userService.toggleActiveStatus(userId);

        assertThat(res).isNotNull();
        assertThat(sampleUser.getIsActive()).isFalse();
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Khóa/Xóa mềm tài khoản nhân sự (deletedAt != null, isActive = false)")
    void testDeleteUser_SoftDelete() {
        UUID userId = sampleUser.getId();
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        UserResponseDto res = userService.deleteUser(userId);

        assertThat(res).isNotNull();
        assertThat(sampleUser.getDeletedAt()).isNotNull();
        assertThat(sampleUser.getIsActive()).isFalse();
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("Thăng chức nhân sự: Đổi role từ CASHIER lên MANAGER -> tự động cấp mã QL... mới và trần chiết khấu lên 20%")
    void testUpdateUser_PromoteToManager() {
        RoleEntity roleCashier = RoleEntity.builder().id(UUID.randomUUID()).code("CASHIER").name("Thu ngân").build();
        UserEntity cashierUser = UserEntity.builder()
                .id(UUID.randomUUID())
                .employeeCode("TN004")
                .username("luongmv1.cashier")
                .fullName("Mai Van Luong")
                .role(roleCashier)
                .isActive(true)
                .build();

        UpdateUserRequest promoteReq = UpdateUserRequest.builder()
                .roleCode("MANAGER")
                .build();

        when(userRepository.findByEmployeeCodeIgnoreCaseAndDeletedAtIsNull("TN004"))
                .thenReturn(Optional.of(cashierUser));
        when(roleRepository.findByCode("MANAGER")).thenReturn(Optional.of(roleManager));
        when(userRepository.findEmployeeCodesByPrefix("QL")).thenReturn(List.of("QL001"));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponseDto result = userService.updateUser("TN004", promoteReq);

        assertThat(result).isNotNull();
        assertThat(result.getEmployeeCode()).isEqualTo("QL002");
        assertThat(result.getRoleCode()).isEqualTo("MANAGER");
        assertThat(result.getDiscountCeiling()).isEqualTo(20);
        assertThat(result.getFullName()).isEqualTo("Mai Van Luong");
    }
}
