package com.foodmarket.food_market.cart.service;

import com.foodmarket.food_market.cart.dto.CartItemRequestDTO;
import com.foodmarket.food_market.cart.dto.CartItemUpdateDTO;
import com.foodmarket.food_market.cart.dto.CartResponseDTO;

import java.util.UUID;

public interface CartService {

    CartResponseDTO getCart(UUID userId);

    CartResponseDTO addItemToCart(UUID userId, CartItemRequestDTO request);

    CartResponseDTO updateCartItem(UUID userId, Long cartItemId, CartItemUpdateDTO request);

    CartResponseDTO removeCartItem(UUID userId, Long cartItemId);

}