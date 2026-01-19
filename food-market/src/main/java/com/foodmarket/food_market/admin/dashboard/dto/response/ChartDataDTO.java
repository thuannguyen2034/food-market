package com.foodmarket.food_market.admin.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ChartDataDTO {
    private String label; 
    private BigDecimal currentRevenue; 
    private BigDecimal previousRevenue; 
}