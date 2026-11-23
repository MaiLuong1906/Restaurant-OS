package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.OrderDtos;
import com.restaurantos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * POST /api/v1/orders — Waiter tạo đơn hàng mới.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDtos.OrderResponse>> createOrder(
            @RequestBody OrderDtos.CreateOrderRequest request) {
        OrderDtos.OrderResponse order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(order));
    }

    /**
     * GET /api/v1/orders/active — Lấy danh sách các đơn hàng đang hoạt động.
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<java.util.List<OrderDtos.OrderResponse>>> getActiveOrders() {
        java.util.List<OrderDtos.OrderResponse> orders = orderService.getActiveOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * GET /api/v1/orders/{id} — Lấy chi tiết order.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDtos.OrderResponse>> getOrder(
            @PathVariable String id) {
        UUID orderId;
        try {
            orderId = UUID.fromString(id);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Order ID không hợp lệ: " + id, null));
        }
        OrderDtos.OrderResponse order = orderService.getOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}
