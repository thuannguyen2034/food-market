package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.enums.DeliveryTimeSlot;
import com.foodmarket.food_market.order.model.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequestDTO {
    @NotNull(message = "Address ID không được để trống")
    private Long addressId;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod; // "COD" hoặc "VNPAY"
    @NotNull
    private DeliveryTimeSlot deliveryTimeslot;

    private String note;
}