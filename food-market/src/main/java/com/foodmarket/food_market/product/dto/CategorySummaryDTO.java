package com.foodmarket.food_market.product.dto;

import com.foodmarket.food_market.category.model.Category;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategorySummaryDTO {
    private Long id;
    private String name;
    private String slug;
    public static CategorySummaryDTO fromEntity(Category category) {
        return CategorySummaryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .build();
    }
}