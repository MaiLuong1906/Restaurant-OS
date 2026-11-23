package com.restaurantos.exception;

import com.restaurantos.common.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 1. Bắt lỗi kiểm tra tính hợp lệ dữ liệu (@Valid, @Pattern, @Email, @NotBlank...)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        String firstMessage = errors.values().stream().findFirst().orElse("Dữ liệu gửi lên không hợp lệ");
        log.warn("Validation thất bại: {}", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALIDATION_ERROR", firstMessage, errors));
    }

    /**
     * 2. Bắt lỗi nghiệp vụ ném qua ResponseStatusException (400, 404, 409...)
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(ResponseStatusException ex) {
        String reason = ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString();
        String errorCode = "BUSINESS_ERROR";
        if (ex.getStatusCode() == HttpStatus.CONFLICT) {
            errorCode = "CONFLICT";
        } else if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
            errorCode = "NOT_FOUND";
        } else if (ex.getStatusCode() == HttpStatus.BAD_REQUEST) {
            errorCode = "BAD_REQUEST";
        } else if (ex.getStatusCode() == HttpStatus.FORBIDDEN) {
            errorCode = "FORBIDDEN";
        }

        log.warn("Ngoại lệ nghiệp vụ: status={}, reason={}", ex.getStatusCode(), reason);
        return ResponseEntity.status(ex.getStatusCode())
                .body(ApiResponse.error(errorCode, reason, null));
    }

    /**
     * 3. Bắt lỗi vi phạm toàn vẹn dữ liệu Database (trùng Unique key username/email/employee_code)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Vi phạm toàn vẹn dữ liệu DB: {}", ex.getMessage());
        String msg = "Dữ liệu bị trùng lặp hoặc vi phạm ràng buộc hệ thống";
        String detail = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        if (detail != null && detail.contains("category_id")) {
            msg = "Thiếu danh mục hoặc danh mục không tồn tại trong hệ thống (category_id)";
        } else if (ex.getMessage() != null && ex.getMessage().contains("users_username_key")) {
            msg = "Tên đăng nhập đã tồn tại trong hệ thống";
        } else if (ex.getMessage() != null && ex.getMessage().contains("users_email_key")) {
            msg = "Email đã tồn tại trong hệ thống";
        } else if (ex.getMessage() != null && ex.getMessage().contains("employee_code")) {
            msg = "Mã nhân viên đã tồn tại trong hệ thống";
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("CONFLICT", msg, detail));
    }

    /**
     * 3. Bắt lỗi vi phạm ràng buộc ConstraintViolation
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        log.warn("Vi phạm ràng buộc dữ liệu: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("CONSTRAINT_VIOLATION", ex.getMessage(), null));
    }

    /**
     * 4. Bắt lỗi tham số phương thức không hợp lệ (IllegalArgumentException)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Tham số không hợp lệ: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("INVALID_ARGUMENT", ex.getMessage(), null));
    }

    /**
     * 5. Bắt tất cả lỗi hệ thống chưa được định nghĩa (Fallback 500)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Sự cố hệ thống chưa xử lý: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_SERVER_ERROR", "Đã xảy ra sự cố hệ thống, vui lòng thử lại sau.", null));
    }
}
