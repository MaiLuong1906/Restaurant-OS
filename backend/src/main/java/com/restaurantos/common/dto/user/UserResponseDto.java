package com.restaurantos.common.dto.user;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class UserResponseDto {

    public UserResponseDto() {
    }

    private UUID id;
    private String employeeCode;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String roleCode;
    private String roleName;
    private boolean hasPin;
    private String pinMasked;
    private Integer discountCeiling;
    private String ipBinding;
    private Boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private Instant createdAt;

    public static UserResponseDto fromEntity(UserEntity entity) {
        String roleCode = entity.getRole() != null ? entity.getRole().getCode() : "STAFF";
        String roleName = entity.getRole() != null ? entity.getRole().getName() : "Nhân viên";

        // Sử dụng UserRole Enum để lấy trần chiết khấu mặc định
        UserRole userRole = UserRole.fromCode(roleCode).orElse(UserRole.STAFF);
        int ceiling = userRole.getDefaultDiscountCeiling();

        boolean hasPin = entity.getPinCodeHash() != null && !entity.getPinCodeHash().isBlank();
        String pinMasked = hasPin ? "•••• (Đã kích hoạt)" : "Chưa cài đặt";

        return UserResponseDto.builder()
                .id(entity.getId())
                .employeeCode(entity.getEmployeeCode())
                .username(entity.getUsername())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .roleCode(roleCode)
                .roleName(roleName)
                .hasPin(hasPin)
                .pinMasked(pinMasked)
                .discountCeiling(ceiling)
                .ipBinding("LAN POS / Bàn Nội Bộ")
                .isActive(entity.getIsActive() != null ? entity.getIsActive() : true)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
