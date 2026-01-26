package com.foodmarket.food_market.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for order statistics response.
 * Returns aggregated order data for a specific time range.
 */
@Data
@Builder
public class OrderStatsDTO {
    private long totalOrders;
    private long pendingOrders;
    private long confirmedOrders;
    private long outForDeliveryOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private BigDecimal totalRevenue;
    private TimeRange timeRange;
}
