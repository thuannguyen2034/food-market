package com.foodmarket.food_market.recipe.dto;

import lombok.Data;

// DTO class dùng nội bộ cho controller này (hoặc tách ra file riêng nếu muốn)
@Data
public class AiAnalysisRequestDTO {
    private String name;
    private String ingredients;
}