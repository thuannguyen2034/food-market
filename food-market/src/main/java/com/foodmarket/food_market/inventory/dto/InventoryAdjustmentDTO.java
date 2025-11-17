package com.foodmarket.food_market.inventory.dto;

import com.foodmarket.food_market.inventory.model.InventoryAdjustment;

import java.time.OffsetDateTime;

public record InventoryAdjustmentDTO(
        Long adjustmentId,
        Long batchId,
        String adjustedByUserId,
        int adjustmentQuantity,
        String reason,
        OffsetDateTime adjustmentDate  // Giả sử entity có @CreationTimestamp cho field này
) {
    public static InventoryAdjustmentDTO fromEntity(InventoryAdjustment adjustment) {
        return new InventoryAdjustmentDTO(
                adjustment.getAdjustmentId(),  // Giả sử entity có ID
                adjustment.getInventoryBatch().getBatchId(),
                adjustment.getAdjustedByUserId().toString(),
                adjustment.getAdjustmentQuantity(),
                adjustment.getReason(),
                adjustment.getCreatedAt()  // Nếu có field
        );
    }
}
