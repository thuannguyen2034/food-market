package com.foodmarket.food_market.review.repository;

import com.foodmarket.food_market.review.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByUserIdAndOrderIdAndProductId(UUID userId, UUID orderId, Long productId);
    @Query("SELECT r.product.id FROM Review r WHERE r.orderId = :orderId")
    List<Long> findReviewedProductIdsByOrderId(@Param("orderId") UUID orderId);
    Page<Review> findByProductId(Long productId, Pageable pageable);
}