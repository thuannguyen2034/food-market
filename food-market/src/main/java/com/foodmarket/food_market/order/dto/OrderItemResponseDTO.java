package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponseDTO {
    private Long id;
    private String productName;
    private String productImageUrl;
    private int quantity;
    private BigDecimal priceAtPurchase;
    private String batchCode; // Cho biết lô hàng

    public static OrderItemResponseDTO fromEntity(OrderItem item) {
        return OrderItemResponseDTO.builder()
                .id(item.getId())
                .productName(item.getProduct().getName())
                .productImageUrl(item.getProduct().getImages().getFirst().getImageUrl())
                .quantity(item.getQuantity())
                .priceAtPurchase(item.getPriceAtPurchase())
                .batchCode(item.getInventoryBatch().getBatchCode())
                .build();
    }
}