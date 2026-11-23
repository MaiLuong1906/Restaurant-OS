package com.restaurantos.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public BusinessException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public static BusinessException conflict(String errorCode, String message) {
        return new BusinessException(HttpStatus.CONFLICT, errorCode, message);
    }

    public static BusinessException unprocessable(String errorCode, String message) {
        return new BusinessException(HttpStatus.UNPROCESSABLE_ENTITY, errorCode, message);
    }

    public static BusinessException badRequest(String errorCode, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, errorCode, message);
    }
}
