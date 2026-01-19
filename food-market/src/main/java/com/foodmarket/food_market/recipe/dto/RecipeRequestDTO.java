package com.foodmarket.food_market.recipe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class RecipeRequestDTO {
    @NotBlank(message = "Tên món không được để trống")
    private String name;

    private String cookingSteps;
    private String ingredients;
    private String tags;
    private List<Long> productIds;
}