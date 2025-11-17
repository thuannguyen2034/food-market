package com.foodmarket.food_market.category.dto;

import com.foodmarket.food_market.category.model.Category;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder // Dùng Builder Pattern để dễ tạo
public class CategoryResponseDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private Long parentId; // Thêm parentId để client dễ xử lý (nếu cần)
    private String slug;
    // Quan trọng: Danh sách đệ quy
    @Builder.Default
    private List<CategoryResponseDTO> children = new ArrayList<>();

    public static CategoryResponseDTO fromEntity(Category category){
        return CategoryResponseDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .imageUrl(category.getImageUrl())
                .parentId(category.getParent()!= null?category.getParent().getId():null)
                .slug(category.getSlug())
                .build();
    }
}