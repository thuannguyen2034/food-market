package com.foodmarket.food_market.admin.dashboard.dto.response;

import com.foodmarket.food_market.admin.dashboard.dto.projection.TopProductStat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponseDTO {
    private Long productId;
    private String productName;
    private String productImage;
    private Long totalSold;
    private BigDecimal totalRevenue;

    public static TopProductResponseDTO fromProjection(TopProductStat stat,String imageUrl) {

        return TopProductResponseDTO.builder()
                .productId(stat.getProductId())
                .productName(stat.getProductName())
                .productImage(imageUrl)
                .totalSold(stat.getTotalSold())
                .totalRevenue(stat.getTotalRevenue())
                .build();
    }
}