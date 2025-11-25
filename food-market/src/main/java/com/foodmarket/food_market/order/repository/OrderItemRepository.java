package com.foodmarket.food_market.order.repository;

import com.foodmarket.food_market.order.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Hiện tại không cần phương thức custom nào
    // JpaRepository đã đủ (dùng saveAll trong OrderService)
    List<OrderItem> findByOrderId(UUID id);
}