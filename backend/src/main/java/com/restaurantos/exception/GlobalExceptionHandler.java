package com.restaurantos.exception;

import com.restaurantos.common.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record FieldValidationError(String field, String reason) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldValidationError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> new FieldValidationError(err.getField(), err.getDefaultMessage()))
                .toList();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALIDATION_ERROR", "Dữ liệu đầu vào không hợp lệ", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        List<FieldValidationError> errors = ex.getConstraintViolations().stream()
                .map(v -> new FieldValidationError(v.getPropertyPath().toString(), v.getMessage()))
                .toList();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("VALIDATION_ERROR", "Tham số truy vấn không hợp lệ", errors));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(MissingServletRequestParameterException ex) {
        FieldValidationError detail = new FieldValidationError(ex.getParameterName(), "Tham số bắt buộc bị thiếu");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("MISSING_PARAMETER", "Thiếu tham số bắt buộc: " + ex.getParameterName(), List.of(detail)));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        FieldValidationError detail = new FieldValidationError(ex.getName(), "Giá trị không đúng định dạng yêu cầu");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("INVALID_PARAMETER", "Tham số '" + ex.getName() + "' không hợp lệ", List.of(detail)));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("Invalid JSON payload: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("INVALID_REQUEST_BODY", "Nội dung JSON gửi lên không hợp lệ hoặc sai định dạng kiểu dữ liệu", null));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getErrorCode(), ex.getMessage(), null));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Database integrity violation: {}", ex.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("DATA_CONFLICT", "Dữ liệu bị xung đột hoặc vi phạm ràng buộc hệ thống", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unhandled system exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_SERVER_ERROR", "Đã xảy ra sự cố hệ thống, vui lòng thử lại sau.", null));
    }
}
