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
    private Double revenueGrowth; // Ví dụ: 15.5 (tăng 15.5%), -5.0 (giảm 5%)

    // Đơn hàng
    private Long currentOrders;
    private Long previousOrders;
    private Double ordersGrowth;
}