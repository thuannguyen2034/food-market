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
    private BigDecimal basePrice;
    private BigDecimal itemPrice;
    private BigDecimal totalBasePrice;
    private BigDecimal totalItemPrice; 
    private CartItemProductInfoDTO product;
    private String note;
    public static CartItemResponseDTO fromEntity(CartItem cartItem, String note) {
        Product product = cartItem.getProduct();
        BigDecimal total = cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
        BigDecimal totalBase = product.getBasePrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
        return CartItemResponseDTO.builder()
                .cartItemId(cartItem.getId())
                .quantity(cartItem.getQuantity())
                .basePrice(product.getBasePrice())
                .itemPrice(cartItem.getPrice())
                .totalBasePrice(totalBase)
                .totalItemPrice(total)
                .product(CartItemProductInfoDTO.fromEntity(product))
                .note(note)
                .build();
    }
}