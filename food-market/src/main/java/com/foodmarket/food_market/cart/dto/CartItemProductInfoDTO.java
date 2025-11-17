package com.foodmarket.food_market.cart.dto;

import com.foodmarket.food_market.product.model.Product;
import lombok.Builder;
import lombok.Data;

// DTO con, chỉ chứa thông tin tóm tắt của Product trong giỏ hàng
@Data
@Builder
public class CartItemProductInfoDTO {
    private Long id;
    private String name;
    private String imageUrl;
    private String unit;

    public static CartItemProductInfoDTO fromEntity(Product product) {
        return CartItemProductInfoDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .imageUrl(product.getImages().getFirst().getImageUrl())
                .unit(product.getUnit())
                .build();
    }
}