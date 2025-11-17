package com.foodmarket.food_market.inventory.repository;

import com.foodmarket.food_market.inventory.model.InventoryBatch;
import com.foodmarket.food_market.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long>, JpaSpecificationExecutor<InventoryBatch> {

    /**
     * Phương thức cốt lõi cho logic FEFO (First-Expired, First-Out).
     * Tìm tất cả các lô hàng của một sản phẩm:
     * 1. Vẫn còn hàng (current_quantity > 0)
     * 2. Sắp xếp theo ngày hết hạn TĂNG DẦN (lô sắp hết hạn nhất lên đầu)
     */
    @Query("""
        SELECT ib FROM InventoryBatch ib
        WHERE ib.productId = :productId
        AND ib.currentQuantity > 0
        ORDER BY ib.expirationDate ASC
    """)
    List<InventoryBatch> findByProductIdAndCurrentQuantityGreaterThanOrderByExpirationDateAsc(@Param("productId") Long productId);
}