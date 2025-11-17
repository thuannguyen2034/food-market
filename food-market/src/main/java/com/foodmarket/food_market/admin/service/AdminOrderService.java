package com.foodmarket.food_market.admin.service;

import com.foodmarket.food_market.order.model.enums.OrderStatus;

import java.util.UUID;

public interface AdminOrderService {
    void updateOrderStatus(UUID orderId, OrderStatus newStatus);
}
