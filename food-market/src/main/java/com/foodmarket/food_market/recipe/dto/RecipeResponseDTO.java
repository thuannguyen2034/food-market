package com.foodmarket.food_market.recipe.dto;

import com.foodmarket.food_market.recipe.model.Recipe;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class RecipeResponseDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private String cookingSteps;
    private String ingredients;
    private String tags;
    private List<Long> productIds; // Trả về list ID sản phẩm để FE map lại

    public static RecipeResponseDTO fromEntity(Recipe recipe) {
        List<Long> linkedProductIds = recipe.getProducts().stream()
                .map(rp -> rp.getProductId())
                .collect(Collectors.toList());

        return RecipeResponseDTO.builder()
                .id(recipe.getId())
                .name(recipe.getName())
                .imageUrl(recipe.getImageUrl())
                .cookingSteps(recipe.getCookingSteps())
                .ingredients(recipe.getIngredients())
                .tags(recipe.getTags())
                .productIds(linkedProductIds)
                .build();
    }
}