package com.foodmarket.food_market.admin.dashboard.dto.projection;


import java.math.BigDecimal;

public interface TopProductStat {
    Long getProductId();
    String getProductName();
    Long getTotalSold();     
    BigDecimal getTotalRevenue(); 
}