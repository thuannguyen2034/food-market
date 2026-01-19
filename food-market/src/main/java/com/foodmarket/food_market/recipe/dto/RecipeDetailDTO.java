package com.foodmarket.food_market.recipe.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

import com.foodmarket.food_market.product.dto.ProductResponseDTO;

@Data
@Builder
public class RecipeDetailDTO {
    private RecipeResponseDTO recipeInfo;
    private List<ProductResponseDTO> products;
}