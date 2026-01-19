package com.foodmarket.food_market.cart.controller;

import com.foodmarket.food_market.cart.dto.CartItemRequestDTO;
import com.foodmarket.food_market.cart.dto.CartItemUpdateDTO;
import com.foodmarket.food_market.cart.dto.CartResponseDTO;
import com.foodmarket.food_market.cart.service.CartService;
import com.foodmarket.food_market.user.model.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')") 
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponseDTO> getMyCart(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.getCart(user.getUserId()));
    }

    
    @PostMapping("/items")
    public ResponseEntity<CartResponseDTO> addItemToMyCart(
            Authentication authentication,
            @Valid @RequestBody CartItemRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.addItemToCart(user.getUserId(), request));
    }

   
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponseDTO> updateMyCartItem(
            Authentication authentication,
            @PathVariable Long cartItemId,
            @Valid @RequestBody CartItemUpdateDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.updateCartItem(user.getUserId(), cartItemId, request));
    }

  
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponseDTO> removeMyCartItem(
            Authentication authentication,
            @PathVariable Long cartItemId
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(cartService.removeCartItem(user.getUserId(), cartItemId));
    }
}