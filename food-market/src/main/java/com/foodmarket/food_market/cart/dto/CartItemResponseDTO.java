package com.foodmarket.food_market.cart.dto;

import com.foodmarket.food_market.cart.model.CartItem;
import com.foodmarket.food_market.product.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CartItemResponseDTO {
    private Long cartItemId;
    private int quantity;
    private BigDecimal unitPrice; // Giá của 1 sản phẩm (đã tính)
    private BigDecimal totalItemPrice; // quantity * unitPrice
    private CartItemProductInfoDTO product; // DTO con cho thông tin SP

    public static CartItemResponseDTO fromEntity(CartItem cartItem, BigDecimal unitPrice) {
        Product product = cartItem.getProduct();
        BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemResponseDTO.builder()
                .cartItemId(cartItem.getId())
                .quantity(cartItem.getQuantity())
                .unitPrice(unitPrice)
                .totalItemPrice(total)
                .product(CartItemProductInfoDTO.fromEntity(product))
                .build();
    }
}