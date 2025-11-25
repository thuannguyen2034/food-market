package com.foodmarket.food_market.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequestDTO {
    @NotNull(message = "Address ID không được để trống")
    private Long addressId;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // "COD" hoặc "VNPAY"

    private String deliveryTimeslot; // "08:00 - 10:00"

    private String note;
}