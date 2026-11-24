package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.OrderDtos;
import com.restaurantos.security.CustomerTableAuthService;
import com.restaurantos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final CustomerTableAuthService customerTableAuthService;

    /**
     * POST /api/v1/orders — Waiter (JWT) hoặc Customer (X-Table-Token) tạo đơn hàng mới.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDtos.OrderResponse>> createOrder(
            @RequestBody OrderDtos.CreateOrderRequest request,
            @RequestHeader(value = "X-Table-Token", required = false) String tableToken,
            Authentication authentication) {
        customerTableAuthService.verifyCanCreateOrder(request.tableId(), tableToken, authentication);
        OrderDtos.OrderResponse order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(order));
    }

    /**
     * GET /api/v1/orders/active — Lấy danh sách các đơn hàng đang hoạt động (chỉ nhân sự nội bộ).
     */
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('ORDER:ACTIVE:VIEW')")
    public ResponseEntity<ApiResponse<java.util.List<OrderDtos.OrderResponse>>> getActiveOrders() {
        java.util.List<OrderDtos.OrderResponse> orders = orderService.getActiveOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * GET /api/v1/orders/{id} — Lấy chi tiết order (Nhân sự nội bộ hoặc Customer đúng bàn).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDtos.OrderResponse>> getOrder(
            @PathVariable String id,
            @RequestHeader(value = "X-Table-Token", required = false) String tableToken,
            Authentication authentication) {
        UUID orderId;
        try {
            orderId = UUID.fromString(id);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Order ID không hợp lệ: " + id, null));
        }
        OrderDtos.OrderResponse order = orderService.getOrder(orderId);
        customerTableAuthService.verifyCanViewOrder(order.tableId(), tableToken, authentication);
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}
