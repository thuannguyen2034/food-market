package com.foodmarket.food_market.admin.dashboard.projectionDto;

import java.math.BigDecimal;

public interface TopProductStat {
    String getDate();       // Ngày (ví dụ: "2023-11-20")
    BigDecimal getTotal();  // Tổng tiền
}
