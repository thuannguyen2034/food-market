package com.foodmarket.food_market.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class PaymentRequestDTO {
    @NotNull(message = "Order ID không được để trống")
    private UUID orderId;
}