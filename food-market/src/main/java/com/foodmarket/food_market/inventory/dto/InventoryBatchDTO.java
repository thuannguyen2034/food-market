package com.foodmarket.food_market.inventory.dto;

import com.foodmarket.food_market.inventory.model.InventoryBatch;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

// Trong package dto
public record InventoryBatchDTO(
        Long batchId,
        Long productId,
        String productName,
        String batchCode,
        int quantityReceived,
        int currentQuantity,
        OffsetDateTime entryDate,
        LocalDate expirationDate,
        List<InventoryAdjustmentDTO> adjustments
        ) {
    public static InventoryBatchDTO fromEntity(InventoryBatch batch,List<InventoryAdjustmentDTO> adjustments, String productName) {
        return new InventoryBatchDTO(
                batch.getBatchId(),
                batch.getProductId(),
                productName,
                batch.getBatchCode(),
                batch.getQuantityReceived(),
                batch.getCurrentQuantity(),
                batch.getReceivedDate(), // Giả sử entity có field này; nếu chưa, thêm
                batch.getExpirationDate(),
                adjustments
        );
    }
    public static InventoryBatchDTO fromEntity(InventoryBatch batch, String productName) {
        return fromEntity(batch, List.of(),productName);
    }
}
