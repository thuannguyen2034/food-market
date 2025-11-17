package com.foodmarket.food_market.inventory.repository;

import com.foodmarket.food_market.inventory.model.InventoryAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, Long> {
    // Hiện tại chưa cần custom query, JpaRepository là đủ
}