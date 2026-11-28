package com.restaurantos.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderChangeAlertDto {
    private UUID id;
    private UUID ticketId;
    private UUID itemId;
    private String dishName;
    private String tableNo;
    private Integer quantity;
    private String variant;
    private String reason;
    private Boolean acknowledged;
    private Instant createdAt;
}
