package com.foodmarket.food_market.inventory.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AdjustStockRequestDTO {

    @NotNull(message = "Batch ID is required")
    private Long batchId;

    @NotNull(message = "Adjusted by User ID is required")
    private UUID adjustedByUserId;

    @NotNull(message = "Adjustment quantity is required")
    private Integer adjustmentQuantity; // Âm (-) để trừ kho, Dương (+) để cộng

    @NotEmpty(message = "Reason is required")
    private String reason; // Ví dụ: HONG_VO, HET_HAN, KIEM_KHO
}