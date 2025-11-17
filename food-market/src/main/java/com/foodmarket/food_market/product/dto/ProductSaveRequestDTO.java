package com.foodmarket.food_market.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductSaveRequestDTO {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    private String imageUrl;

    @NotNull(message = "Giá gốc không được để trống")
    @Positive(message = "Giá gốc phải lớn hơn 0")
    private BigDecimal basePrice;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit; // kg, g, bó, vỉ...

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private List<String> tags; // Admin chỉ cần gửi tên tag (ví dụ: ["Tươi", "Hữu cơ"])
}