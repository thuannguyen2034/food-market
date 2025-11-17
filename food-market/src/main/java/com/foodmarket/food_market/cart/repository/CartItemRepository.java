package com.foodmarket.food_market.cart.repository;

import com.foodmarket.food_market.cart.model.Cart;
import com.foodmarket.food_market.cart.model.CartItem;
import com.foodmarket.food_market.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /**
     * Tìm một item cụ thể trong giỏ hàng
     */
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);

    /**
     * Tìm item theo ID VÀ Cart ID (dùng để check bảo mật)
     */
    Optional<CartItem> findByIdAndCart_Id(Long id, UUID cartId);
}