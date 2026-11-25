package com.restaurantos.service;

import com.restaurantos.common.dto.user.CreateUserRequest;
import com.restaurantos.common.dto.user.UpdateUserRequest;
import com.restaurantos.entity.RoleEntity;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.RoleRepository;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.service.impl.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RbacPrivilegeEscalationTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, roleRepository, new BCryptPasswordEncoder());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Chống Privilege Escalation: MANAGER không được tạo tài khoản OWNER (403 Forbidden)")
    void managerCannotCreateOwnerAccount() {
        UserEntity managerActor = UserEntity.builder()
                .id(UUID.randomUUID())
                .username("manager")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        managerActor, null, List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        CreateUserRequest req = new CreateUserRequest();
        req.setFullName("Fake Owner");
        req.setPhone("0912345678");
        req.setPassword("secret123");
        req.setRoleCode("OWNER");

        when(userRepository.existsByPhone("0912345678")).thenReturn(false);
        when(userRepository.existsByUsername("0912345678")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Chống Privilege Escalation: MANAGER không được khóa tài khoản OWNER (403 Forbidden)")
    void managerCannotLockOwnerAccount() {
        UserEntity managerActor = UserEntity.builder()
                .id(UUID.randomUUID())
                .username("manager")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        managerActor, null, List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        UUID ownerId = UUID.randomUUID();
        UserEntity ownerTarget = UserEntity.builder()
                .id(ownerId)
                .username("owner")
                .role(RoleEntity.builder().code("OWNER").name("Chủ nhà hàng").build())
                .isActive(true)
                .build();

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerTarget));

        assertThatThrownBy(() -> userService.toggleActiveStatus(ownerId.toString()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Chống tự xóa: OWNER không được tự xóa tài khoản đang đăng nhập của chính mình (400 Bad Request)")
    void ownerCannotDeleteSelf() {
        UUID ownerId = UUID.randomUUID();
        UserEntity ownerActor = UserEntity.builder()
                .id(ownerId)
                .username("owner")
                .role(RoleEntity.builder().code("OWNER").name("Chủ nhà hàng").build())
                .isActive(true)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        ownerActor, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
                )
        );

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerActor));

        assertThatThrownBy(() -> userService.deleteUser(ownerId.toString()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Chống Horizontal Privilege Escalation: MANAGER không được tạo hoặc khóa tài khoản MANAGER khác (403)")
    void managerCannotCreateOrLockAnotherManager() {
        UserEntity managerActor = UserEntity.builder()
                .id(UUID.randomUUID())
                .username("manager1")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        managerActor, null, List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        CreateUserRequest createMgrReq = new CreateUserRequest();
        createMgrReq.setFullName("Manager 2");
        createMgrReq.setPhone("0919999999");
        createMgrReq.setPassword("secret123");
        createMgrReq.setRoleCode("MANAGER");

        when(userRepository.existsByPhone("0919999999")).thenReturn(false);
        when(userRepository.existsByUsername("0919999999")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(createMgrReq))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        UUID otherManagerId = UUID.randomUUID();
        UserEntity otherManager = UserEntity.builder()
                .id(otherManagerId)
                .username("manager2")
                .role(RoleEntity.builder().code("MANAGER").name("Quản lý ca").build())
                .isActive(true)
                .build();
        when(userRepository.findById(otherManagerId)).thenReturn(Optional.of(otherManager));

        assertThatThrownBy(() -> userService.toggleActiveStatus(otherManagerId.toString()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Chống tự khóa qua updateUser: OWNER không thể tự set isActive = false trên chính mình (400)")
    void ownerCannotSelfLockViaUpdateUser() {
        UUID ownerId = UUID.randomUUID();
        UserEntity ownerActor = UserEntity.builder()
                .id(ownerId)
                .username("owner")
                .role(RoleEntity.builder().code("OWNER").name("Chủ nhà hàng").build())
                .isActive(true)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        ownerActor, null, List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
                )
        );

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerActor));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setIsActive(false);

        assertThatThrownBy(() -> userService.updateUser(ownerId.toString(), req))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
