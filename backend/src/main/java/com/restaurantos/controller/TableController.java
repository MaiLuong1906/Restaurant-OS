package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.OrderDtos;
import com.restaurantos.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    /**
     * GET /api/v1/tables — Lấy danh sách tất cả bàn.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('TABLE:FLOOR_PLAN:VIEW')")
    public ResponseEntity<ApiResponse<List<OrderDtos.TableResponse>>> getAllTables() {
        List<OrderDtos.TableResponse> tables = tableService.getAllTables();
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

        return tableService.getTableById(tableId)
                .map(t -> ResponseEntity.ok(ApiResponse.success(t)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy bàn: " + id, null)));
    }

    /**
     * PATCH /api/v1/tables/{id}/status — Cập nhật trạng thái bàn (có kiểm tra nghiệp vụ & chống race condition).
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('TABLE:STATE:UPDATE')")
    public ResponseEntity<ApiResponse<OrderDtos.TableResponse>> updateTableStatus(
            @PathVariable String id,
            @Valid @RequestBody OrderDtos.UpdateTableStatusRequest request) {
        UUID tableId;
        try {
            tableId = UUID.fromString(id);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("BAD_REQUEST", "Table ID không hợp lệ: " + id, null));
        }
        OrderDtos.TableResponse updated = tableService.updateTableStatus(tableId, request.status());
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật trạng thái bàn thành công"));
    }
}
