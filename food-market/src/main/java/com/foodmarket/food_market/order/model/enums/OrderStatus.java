package com.foodmarket.food_market.order.model.enums;

import java.util.EnumSet;
import java.util.Set;

public enum OrderStatus {
    PENDING,        // Chờ xử lý (mới tạo)
    CONFIRMED,      // Đã xác nhận (chờ đóng gói)
    PROCESSING,     // Đang đóng gói
    OUT_FOR_DELIVERY, // Đang giao hàng
    DELIVERED,      // Đã giao thành công
    CANCELLED;    // Đã hủy

    public static final Set<OrderStatus> ACTIVE_STATUSES =
            EnumSet.of(CONFIRMED
                    , DELIVERED
                    , PROCESSING
                    , OUT_FOR_DELIVERY);
    public static final Set<String> ACTIVE_STATUSES_Strings = Set.of(CONFIRMED.name()
            , DELIVERED.name()
            , PROCESSING.name()
            , OUT_FOR_DELIVERY.name());
    public static final Set<OrderStatus> URGENT_STATUSES =
            EnumSet.of(CONFIRMED
                    , PENDING
                    , PROCESSING
                    , OUT_FOR_DELIVERY);
}