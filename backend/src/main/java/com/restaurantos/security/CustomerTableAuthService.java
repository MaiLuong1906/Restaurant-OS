package com.restaurantos.security;

import com.restaurantos.common.enums.Permission;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.enums.TableStatus;
import com.restaurantos.repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

/**
 * Xác thực quyền truy cập cho cả 2 đối tượng dùng chung luồng gọi món:
 * 1. Nhân sự nội bộ (Staff JWT) có Permission tương ứng.
 * 2. Khách hàng tại bàn (Customer) mang header X-Table-Token khớp với restaurant_tables.qr_code_token.
 */
@Service
@RequiredArgsConstructor
public class CustomerTableAuthService {

    /**
     * Allow-list các trạng thái bàn hợp lệ cho phép Khách hàng quét QR gửi đơn gọi món.
     */
    private static final Set<TableStatus> ORDERABLE_TABLE_STATUSES = EnumSet.of(
            TableStatus.VACANT,
            TableStatus.SERVING,
            TableStatus.RESERVED
    );

    private final TableRepository tableRepository;

    public void verifyCanCreateOrder(String rawTableId, String tableToken, Authentication auth) {
        if (hasAuthority(auth, Permission.ORDER_CREATE_APPEND_EXECUTE.getAuthority())) {
            return;
        }

        UUID tableId = parseUuid(rawTableId);
        TableEntity table = verifyTableToken(tableId, tableToken);

        TableStatus currentStatus = parseTableStatus(table.getStatus());
        if (currentStatus == null || !ORDERABLE_TABLE_STATUSES.contains(currentStatus)) {
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

    public boolean isValidAnyTableToken(String tableToken) {
        if (tableToken == null || tableToken.isBlank()) {
            return false;
        }
        return tableRepository.existsByQrCodeToken(tableToken.trim());
    }

    private TableStatus parseTableStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return null;
        }
        try {
            return TableStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
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
