package com.foodmarket.food_market.order.event;

import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import lombok.Getter;

@Getter
public class OrderStatusChangedEvent {
    private final Order order;
    private final OrderStatus newStatus;

    public OrderStatusChangedEvent(Order order, OrderStatus newStatus) {
        this.order = order;
        this.newStatus = newStatus;
    }
}