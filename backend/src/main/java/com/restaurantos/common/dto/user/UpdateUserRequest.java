package com.restaurantos.common.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class UpdateUserRequest {

    public UpdateUserRequest() {
    }

    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Email(message = "Định dạng email không hợp lệ (ví dụ: nhanvien@restaurant.vn)")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String email;

    @Pattern(
        regexp = "^(0|\\+84)[35789][0-9]{8}$|^0[0-9]{9}$|^$",
        message = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)"
    )
    private String phone;

    private String roleCode;

    private Boolean isActive;
}
