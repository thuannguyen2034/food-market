package com.foodmarket.food_market.inventory.repository;

import com.foodmarket.food_market.inventory.model.InventoryAdjustment;
import com.foodmarket.food_market.inventory.model.InventoryBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, Long> {

    List<InventoryAdjustment> findByInventoryBatchOrderByCreatedAtDesc(InventoryBatch batch);

    Page<InventoryAdjustment> findByInventoryBatchOrderByCreatedAtDesc(InventoryBatch batch, Pageable pageable);

}