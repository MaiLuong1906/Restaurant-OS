package com.restaurantos.controller;

import com.restaurantos.common.dto.ApiResponse;
import com.restaurantos.dto.KdsItemDto;
import com.restaurantos.dto.KdsTicketDto;
import com.restaurantos.dto.OrderChangeAlertDto;
import com.restaurantos.dto.CompleteBatchRequest;
import com.restaurantos.dto.CompleteTicketRequest;
import com.restaurantos.dto.UpdateItemStatusRequest;
import com.restaurantos.service.KdsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Controller màn hình điều phối bếp KDS.
 * Lưu ý bảo mật: Phân quyền cho /api/v1/kds/** (KDS:QUEUE:VIEW cho GET và KDS:COOKING_STATUS:UPDATE cho PATCH)
 * được cấu hình tập trung tại SecurityConfig cho các profile non-local (test/prod),
 * nhằm giữ tương thích với KdsLocalSecurityConfig (permitAll ở profile local theo spec CHỐT A).
 */
@RestController
@RequestMapping("/api/v1/kds")
@RequiredArgsConstructor
@Tag(name = "KDS Bếp chính", description = "Các API màn hình điều phối bếp KDS (K1–K6)")
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

    @PatchMapping("/tickets/{ticketId}/complete")
    @Operation(summary = "K3: Hoàn tất ticket", description = "Chuyển toàn bộ các món WAITING trong ticket sang READY. Idempotent khi gọi lại.")
    public ResponseEntity<ApiResponse<KdsTicketDto>> completeTicket(
            @Parameter(description = "Mã định danh đơn hàng (orders.id)")
            @PathVariable UUID ticketId,
            @RequestBody(required = false) CompleteTicketRequest request
    ) {
        return kdsService.completeTicket(ticketId, request)
                .map(ticket -> ResponseEntity.ok(ApiResponse.success(ticket, "Hoàn tất ticket thành công")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy ticket với ID: " + ticketId, null)));
    }

    @PatchMapping("/items/{itemId}/status")
    @Operation(summary = "K4: Cập nhật trạng thái từng món", description = "Chuyển trạng thái món sang READY hoặc REJECTED. Yêu cầu reason 5-200 ký tự khi REJECTED.")
    public ResponseEntity<ApiResponse<KdsItemDto>> updateItemStatus(
            @Parameter(description = "Mã định danh món (order_items.id)")
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateItemStatusRequest request
    ) {
        return kdsService.updateItemStatus(itemId, request)
                .map(item -> ResponseEntity.ok(ApiResponse.success(item, "Cập nhật trạng thái món thành công")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy món với ID: " + itemId, null)));
    }

    @PostMapping("/batches/complete")
    @Operation(summary = "K5: Hoàn tất mẻ nấu", description = "Chuyển danh sách các món WAITING trong mẻ sang READY trong 1 transaction. Idempotent khi món đã READY.")
    public ResponseEntity<ApiResponse<List<KdsTicketDto>>> completeBatch(
            @Valid @RequestBody CompleteBatchRequest request
    ) {
        return kdsService.completeBatch(request)
                .map(tickets -> ResponseEntity.ok(ApiResponse.success(tickets, "Hoàn tất mẻ nấu thành công")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy một hoặc nhiều món trong mẻ nấu", null)));
    }

    @GetMapping("/order-changes")
    @Operation(summary = "A6: Lấy danh sách cảnh báo hủy/sửa đơn chờ bếp xác nhận", description = "Đọc từ nhật ký hủy món (order_item_voids), lọc bỏ các cảnh báo đã xác nhận")
    public ResponseEntity<ApiResponse<List<OrderChangeAlertDto>>> getPendingOrderChanges() {
        List<OrderChangeAlertDto> alerts = kdsService.getPendingOrderChanges();
        return ResponseEntity.ok(ApiResponse.success(alerts, "Lấy danh sách cảnh báo thay đổi đơn thành công"));
    }

    @PostMapping("/order-changes/{alertId}/acknowledge")
    @Operation(summary = "A6: Bếp xác nhận đã nhận cảnh báo hủy/sửa đơn", description = "Đánh dấu cảnh báo đã xác nhận để không còn hiện trong danh sách chờ")
    public ResponseEntity<ApiResponse<OrderChangeAlertDto>> acknowledgeOrderChange(
            @Parameter(description = "Mã định danh cảnh báo (order_item_voids.id)")
            @PathVariable UUID alertId
    ) {
        return kdsService.acknowledgeOrderChange(alertId)
                .map(alert -> ResponseEntity.ok(ApiResponse.success(alert, "Xác nhận cảnh báo thay đổi đơn thành công")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy cảnh báo với ID: " + alertId, null)));
    }

    @PostMapping("/order-changes/{alertId}/defer")
    @Operation(summary = "A6: Bếp hoãn xử lý cảnh báo hủy/sửa đơn", description = "Giữ nguyên cảnh báo trong danh sách chờ để bếp xử lý sau")
    public ResponseEntity<ApiResponse<OrderChangeAlertDto>> deferOrderChange(
            @Parameter(description = "Mã định danh cảnh báo (order_item_voids.id)")
            @PathVariable UUID alertId
    ) {
        return kdsService.deferOrderChange(alertId)
                .map(alert -> ResponseEntity.ok(ApiResponse.success(alert, "Đã hoãn xử lý cảnh báo thay đổi đơn")))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiResponse.error("NOT_FOUND", "Không tìm thấy cảnh báo với ID: " + alertId, null)));
    }
}
