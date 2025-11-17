package com.foodmarket.food_market.product.dto;

import com.foodmarket.food_market.category.model.Category;
import lombok.Builder;
import lombok.Data;

// DTO con, chỉ chứa thông tin tóm tắt của Category
@Data
@Builder
public class CategorySummaryDTO {
    private Long id;
    private String name;

    public static CategorySummaryDTO fromEntity(Category category) {
        return CategorySummaryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}