package com.foodmarket.food_market.cart.dto;

import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.cart.model.CartItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class CartResponseDTO {
    private UUID cartId;
    private List<CartItemResponseDTO> items;
    private BigDecimal grandTotal; 
    private BigDecimal baseGrandTotal;
    public static CartResponseDTO fromEntity(Cart cart, Map<Long,String> noteMap) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal baseTotal = BigDecimal.ZERO;
        List<CartItemResponseDTO> itemDTOs = cart.getItems().stream()
                .sorted(Comparator.comparing(CartItem::getId))
                .map(cartItem -> {
                    String note = noteMap.get(cartItem.getId());
                    return CartItemResponseDTO.fromEntity(cartItem,note);
                })
                .collect(Collectors.toList());

        // Tính tổng tiền
        for (CartItemResponseDTO itemDTO : itemDTOs) {
            total = total.add(itemDTO.getTotalItemPrice());
            baseTotal = baseTotal.add(itemDTO.getTotalBasePrice());
        }

        return CartResponseDTO.builder()
                .cartId(cart.getId())
                .items(itemDTOs)
                .grandTotal(total)
                .baseGrandTotal(baseTotal)
                .build();
    }
}