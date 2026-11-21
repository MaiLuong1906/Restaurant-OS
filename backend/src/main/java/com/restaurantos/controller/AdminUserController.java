package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.common.dto.PageResponse;
import com.restaurantos.common.dto.user.CreateUserRequest;
import com.restaurantos.common.dto.user.UpdatePinRequest;
import com.restaurantos.common.dto.user.UpdateUserRequest;
import com.restaurantos.common.dto.user.UserResponseDto;
import com.restaurantos.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Admin User Management", description = "Quản trị danh sách nhân sự, phân quyền RBAC & mã PIN trạm")
@PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tài khoản nhân sự có phân trang", description = "Trả về danh sách nhân viên có phân trang, hỗ trợ lọc theo roleCode, trạng thái isActive và tìm kiếm theo tên, username, mã nhân viên")
    public ResponseEntity<ApiResponse<PageResponse<UserResponseDto>>> getAllUsers(
            @Parameter(description = "Lọc theo mã vai trò (OWNER, MANAGER, CASHIER, CHEF, WAITER, STAFF) hoặc ALL") @RequestParam(required = false) String role,
            @Parameter(description = "Từ khóa tìm kiếm theo họ tên, username hoặc mã nhân viên (e.g. TN001)") @RequestParam(required = false) String search,
            @Parameter(description = "Lọc theo trạng thái hoạt động: true (đang hoạt động), false (đang bị tạm khóa)") @RequestParam(required = false) Boolean isActive,
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số lượng bản ghi mỗi trang (mặc định 10)") @RequestParam(defaultValue = "10") int size) {
        PageResponse<UserResponseDto> users = userService.getUsersPaged(role, search, isActive, page, size);
        return ResponseEntity.ok(ApiResponse.success(users, "Lấy danh sách nhân sự thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một nhân viên", description = "Xem chi tiết tài khoản nhân sự theo UUID, Mã nhân viên (e.g. TN001) hoặc Username")
    public ResponseEntity<ApiResponse<UserResponseDto>> getUserById(
            @Parameter(description = "Mã UUID, Mã nhân viên (e.g. TN001) hoặc Username") @PathVariable String id) {
        UserResponseDto user = userService.getUserByIdentifier(id);
        return ResponseEntity.ok(ApiResponse.success(user, "Lấy thông tin nhân sự thành công"));
    }

    @PostMapping
    @Operation(summary = "Cấp tài khoản nhân sự mới", description = "Tạo mới tài khoản, tự động sinh mã nhân sự theo vai trò (TN001, PV001...), mã hóa mật khẩu và mã PIN trạm nếu có")
    public ResponseEntity<ApiResponse<UserResponseDto>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserResponseDto created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Cấp tài khoản nhân sự mới thành công"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin nhân viên", description = "Chỉnh sửa họ tên, email, số điện thoại hoặc đổi vai trò theo UUID hoặc Mã nhân viên")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUser(
            @Parameter(description = "Mã UUID, Mã nhân viên hoặc Username") @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponseDto updated = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật thông tin nhân sự thành công"));
    }

    @PutMapping("/{id}/pin")
    @Operation(summary = "Đổi mã PIN trạm", description = "Cập nhật mã PIN 4-6 số cho nhân sự xác thực trạm POS/KDS theo UUID hoặc Mã nhân viên")
    public ResponseEntity<ApiResponse<UserResponseDto>> updatePin(
            @Parameter(description = "Mã UUID, Mã nhân viên hoặc Username") @PathVariable String id,
            @Valid @RequestBody UpdatePinRequest request) {
        UserResponseDto updated = userService.updatePin(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Đổi mã PIN trạm thành công"));
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Khóa hoặc mở khóa tài khoản", description = "Chuyển đổi trạng thái isActive giữa true và false theo UUID hoặc Mã nhân viên")
    public ResponseEntity<ApiResponse<UserResponseDto>> toggleStatus(
            @Parameter(description = "Mã UUID, Mã nhân viên hoặc Username") @PathVariable String id) {
        UserResponseDto updated = userService.toggleActiveStatus(id);
        String message = Boolean.TRUE.equals(updated.getIsActive())
                ? "Đã mở khóa tài khoản nhân sự thành công"
                : "Đã tạm khóa tài khoản nhân sự thành công";
        return ResponseEntity.ok(ApiResponse.success(updated, message));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Xóa mềm tài khoản nhân sự", description = "Đánh dấu thời điểm deleted_at và vô hiệu hóa tài khoản theo UUID hoặc Mã nhân viên")
    public ResponseEntity<ApiResponse<UserResponseDto>> deleteUser(
            @Parameter(description = "Mã UUID, Mã nhân viên hoặc Username") @PathVariable String id) {
        UserResponseDto deleted = userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(deleted, "Xóa tài khoản nhân sự thành công"));
    }
}
