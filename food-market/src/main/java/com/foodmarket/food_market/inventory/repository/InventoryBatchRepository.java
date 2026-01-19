package com.foodmarket.food_market.inventory.repository;

import com.foodmarket.food_market.inventory.model.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long>, JpaSpecificationExecutor<InventoryBatch> {


    @Query("""
                SELECT ib FROM InventoryBatch ib
                WHERE ib.productId = :productId
                AND ib.currentQuantity > 0
                ORDER BY ib.expirationDate ASC
            """)
    List<InventoryBatch> findStillHasProductByProductIdOrderByExpirationDateAsc(@Param("productId") Long productId);

    @Query("SELECT COALESCE(SUM(b.currentQuantity), 0)  FROM InventoryBatch b WHERE b.productId = :productId AND b.expirationDate > CURRENT_DATE")
    int findCurrentProductQuantity(@Param("productId") Long productId);
}