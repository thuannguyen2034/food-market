package com.foodmarket.food_market.recipe.dto;

import lombok.Data;

@Data
public class RecipeFilter {
    private String keyword;
    private String tag;
    private Long productId;
}