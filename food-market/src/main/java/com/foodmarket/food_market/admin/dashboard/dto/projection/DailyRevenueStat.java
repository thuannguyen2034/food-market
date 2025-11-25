package com.foodmarket.food_market.admin.dashboard.dto.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyRevenueStat {
    LocalDate getDate();       // Ngày (ví dụ: "2023-11-20")
    BigDecimal getTotalRevenue();  // Tổng tiền
}
