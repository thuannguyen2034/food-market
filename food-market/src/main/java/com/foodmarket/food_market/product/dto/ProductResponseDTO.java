package com.foodmarket.food_market.product.dto;

import com.foodmarket.food_market.product.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
public class ProductResponseDTO {
    private Long id;
    private String name;
    private String description;
    private Map<String, String> specifications;
    private List<ProductImageDTO> images;
    private String unit;
    private BigDecimal basePrice; // Giá gốc
    private BigDecimal finalPrice; // Giá cuối cùng
    private String slug;
    private Integer stockQuantity;
    private Integer soldCount;
    private double rating;
    private Integer reviewCount;
    private CategorySummaryDTO category;
    private List<TagDTO> tags;

    public static ProductResponseDTO fromEntity(
            Product product,
            int stockQuantity
    ) {
        return ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .specifications(product.getSpecifications())
                .images(product.getImages().stream()
                        .map(ProductImageDTO::fromEntity)
                        .collect(Collectors.toList()))
                .unit(product.getUnit())
                .basePrice(product.getBasePrice())
                .finalPrice(product.getFinalPrice())
                .slug(product.getSlug())
                .stockQuantity(stockQuantity)
                .soldCount(product.getSoldCount())
                .rating(product.getAverageRating())
                .reviewCount(product.getReviewCount())
                .category(CategorySummaryDTO.fromEntity(product.getCategory()))
                .tags(product.getTags().stream()
                        .map(TagDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}