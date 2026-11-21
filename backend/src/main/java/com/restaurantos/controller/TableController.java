package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.OrderDtos;
import com.restaurantos.entity.RestaurantTableEntity;
import com.restaurantos.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableRepository tableRepository;

    /**
     * GET /api/v1/tables — Lấy danh sách tất cả bàn.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDtos.TableResponse>>> getAllTables() {
        List<OrderDtos.TableResponse> tables = tableRepository.findAll().stream()
                .map(this::toTableResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(tables));
    }

    /**
     * GET /api/v1/tables/{id} — Lấy chi tiết 1 bàn.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDtos.TableResponse>> getTable(
            @PathVariable String id) {
        UUID tableId;
        try {
            tableId = UUID.fromString(id);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Table ID không hợp lệ: " + id, null));
        }
        return tableRepository.findById(tableId)
                .map(t -> ResponseEntity.ok(ApiResponse.success(toTableResponse(t))))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private OrderDtos.TableResponse toTableResponse(RestaurantTableEntity t) {
        return new OrderDtos.TableResponse(
                t.getId(),
                t.getTableNumber(),
                t.getCapacity(),
                t.getStatus(),
                t.getCurrentOrderId()
        );
    }
}
