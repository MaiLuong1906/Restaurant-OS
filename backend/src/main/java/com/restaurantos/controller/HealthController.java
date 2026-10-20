package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health Check", description = "Kiểm tra tình trạng hoạt động của hệ thống Backend")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Kiểm tra sức khỏe hệ thống", description = "Trả về trạng thái UP, phiên bản và thời gian phản hồi của backend core")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> status = Map.of(
            "status", "UP",
            "service", "restaurant-os-backend",
            "version", "1.0.0-SNAPSHOT",
            "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.success(status, "Restaurant OS Backend is operational"));
    }
}
