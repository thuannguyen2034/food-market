package com.foodmarket.food_market.category.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CategorySaveRequestDTO {

    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private MultipartFile imageFile;

    // ID của danh mục cha. Null nếu là danh mục gốc.
    private Long parentId;
}