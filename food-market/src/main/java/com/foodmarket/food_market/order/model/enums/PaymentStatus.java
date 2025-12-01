package com.foodmarket.food_market.order.model.enums;

public enum PaymentStatus {
    PENDING,     // Chờ thanh toán (ví dụ: VNPay)
    PAID,        // Đã thanh toán
    CANCEL,      // Thanh toán lỗi
    REFUNDED     // Đã hoàn tiền
}
