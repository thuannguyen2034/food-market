package com.foodmarket.food_market.inventory.repository;

import com.foodmarket.food_market.inventory.model.InventoryBatch;
import com.foodmarket.food_market.product.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long>, JpaSpecificationExecutor<InventoryBatch> {

    /**
     * Phương thức cốt lõi cho logic FEFO (First-Expired, First-Out).
     * Tìm tất cả các lô hàng của một sản phẩm:
     * 1. Vẫn còn hàng (current_quantity > 0)
     * 2. Sắp xếp theo ngày hết hạn TĂNG DẦN (lô sắp hết hạn nhất lên đầu)
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
                SELECT ib FROM InventoryBatch ib
                WHERE ib.productId = :productId
                AND ib.currentQuantity > 0
                ORDER BY ib.expirationDate ASC
            """)
    List<InventoryBatch> findStillHasProductByProductIdOrderByExpirationDateAsc(@Param("productId") Long productId);

    // KPI & Cảnh báo: Đếm số lô hàng sắp hết hạn (<= dateThreshold và chưa bán hết)
    @Query("SELECT COUNT(b) FROM InventoryBatch b " +
            "WHERE b.expirationDate <= :thresholdDate " +
            "AND b.currentQuantity > 0")
    long countExpiringBatches(@Param("thresholdDate") LocalDate thresholdDate);
}