package com.foodmarket.food_market.admin.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private BigDecimal currentRevenue;
    private BigDecimal previousRevenue;
    private Double revenueGrowth; 

    private Long currentOrders;
    private Long previousOrders;
    private Double ordersGrowth;
}