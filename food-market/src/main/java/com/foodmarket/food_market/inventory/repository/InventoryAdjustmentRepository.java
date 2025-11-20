package com.foodmarket.food_market.inventory.repository;

import com.foodmarket.food_market.inventory.model.InventoryAdjustment;
import com.foodmarket.food_market.inventory.model.InventoryBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, Long> {
    // Hiện tại chưa cần custom query, JpaRepository là đủ
    /**
     * Method tìm tất cả InventoryAdjustment theo InventoryBatch,
     * sắp xếp theo adjustmentDate DESC.
     *
     * Sử dụng naming convention của Spring Data JPA.
     * Trả về List (không paging).
     *
     * @param batch InventoryBatch để filter
     * @return List<InventoryAdjustment> sorted by adjustmentDate DESC
     */
    List<InventoryAdjustment> findByInventoryBatchOrderByCreatedAtDesc(InventoryBatch batch);

    // Phiên bản với paging (nếu cần, để hỗ trợ getAdjustmentsForBatch)
    Page<InventoryAdjustment> findByInventoryBatchOrderByCreatedAtDesc(InventoryBatch batch, Pageable pageable);

}