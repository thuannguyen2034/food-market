package com.foodmarket.food_market.product.dto;

import com.foodmarket.food_market.product.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
public class AdminProductResponseDTO {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Map<String, String> specifications;
    private List<ProductImageDTO> images;
    private String unit;

    // --- Giá & Khuyến mãi ---
    private BigDecimal basePrice;       
    private BigDecimal salePrice;       
    private BigDecimal finalPrice;      
    private boolean onSale;           
    private int discountPercentage;     

    // --- Kho & Thống kê ---
    private int stockQuantity;
    private int soldCount;              
    private Double averageRating;       
    private Integer reviewCount;        

    // --- Thông tin liên quan ---
    private CategorySummaryDTO category;
    private List<TagDTO> tags;
    private LocalDate soonestExpirationDate; 

    // --- Trạng thái hệ thống ---
    private boolean deleted;
    private OffsetDateTime createdAt;
    private LocalDateTime deletedAt;

    public static AdminProductResponseDTO fromEntity(
            Product product,
            int stockQuantity,
            LocalDate soonestExpirationDate
    ) {
        int discountPercent = 0;
        BigDecimal finalPrice = product.getBasePrice();

        if (product.isOnSale() && product.getSalePrice() != null && product.getSalePrice().compareTo(BigDecimal.ZERO) > 0) {
            finalPrice = product.getSalePrice();
            if (product.getBasePrice().compareTo(BigDecimal.ZERO) > 0) {
                discountPercent = product.getBasePrice()
                        .subtract(product.getSalePrice())
                        .divide(product.getBasePrice(), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .intValue();
            }
        }

        return AdminProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .specifications(product.getSpecifications() != null ? product.getSpecifications() : new HashMap<>())
                .images(product.getImages().stream()
                        .map(ProductImageDTO::fromEntity)
                        .collect(Collectors.toList()))
                .unit(product.getUnit())

                .basePrice(product.getBasePrice())
                .salePrice(product.getSalePrice())
                .onSale(product.isOnSale())
                .finalPrice(finalPrice)
                .discountPercentage(discountPercent)

                .stockQuantity(stockQuantity)
                .soldCount(product.getSoldCount() != null ? product.getSoldCount() : 0)
                .averageRating(product.getAverageRating())
                .reviewCount(product.getReviewCount())

                
                .category(CategorySummaryDTO.fromEntity(product.getCategory()))
                .tags(product.getTags().stream()
                        .map(TagDTO::fromEntity)
                        .collect(Collectors.toList()))
                .soonestExpirationDate(soonestExpirationDate)

                
                .deleted(product.isDeleted())
                .createdAt(product.getCreatedAt())
                .deletedAt(product.getDeletedAt())
                .build();
    }
}