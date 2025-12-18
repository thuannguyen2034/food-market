package com.foodmarket.food_market.recipe.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class RecipeRequestDTO {
    @NotBlank(message = "Tên món không được để trống")
    private String name;

    private String cookingSteps; // Client gửi chuỗi text (markdown hoặc html)
    private String ingredients;  // Client gửi chuỗi text
    private String tags;         // Client gửi chuỗi "TAG1,TAG2"

    private List<Long> productIds; // Danh sách ID sản phẩm liên kết
}