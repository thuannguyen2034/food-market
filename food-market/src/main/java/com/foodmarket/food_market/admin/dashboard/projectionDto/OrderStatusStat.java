package com.foodmarket.food_market.admin.dashboard.projectionDto;

import com.foodmarket.food_market.order.model.enums.OrderStatus;

public interface OrderStatusStat {
    OrderStatus getStatus();
    Long getCount();
}
