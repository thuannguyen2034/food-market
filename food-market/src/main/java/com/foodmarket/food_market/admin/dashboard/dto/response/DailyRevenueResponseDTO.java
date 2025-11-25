package com.foodmarket.food_market.admin.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.foodmarket.food_market.admin.dashboard.dto.projection.DailyRevenueStat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyRevenueResponseDTO {
    private LocalDate date;
    private BigDecimal totalRevenue;

    // Constructor tiện ích để map từ Interface sang Class
    public static DailyRevenueResponseDTO fromProjection(DailyRevenueStat stat) {
        return DailyRevenueResponseDTO.builder()
                .date(stat.getDate())
                .totalRevenue(stat.getTotalRevenue())
                .build();
    }
}