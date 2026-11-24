package com.restaurantos.service.impl;

import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.user.CreateUserRequest;
import com.restaurantos.common.dto.user.UpdatePinRequest;
import com.restaurantos.common.dto.user.UpdateUserRequest;
import com.restaurantos.common.dto.user.UserResponseDto;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.RoleEntity;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.repository.RoleRepository;
import com.restaurantos.repository.UserRepository;
import com.restaurantos.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsers(String roleCode, String search, Boolean isActive) {
        List<UserEntity> users = userRepository.searchUsers(roleCode, search, isActive);
        return users.stream().map(UserResponseDto::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponseDto> getUsersPaged(String roleCode, String search, Boolean isActive, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by("createdAt").descending());
        Page<UserEntity> userPage = userRepository.searchUsersPaged(roleCode, search, isActive, pageable);
        return PageResponse.from(userPage, UserResponseDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDto getUserByIdentifier(String identifier) {
        UserEntity user = findUserOrThrow(identifier);
        return UserResponseDto.fromEntity(user);
    }

    @Override
    @Transactional
    public UserResponseDto createUser(CreateUserRequest request) {
        // 1. Kiểm tra số điện thoại bắt buộc và duy nhất (đáp ứng hợp đồng đăng nhập B1 trên Mobile)
        String phone = request.getPhone() != null ? request.getPhone().trim() : null;
        if (phone == null || phone.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Số điện thoại '" + phone + "' đã được đăng ký trên hệ thống");
        }

        // 2. Xử lý username linh hoạt: Nếu admin không nhập, tự động lấy SĐT làm username mặc định
        String finalUsername;
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            finalUsername = request.getUsername().trim();
            if (userRepository.existsByUsername(finalUsername)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Tên đăng nhập '" + finalUsername + "' đã tồn tại");
            }
        } else {
            finalUsername = phone;
            if (userRepository.existsByUsername(finalUsername)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Tên đăng nhập tự động theo SĐT '" + finalUsername + "' đã tồn tại");
            }
        }

        // 3. Kiểm tra email trùng lặp nếu có
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Email '" + request.getEmail() + "' đã được sử dụng");
            }
        }

        // 4. Kiểm tra mã vai trò hợp lệ qua Enum (Bao gồm cả STAFF từ V3)
        UserRole userRole = UserRole.fromCode(request.getRoleCode())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Vai trò '" + request.getRoleCode() + "' không hợp lệ. Cho phép: "
                                + Arrays.toString(UserRole.values())));

        // 4b. Chống leo thang đặc quyền: chỉ OWNER mới được tạo tài khoản OWNER
        enforceCanAssignOrManageRole(userRole.name());

        // 5. Tìm role trong DB
        RoleEntity role = roleRepository.findByCode(userRole.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Không tìm thấy vai trò trong DB: " + userRole.name()));

        // 6. Tự động sinh mã nhân sự theo tiền tố vai trò (TN001, PV001, QL001, NV001...)
        String generatedEmployeeCode = generateEmployeeCode(userRole);

        // 7. Hash password và PIN
        String passwordHash = passwordEncoder.encode(request.getPassword());
        String pinCodeHash = null;
        if (request.getPinCode() != null && !request.getPinCode().isBlank()) {
            pinCodeHash = passwordEncoder.encode(request.getPinCode());
        }

        UserEntity newUser = UserEntity.builder()
                .employeeCode(generatedEmployeeCode)
                .username(finalUsername)
                .passwordHash(passwordHash)
                .pinCodeHash(pinCodeHash)
                .fullName(request.getFullName())
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .phone(phone)
                .role(role)
                .isActive(true)
                .build();

        UserEntity saved = userRepository.save(newUser);
        log.info("Tạo tài khoản nhân sự thành công: employeeCode={}, username={}, phone={}, role={}",
                saved.getEmployeeCode(), saved.getUsername(), saved.getPhone(), role.getCode());
        return UserResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponseDto updateUser(String identifier, UpdateUserRequest request) {
        UserEntity user = findUserOrThrow(identifier);
        enforceCanAssignOrManageRole(user.getRole() != null ? user.getRole().getCode() : null);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            String newPhone = request.getPhone().trim();
            if (!newPhone.equals(user.getPhone())) {
                if (userRepository.existsByPhone(newPhone)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Số điện thoại '" + newPhone + "' đã được sử dụng bởi nhân sự khác");
                }
                user.setPhone(newPhone);
            }
        }
        if (request.getEmail() != null) {
            String email = request.getEmail().isBlank() ? null : request.getEmail().trim();
            if (email != null && !email.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(email)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Email '" + email + "' đã được sử dụng bởi nhân sự khác");
                }
            }
            user.setEmail(email);
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        if (request.getRoleCode() != null && !request.getRoleCode().isBlank()) {
            UserRole userRole = UserRole.fromCode(request.getRoleCode())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Vai trò '" + request.getRoleCode() + "' không hợp lệ. Cho phép: "
                                    + Arrays.toString(UserRole.values())));
            enforceCanAssignOrManageRole(userRole.name());
            RoleEntity role = roleRepository.findByCode(userRole.name())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Không tìm thấy vai trò: " + userRole.name()));

            // Nếu đổi sang vai trò có tiền tố khác (ví dụ TN -> QL) -> tự động cấp lại mã nhân sự mới!
            String newPrefix = userRole.getEmployeePrefix();
            if (user.getEmployeeCode() == null || !user.getEmployeeCode().startsWith(newPrefix)) {
                String oldCode = user.getEmployeeCode();
                String newCode = generateEmployeeCode(userRole);
                user.setEmployeeCode(newCode);
                log.info("Thăng chức/Đổi vai trò nhân sự: id={}, username={}, đổi mã từ {} -> {}",
                        user.getId(), user.getUsername(), oldCode, newCode);
            }

            user.setRole(role);
        }

        UserEntity updated = userRepository.save(user);
        return UserResponseDto.fromEntity(updated);
    }

    @Override
    @Transactional
    public UserResponseDto updatePin(String identifier, UpdatePinRequest request) {
        UserEntity user = findUserOrThrow(identifier);
        enforceCanAssignOrManageRole(user.getRole() != null ? user.getRole().getCode() : null);
        user.setPinCodeHash(passwordEncoder.encode(request.getPinCode()));
        UserEntity saved = userRepository.save(user);
        log.info("Đã cập nhật mã PIN trạm cho nhân sự: employeeCode={}, username={}",
                saved.getEmployeeCode(), saved.getUsername());
        return UserResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponseDto toggleActiveStatus(String identifier) {
        UserEntity user = findUserOrThrow(identifier);
        enforceCanAssignOrManageRole(user.getRole() != null ? user.getRole().getCode() : null);
        enforceNotSelfTarget(user, "Không thể tự khóa tài khoản đang đăng nhập của chính bạn");
        boolean newStatus = !Boolean.TRUE.equals(user.getIsActive());
        user.setIsActive(newStatus);
        UserEntity saved = userRepository.save(user);
        log.info("Đổi trạng thái tài khoản: employeeCode={}, username={}, newStatus={}",
                saved.getEmployeeCode(), saved.getUsername(), saved.getIsActive());
        return UserResponseDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponseDto deleteUser(String identifier) {
        UserEntity user = findUserOrThrow(identifier);
        enforceNotSelfTarget(user, "Không thể tự xóa tài khoản đang đăng nhập của chính bạn");
        // Soft delete: lưu thời điểm xóa, vô hiệu hóa tài khoản
        user.setDeletedAt(Instant.now());
        user.setIsActive(false);
        UserEntity saved = userRepository.save(user);
        log.info("Đã khóa/xóa mềm tài khoản nhân sự: employeeCode={}, username={}",
                saved.getEmployeeCode(), saved.getUsername());
        return UserResponseDto.fromEntity(saved);
    }

    /**
     * Chống leo thang đặc quyền (Privilege Escalation):
     * Nếu người thực hiện không phải OWNER (ví dụ MANAGER), cấm tạo/sửa/đổi PIN/khóa tài khoản OWNER.
     */
    private void enforceCanAssignOrManageRole(String targetRoleCode) {
        if (!"OWNER".equalsIgnoreCase(targetRoleCode)) {
            return;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return;
        }
        boolean actorIsOwner = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_OWNER".equals(a.getAuthority()));
        if (!actorIsOwner) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ Chủ nhà hàng (OWNER) mới có quyền tạo hoặc chỉnh sửa tài khoản OWNER");
        }
    }

    /**
     * Chặn người dùng tự khóa hoặc tự xóa chính tài khoản đang đăng nhập của mình.
     */
    private void enforceNotSelfTarget(UserEntity targetUser, String errorMessage) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserEntity currentUser
                && currentUser.getId() != null && currentUser.getId().equals(targetUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
    }

    private String generateEmployeeCode(UserRole userRole) {
        String prefix = userRole.getEmployeePrefix();
        List<String> existingCodes = userRepository.findEmployeeCodesByPrefix(prefix);
        int maxSeq = existingCodes.stream()
                .filter(code -> code != null && code.startsWith(prefix))
                .map(code -> {
                    try {
                        return Integer.parseInt(code.substring(prefix.length()));
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                })
                .max(Integer::compareTo)
                .orElse(0);
        return String.format("%s%03d", prefix, maxSeq + 1);
    }

    private UserEntity findUserOrThrow(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Định danh nhân sự không được để trống");
        }
        String trimmed = identifier.trim();

        // 1. Kiểm tra nếu là định dạng UUID hợp lệ
        try {
            UUID id = UUID.fromString(trimmed);
            return userRepository.findById(id)
                    .filter(u -> u.getDeletedAt() == null)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản nhân sự với ID: " + id));
        } catch (IllegalArgumentException e) {
            // 2. Không phải UUID -> Tìm kiếm linh hoạt theo Mã nhân viên (employeeCode), Username hoặc Số điện thoại (B1)
            return userRepository.findByEmployeeCodeIgnoreCaseAndDeletedAtIsNull(trimmed)
                    .or(() -> userRepository.findByUsernameAndDeletedAtIsNull(trimmed))
                    .or(() -> userRepository.findByPhoneAndDeletedAtIsNull(trimmed))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản nhân sự với mã, username hoặc SĐT: " + trimmed));
        }
    }
}
