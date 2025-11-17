package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderStatusDTO {
    @NotNull(message = "Trạng thái mới không được để trống")
    private OrderStatus newStatus;
}