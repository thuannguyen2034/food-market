package com.foodmarket.food_market.inventory.service;

import com.foodmarket.food_market.inventory.model.InventoryBatch;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

// Trong package specification
public class InventoryBatchSpecification {
    public static Specification<InventoryBatch> byProductId(Long productId) {
        return (root, query, cb) -> cb.equal(root.get("productId"), productId);
    }
    public static Specification<InventoryBatch> hasQuantityGreaterThan(int quantity) {
        return (root, query, cb) -> cb.greaterThan(root.get("currentQuantity"), quantity);
    }
    // Mới: Filter lô sắp hết hạn (<= now + daysThreshold)
    public static Specification<InventoryBatch> expiringWithinDays(int daysThreshold) {
        LocalDate now = LocalDate.now();
        LocalDate thresholdDate = now.plusDays(daysThreshold);
        return (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("currentQuantity"), 0),  // Chỉ lô còn hàng
                cb.lessThanOrEqualTo(root.get("expirationDate"), thresholdDate)
        );
    }

    // Mới: Filter lô hết hạn (<= now)
    public static Specification<InventoryBatch> expired() {
        LocalDate now = LocalDate.now();
        return (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("currentQuantity"), 0),  // Chỉ lô còn hàng nhưng hết hạn
                cb.lessThanOrEqualTo(root.get("expirationDate"), now)
        );
    }
}
