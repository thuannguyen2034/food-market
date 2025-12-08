package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.OrderItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponseDTO {
    private Long id;
    private int quantity;
    private Long productIdSnapshot;
    private String productNameSnapshot;
    private String productThumbnailSnapshot;
    private BigDecimal priceAtPurchase;
    private BigDecimal basePriceAtPurchase;
    private String productSlug;
    private String categorySlug;
    private String batchCode;
    private Boolean isReviewed;
    public static OrderItemResponseDTO fromEntity(OrderItem item, boolean isReviewed) {
        return OrderItemResponseDTO.builder()
                .id(item.getId())
                .quantity(item.getQuantity())
                .productIdSnapshot(item.getProductIdSnapshot())
                .productNameSnapshot(item.getProductNameSnapshot())
                .productThumbnailSnapshot(item.getProductThumbnailSnapshot())
                .priceAtPurchase(item.getPriceAtPurchase())
                .basePriceAtPurchase(item.getBasePriceAtPurchase())
                .productSlug(item.getProduct().getSlug())
                .categorySlug(item.getProduct().getCategory().getSlug())
                .batchCode(item.getInventoryBatch().getBatchCode())
                .isReviewed(isReviewed)
                .build();
    }
}