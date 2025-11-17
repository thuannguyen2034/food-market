package com.foodmarket.food_market.product.dto;

import com.foodmarket.food_market.category.dto.CategoryResponseDTO; // Dùng lại DTO của Category
import com.foodmarket.food_market.product.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private List<ProductImageDTO> images;
    private String unit;
    private BigDecimal basePrice; // Giá gốc
    private BigDecimal finalPrice; // Giá cuối cùng (sau khi áp dụng HSD)
    private BigDecimal discountPercentage; // % giảm giá
    private String slug;
    private Integer stockQuantity;
    // Thông tin liên quan
    private CategorySummaryDTO category; // Dùng 1 DTO con để tránh trả về quá nhiều
    private List<TagDTO> tags;

    /**
     * Hàm static fromEntity phức tạp
     * Logic tính giá (finalPrice) sẽ do Service thực hiện và truyền vào đây.
     * DTO chỉ chịu trách nhiệm map dữ liệu.
     */
    public static ProductResponseDTO fromEntity(
            Product product,
            BigDecimal finalPrice,
            BigDecimal discountPercentage
    ) {
        return ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .images(product.getImages().stream()
                        .map(ProductImageDTO::fromEntity)
                        .collect(Collectors.toList()))
                .unit(product.getUnit())
                .basePrice(product.getBasePrice())
                .finalPrice(finalPrice)
                .discountPercentage(discountPercentage)
                .slug(product.getSlug())
                .category(CategorySummaryDTO.fromEntity(product.getCategory()))
                .tags(product.getTags().stream()
                        .map(TagDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}