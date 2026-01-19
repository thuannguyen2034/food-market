package com.foodmarket.food_market.inventory.dto;

import com.foodmarket.food_market.inventory.model.InventoryBatch;

public record AllocatedBatchDTO(
        InventoryBatch batch,
        int quantityAllocated
) {}