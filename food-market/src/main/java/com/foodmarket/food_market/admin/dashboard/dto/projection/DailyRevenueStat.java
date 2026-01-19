package com.foodmarket.food_market.admin.dashboard.dto.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyRevenueStat {
    LocalDate getDate();      
    BigDecimal getTotalRevenue();  
}
