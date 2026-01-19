package com.foodmarket.food_market.inventory.dto;

import com.foodmarket.food_market.inventory.model.InventoryAdjustment;

import java.time.OffsetDateTime;

public record InventoryAdjustmentDTO(
        Long adjustmentId,
        Long batchId,
        String adjustedByUserId,
        String adjustedByUserName,
        int adjustmentQuantity,
        String reason,
        OffsetDateTime adjustmentDate 
) {
    public static InventoryAdjustmentDTO fromEntity(InventoryAdjustment adjustment) {
        return new InventoryAdjustmentDTO(
                adjustment.getAdjustmentId(), 
                adjustment.getInventoryBatch().getBatchId(),
                adjustment.getAdjustedBy().getUserId().toString(),
                adjustment.getAdjustedBy().getEmail(),
                adjustment.getAdjustmentQuantity(),
                adjustment.getReason(),
                adjustment.getCreatedAt()
        );
    }
}
