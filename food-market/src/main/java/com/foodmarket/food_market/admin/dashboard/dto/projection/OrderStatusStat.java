package com.foodmarket.food_market.admin.dashboard.dto.projection;

import com.foodmarket.food_market.order.model.enums.OrderStatus;

public interface OrderStatusStat {
    OrderStatus getStatus();
    Long getCount();
}
