package com.foodmarket.food_market.recipe.dto;

import lombok.Data;

import java.util.List;

@Data
public class RecipeSearchRequestDTO {
    // 1. HARD FILTERS (Bắt buộc)
    private String keyword;           // Tên món
    private String role;              // DISH_MAIN, DISH_SOUP... (Chọn 1)
    private Boolean isVegan;          // True -> Lọc món có tag VEGAN
    private List<String> allergies;   // List dị ứng (VD: NUT, SEAFOOD) -> Loại bỏ

    // 2. SCORING PREFERENCES (Sở thích để tính điểm)
    private List<String> preferredFlavors; // SPICY, SWEET, SOUR...
    private String timeConstraint;         // TIME_FAST, TIME_MEDIUM...
    private List<String> nutritionGoals;   // HIGH_PROTEIN, LOW_CARB...

    // Pagination
    private int page = 0;
    private int size = 10;
}