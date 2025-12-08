package com.foodmarket.food_market.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class HomeSectionDTO {
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private List<ProductResponseDTO> products;
}