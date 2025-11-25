package com.foodmarket.food_market.admin.dashboard.dto.response;

import com.foodmarket.food_market.admin.dashboard.dto.projection.OrderStatusStat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusResponseDTO {
    private String status; // Trả về String cho FE dễ hiển thị
    private Long count;

    public static OrderStatusResponseDTO fromProjection(OrderStatusStat stat) {
        return OrderStatusResponseDTO.builder()
                .status(stat.getStatus().name())
                .count(stat.getCount())
                .build();
    }
}