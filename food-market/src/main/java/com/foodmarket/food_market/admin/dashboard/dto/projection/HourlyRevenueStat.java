package com.foodmarket.food_market.admin.dashboard.dto.projection;

import java.math.BigDecimal;

public interface HourlyRevenueStat {
    int getHour(); // 0 -> 23
    BigDecimal getTotalRevenue();
}