package com.foodmarket.food_market.recipe.dto;

import lombok.Data;

import java.util.List;

@Data
public class RecipeSearchRequestDTO {
    private String keyword;
    private String role;
    private Boolean isVegan;
    private List<String> allergies;
    private List<String> preferredFlavors;
    private String timeConstraint;
    private List<String> nutritionGoals;
    private int page = 0;
    private int size = 10;
}