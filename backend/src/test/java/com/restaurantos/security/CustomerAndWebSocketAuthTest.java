package com.restaurantos.security;

import com.restaurantos.common.enums.UserRole;
import com.restaurantos.entity.TableEntity;
import com.restaurantos.repository.TableRepository;
import com.restaurantos.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerAndWebSocketAuthTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private UserRepository userRepository;

    private CustomerTableAuthService customerTableAuthService;
    private StompAuthChannelInterceptor stompInterceptor;

    @BeforeEach
    void setUp() {
        customerTableAuthService = new CustomerTableAuthService(tableRepository);
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(
                "Test-Secret-Key-For-Restaurant-OS-WebSocket-Tests-At-Least-256b!",
                3600, 7200, 60);
        stompInterceptor = new StompAuthChannelInterceptor(jwtTokenProvider, userRepository, customerTableAuthService);
    }

    @Test
    @DisplayName("Customer tạo đơn với X-Table-Token hợp lệ thành công; bị chặn 403 nếu bàn đang BILLING")
    void customerCreateOrder_validatesTokenAndTableStatus() {
        UUID tableId = UUID.randomUUID();
        TableEntity servingTable = TableEntity.builder()
                .id(tableId)
                .tableNumber("Bàn 01")
                .qrCodeToken("token-table-01")
                .status("SERVING")
                .build();
        when(tableRepository.findById(tableId)).thenReturn(Optional.of(servingTable));

        assertThatCode(() -> customerTableAuthService.verifyCanCreateOrder(tableId.toString(), "token-table-01", null))
                .doesNotThrowAnyException();

        // Sai token -> 403
        assertThatThrownBy(() -> customerTableAuthService.verifyCanCreateOrder(tableId.toString(), "wrong-token", null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        // Bàn đang khóa thanh toán (BILLING) -> 403
        servingTable.setStatus("BILLING");
        assertThatThrownBy(() -> customerTableAuthService.verifyCanCreateOrder(tableId.toString(), "token-table-01", null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("STOMP SUBSCRIBE: Chặn Anonymous vào /topic/kds và /topic/manager; cho phép CHEF vào /topic/kds")
    void stompSubscribe_enforcesTopicAuthorization() {
        // 1. Anonymous subscribe /topic/kds/main -> AccessDeniedException
        StompHeaderAccessor anonAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        anonAccessor.setDestination("/topic/kds/main");
        Message<byte[]> anonMsg = MessageBuilder.createMessage(new byte[0], anonAccessor.getMessageHeaders());

        assertThatThrownBy(() -> stompInterceptor.preSend(anonMsg, null))
                .isInstanceOf(AccessDeniedException.class);

        // 2. CHEF subscribe /topic/kds/main -> OK
        var chefAuth = new UsernamePasswordAuthenticationToken(
                "chef", null,
                UserRole.CHEF.getAllAuthorities().stream().map(SimpleGrantedAuthority::new).toList()
        );
        StompHeaderAccessor chefAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        chefAccessor.setDestination("/topic/kds/main");
        chefAccessor.setUser(chefAuth);
        Message<byte[]> chefMsg = MessageBuilder.createMessage(new byte[0], chefAccessor.getMessageHeaders());

        assertThatCode(() -> stompInterceptor.preSend(chefMsg, null))
                .doesNotThrowAnyException();

        // 3. CHEF subscribe /topic/manager/alerts -> AccessDeniedException
        StompHeaderAccessor chefMgrAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        chefMgrAccessor.setDestination("/topic/manager/alerts");
        chefMgrAccessor.setUser(chefAuth);
        Message<byte[]> chefMgrMsg = MessageBuilder.createMessage(new byte[0], chefMgrAccessor.getMessageHeaders());

        assertThatThrownBy(() -> stompInterceptor.preSend(chefMgrMsg, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("STOMP SEND & /topic/tables/**: Chặn SEND giả mạo vào /topic/kds và chặn STAFF thường vào /topic/tables/{id}/cart")
    void stompSendAndPluralTablesTopic_enforcesAuthorization() {
        // 1. Chặn Anonymous/Client gửi STOMP SEND trực tiếp vào /topic/kds/main
        StompHeaderAccessor sendKdsAccessor = StompHeaderAccessor.create(StompCommand.SEND);
        sendKdsAccessor.setDestination("/topic/kds/main");
        Message<byte[]> sendKdsMsg = MessageBuilder.createMessage(new byte[0], sendKdsAccessor.getMessageHeaders());

        assertThatThrownBy(() -> stompInterceptor.preSend(sendKdsMsg, null))
                .isInstanceOf(AccessDeniedException.class);

        // 2. Chặn STAFF thường subscribe /topic/tables/{id}/cart (số nhiều)
        UUID tableId = UUID.randomUUID();
        var staffAuth = new UsernamePasswordAuthenticationToken(
                "staff", null,
                UserRole.STAFF.getAllAuthorities().stream().map(SimpleGrantedAuthority::new).toList()
        );
        StompHeaderAccessor staffTableAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        staffTableAccessor.setDestination("/topic/tables/" + tableId + "/cart");
        staffTableAccessor.setUser(staffAuth);
        Message<byte[]> staffTableMsg = MessageBuilder.createMessage(new byte[0], staffTableAccessor.getMessageHeaders());

        assertThatThrownBy(() -> stompInterceptor.preSend(staffTableMsg, null))
                .isInstanceOf(AccessDeniedException.class);

        // 3. Cho phép Customer có X-Table-Token hợp lệ subscribe /topic/tables/{id}/cart
        TableEntity table = TableEntity.builder()
                .id(tableId)
                .tableNumber("Bàn 02")
                .qrCodeToken("token-table-02")
                .status("SERVING")
                .build();
        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));

        StompHeaderAccessor custAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        custAccessor.setDestination("/topic/tables/" + tableId + "/cart");
        custAccessor.setNativeHeader("X-Table-Token", "token-table-02");
        Message<byte[]> custMsg = MessageBuilder.createMessage(new byte[0], custAccessor.getMessageHeaders());

        assertThatCode(() -> stompInterceptor.preSend(custMsg, null))
                .doesNotThrowAnyException();
    }
}
