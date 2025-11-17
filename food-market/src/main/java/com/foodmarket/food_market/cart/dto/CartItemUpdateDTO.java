package com.foodmarket.food_market.cart.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class CartItemUpdateDTO {
    @Min(value = 1, message = "Số lượng phải ít nhất là 1")
    private int quantity;
}