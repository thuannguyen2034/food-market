package com.foodmarket.food_market.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AdjustStockRequestDTO {

    @NotNull(message = "Batch ID is required")
    private Long batchId;

    private UUID adjustedByUserId;

    @NotNull(message = "Adjustment quantity is required")
    private Integer adjustmentQuantity; 

    @NotEmpty(message = "Reason is required")
    private String reason; 
}