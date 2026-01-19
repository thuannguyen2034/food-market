package com.foodmarket.food_market.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class ProductSaveRequestDTO {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    private Map<String, String> specifications;

    @NotNull(message = "Giá gốc không được để trống")
    @Positive(message = "Giá gốc phải lớn hơn 0")
    private BigDecimal basePrice;

    @Min(value = 0, message = "Giá khuyến mãi không được âm")
    private BigDecimal salePrice;

    private Boolean isOnSale;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private List<String> tags; 

    private List<Long> deletedImageIds; 
}