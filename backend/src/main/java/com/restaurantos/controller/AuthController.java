package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.auth.*;
import com.restaurantos.entity.UserEntity;
import com.restaurantos.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Step-Up PIN", description = "Đăng nhập nhân sự (JWT), đăng nhập trạm KDS (PIN) và xác thực PIN Quản lý duyệt ngoại lệ")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập nhân sự (UC_STF_01)", description = "Xác thực bằng SĐT/Username/Mã NV và mật khẩu, trả về JWT kèm danh sách Permission")
    public ResponseEntity<ApiResponse<LoginResponse>> loginStaff(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.loginStaff(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    @PostMapping("/kds-pin")
    @Operation(summary = "Đăng nhập trạm KDS bằng mã PIN (UC_CHEF_01)", description = "Xác thực mã PIN 4-6 số cho trạm bếp và trả về KDS Tablet Token giới hạn quyền")
    public ResponseEntity<ApiResponse<KdsSessionResponse>> loginKdsPin(
            @Valid @RequestBody KdsPinLoginRequest request
    ) {
        KdsSessionResponse response = authService.loginKdsPin(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Mở khóa trạm KDS thành công"));
    }

    @PostMapping("/verify-manager-pin")
    @Operation(summary = "Xác thực mã PIN Quản lý/Chủ quán duyệt ngoại lệ", description = "Kiểm tra mã PIN và hạn mức chiết khấu, trả về approvalToken ngắn hạn (60s)")
    public ResponseEntity<ApiResponse<VerifyManagerPinResponse>> verifyManagerPin(
            @Valid @RequestBody VerifyManagerPinRequest request
    ) {
        VerifyManagerPinResponse response = authService.verifyManagerPin(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Xác thực mã PIN Quản lý thành công"));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin phiên đăng nhập hiện tại", description = "Trả về thông tin tài khoản và danh sách Permission thực tế của phiên JWT hiện hành")
    public ResponseEntity<ApiResponse<LoginResponse>> getCurrentUser(
            @AuthenticationPrincipal UserEntity currentUser,
            Authentication authentication
    ) {
        LoginResponse response = authService.getCurrentSessionInfo(currentUser, authentication);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin phiên đăng nhập thành công"));
    }
}
