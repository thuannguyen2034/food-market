package com.foodmarket.food_market.order.model.enums;

public enum PaymentStatus {
    PENDING,     // Chờ thanh toán (ví dụ: VNPay)
    PAID, // Đã thanh toán
    FAILED,
    CANCELLED,
    REFUNDED     // Đã hoàn tiền
}
