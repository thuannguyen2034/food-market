package com.foodmarket.food_market.product.dto; // (Package DTO của bạn)

import com.foodmarket.food_market.product.model.ProductImage;
import lombok.Builder;
import lombok.Data;
// import ...ProductImage;

@Data
@Builder
public class ProductImageDTO {
    private Long id;
    private String imageUrl;
    private Integer displayOrder;

    public static ProductImageDTO fromEntity(ProductImage image) {
        return ProductImageDTO.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .displayOrder(image.getDisplayOrder())
                .build();
    }
}