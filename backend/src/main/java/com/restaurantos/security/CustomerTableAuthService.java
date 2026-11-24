package com.restaurantos.security;

import com.restaurantos.common.enums.Permission;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Xác thực quyền truy cập cho cả 2 đối tượng dùng chung luồng gọi món:
 * 1. Nhân sự nội bộ (Staff JWT) có Permission tương ứng.
 * 2. Khách hàng tại bàn (Customer) mang header X-Table-Token khớp với restaurant_tables.qr_code_token.
 */
@Service
@RequiredArgsConstructor
public class CustomerTableAuthService {

    private final TableRepository tableRepository;

    public void verifyCanCreateOrder(String rawTableId, String tableToken, Authentication auth) {
        if (hasAuthority(auth, Permission.ORDER_CREATE_APPEND_EXECUTE.getAuthority())) {
            return;
        }

        UUID tableId = parseUuid(rawTableId);
        TableEntity table = verifyTableToken(tableId, tableToken);

        // Chặn khách tự gửi thêm món khi bàn đang khóa thanh toán (BILLING) hoặc đang dọn (CLEANING)
        if ("BILLING".equalsIgnoreCase(table.getStatus()) || "CLEANING".equalsIgnoreCase(table.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bàn hiện đang ở trạng thái " + table.getStatus() + ", không thể gọi thêm món lúc này.");
        }
    }

    public void verifyCanViewOrder(UUID orderTableId, String tableToken, Authentication auth) {
        if (hasAuthority(auth, Permission.ORDER_ACTIVE_VIEW.getAuthority())) {
            return;
        }
        verifyTableToken(orderTableId, tableToken);
    }

    public boolean isValidTableToken(UUID tableId, String tableToken) {
        if (tableId == null || tableToken == null || tableToken.isBlank()) {
            return false;
        }
        return tableRepository.findById(tableId)
                .map(t -> t.getQrCodeToken() != null && t.getQrCodeToken().equals(tableToken.trim()))
                .orElse(false);
    }

    private TableEntity verifyTableToken(UUID tableId, String tableToken) {
        if (tableToken == null || tableToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Yêu cầu đăng nhập nhân sự hoặc mã QR bàn hợp lệ (X-Table-Token)");
        }

        TableEntity table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bàn không tồn tại"));

        if (table.getQrCodeToken() == null || !table.getQrCodeToken().equals(tableToken.trim())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Mã QR bàn (X-Table-Token) không hợp lệ hoặc không khớp với bàn này");
        }
        return table;
    }

    private boolean hasAuthority(Authentication auth, String authority) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    private UUID parseUuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tableId không hợp lệ: " + raw);
        }
    }
}
