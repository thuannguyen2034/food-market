package com.foodmarket.food_market.admin.dto;

/**
 * Enum representing time ranges for order statistics filtering.
 */
public enum TimeRange {
    ALL,     // Tất cả (từ trước đến nay)
    TODAY,   // Hôm nay
    WEEK,    // 7 ngày gần nhất
    MONTH    // 30 ngày gần nhất
}
