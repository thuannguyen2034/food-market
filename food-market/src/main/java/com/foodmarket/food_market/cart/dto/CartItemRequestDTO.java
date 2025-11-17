package com.foodmarket.food_market.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemRequestDTO {

    @NotNull(message = "Product ID không được để trống")
    private Long productId;

    @Min(value = 1, message = "Số lượng phải ít nhất là 1")
    private int quantity;
}