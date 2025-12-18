package com.foodmarket.food_market.recipe.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

// Import DTO của module Product (Giả sử bạn đã có class này trong module Product hoặc Shared)
// Nếu chưa có, hãy tạo một class DTO tương đương trong package Shared để dùng chung.
import com.foodmarket.food_market.product.dto.ProductResponseDTO;

@Data
@Builder
public class RecipeDetailDTO {
    private RecipeResponseDTO recipeInfo;   // Thông tin món ăn
    private List<ProductResponseDTO> products; // Danh sách nguyên liệu (Full data để render ProductCard)
}