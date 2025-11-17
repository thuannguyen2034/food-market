package com.foodmarket.food_market.cart.service;

import com.foodmarket.food_market.cart.dto.CartItemRequestDTO;
import com.foodmarket.food_market.cart.dto.CartItemUpdateDTO;
import com.foodmarket.food_market.cart.dto.CartResponseDTO;

import java.util.UUID;

public interface CartService {

    /** Lấy giỏ hàng (kèm giá) của user */
    CartResponseDTO getCart(UUID userId);

    /** Thêm/Cập nhật item vào giỏ. Dùng chung 1 hàm cho tiện */
    CartResponseDTO addItemToCart(UUID userId, CartItemRequestDTO request);

    /** Cập nhật số lượng của một item đã có */
    CartResponseDTO updateCartItem(UUID userId, Long cartItemId, CartItemUpdateDTO request);

    /** Xóa 1 item khỏi giỏ */
    CartResponseDTO removeCartItem(UUID userId, Long cartItemId);

    /** Xóa toàn bộ giỏ hàng (chưa làm, có thể thêm sau) */
    // void clearCart(UUID userId);
}