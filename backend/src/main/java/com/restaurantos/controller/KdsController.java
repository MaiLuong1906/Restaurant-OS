package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.service.KdsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kds")
@RequiredArgsConstructor
@Tag(name = "KDS Bếp chính", description = "Các API màn hình điều phối bếp KDS (K1, K2, K6)")
public class KdsController {

    private final KdsService kdsService;

    @GetMapping("/tickets")
    @Operation(summary = "K1: Lấy danh sách ticket bếp", description = "Trả về danh sách ticket còn món cần xử lý, sắp xếp ưu tiên theo dị ứng, SLA và thời gian nhận")
    public ResponseEntity<ApiResponse<List<KdsTicketDto>>> getTickets() {
        List<KdsTicketDto> tickets = kdsService.getTickets();
        return ResponseEntity.ok(ApiResponse.success(tickets, "Lấy danh sách ticket bếp thành công"));
    }

    @GetMapping("/tickets/{ticketId}")
    @Operation(summary = "K2: Xem chi tiết ticket", description = "Lấy chi tiết một ticket và danh sách món ăn theo UUID đơn hàng")
    public ResponseEntity<ApiResponse<KdsTicketDto>> getTicketById(
            @Parameter(description = "Mã định danh đơn hàng (orders.id)")
            @PathVariable UUID ticketId
    ) {
        return kdsService.getTicketById(ticketId)
                .map(ticket -> ResponseEntity.ok(ApiResponse.success(ticket, "Lấy thông tin ticket thành công")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy ticket với ID: " + ticketId, null)));
    }

    @GetMapping("/items/active")
    @Operation(summary = "K6: Lấy danh sách món active", description = "Trả về danh sách các món đang ở trạng thái WAITING hoặc READY để sync lại khi mất kết nối")
    public ResponseEntity<ApiResponse<List<KdsItemDto>>> getActiveItems() {
        List<KdsItemDto> activeItems = kdsService.getActiveItems();
        return ResponseEntity.ok(ApiResponse.success(activeItems, "Lấy danh sách món active thành công"));
    }
}
