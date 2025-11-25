package com.foodmarket.food_market.admin.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class ChartDataDTO {
    private String label; // Ngày hiển thị (VD: "22/11")
    private BigDecimal currentRevenue; // Doanh thu kỳ này
    private BigDecimal previousRevenue; // Doanh thu kỳ trước tương ứng
}