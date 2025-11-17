package com.foodmarket.food_market.cart.dto;

import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.product.dto.ProductResponseDTO; // Dùng để lấy giá
import com.foodmarket.food_market.product.model.Product;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class CartResponseDTO {
    private UUID cartId;
    private List<CartItemResponseDTO> items;
    private BigDecimal grandTotal; // Tổng tiền của cả giỏ hàng

    /**
     * Hàm fromEntity. Cần thêm Map<Long, ProductResponseDTO>
     * chứa thông tin giá đã tính của sản phẩm.
     */
    public static CartResponseDTO fromEntity(Cart cart, Map<Long, ProductResponseDTO> priceMap) {
        BigDecimal total = BigDecimal.ZERO;

        List<CartItemResponseDTO> itemDTOs = cart.getItems().stream()
                .map(cartItem -> {
                    Product product = cartItem.getProduct();
                    ProductResponseDTO pricedProduct = priceMap.get(product.getId());

                    // Lấy giá đã tính (finalPrice)
                    BigDecimal unitPrice = (pricedProduct != null) ?
                            pricedProduct.getFinalPrice() :
                            product.getBasePrice(); // Fallback về giá gốc nếu lỗi

                    return CartItemResponseDTO.fromEntity(cartItem, unitPrice);
                })
                .collect(Collectors.toList());

        // Tính tổng tiền
        for (CartItemResponseDTO itemDTO : itemDTOs) {
            total = total.add(itemDTO.getTotalItemPrice());
        }

        return CartResponseDTO.builder()
                .cartId(cart.getId())
                .items(itemDTOs)
                .grandTotal(total)
                .build();
    }
}