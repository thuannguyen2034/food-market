package com.foodmarket.food_market.cart.repository;

import com.foodmarket.food_market.cart.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    @Query("SELECT c FROM Cart c " +
            "LEFT JOIN FETCH c.items ci " +
            "LEFT JOIN FETCH ci.product p " +
            "WHERE c.user.userId = :userId")
    Optional<Cart> findByUserIdWithItems(UUID userId);

    Optional<Cart> findByUser_UserId(UUID userId);
}