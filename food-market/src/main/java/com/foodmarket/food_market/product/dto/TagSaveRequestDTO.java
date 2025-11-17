package com.foodmarket.food_market.product.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TagSaveRequestDTO {

    @NotEmpty(message = "Tên tag không được để trống")
    @Size(min = 2, max = 50, message = "Tên tag phải từ 2 đến 50 ký tự")
    private String name;
}