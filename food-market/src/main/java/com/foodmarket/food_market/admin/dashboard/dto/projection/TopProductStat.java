package com.foodmarket.food_market.admin.dashboard.dto.projection;

import java.math.BigDecimal;

public interface TopProductStat {
    Long getProductId();
    String getProductName();
    Long getTotalSold();      // Tổng số lượng bán ra
    BigDecimal getTotalRevenue(); // Tổng tiền thu được từ sản phẩm này
}