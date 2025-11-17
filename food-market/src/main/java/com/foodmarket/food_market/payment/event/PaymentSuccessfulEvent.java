package com.foodmarket.food_market.payment.event;

import com.foodmarket.food_market.order.model.Order;
import lombok.Getter;

/**
 * Event này được "phát" ra khi thanh toán thành công.
 */
@Getter
public class PaymentSuccessfulEvent {
    private final Order order;

    public PaymentSuccessfulEvent(Order order) {
        this.order = order;
    }
}