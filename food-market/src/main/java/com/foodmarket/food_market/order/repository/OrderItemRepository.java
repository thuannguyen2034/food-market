package com.foodmarket.food_market.order.repository;

import com.foodmarket.food_market.order.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Hiện tại không cần phương thức custom nào
    // JpaRepository đã đủ (dùng saveAll trong OrderService)
}