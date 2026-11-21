package com.restaurantos.common.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CreateUserRequest {

    public CreateUserRequest() {
    }

    @NotBlank(message = "Họ và tên nhân viên không được để trống")
    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    @Size(min = 3, max = 100, message = "Tên đăng nhập từ 3 đến 100 ký tự")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$|^$", message = "Tên đăng nhập chỉ gồm chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu tối thiểu 6 ký tự")
    private String password;

    @Email(message = "Định dạng email không hợp lệ (ví dụ: nhanvien@restaurant.vn)")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$|^0[0-9]{9}$", message = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)")
    private String phone;

    @NotBlank(message = "Mã vai trò không được để trống")
    private String roleCode;

    @Pattern(regexp = "^[0-9]{4,6}$|^$", message = "Mã PIN phải gồm 4 đến 6 chữ số")
    private String pinCode;
}
