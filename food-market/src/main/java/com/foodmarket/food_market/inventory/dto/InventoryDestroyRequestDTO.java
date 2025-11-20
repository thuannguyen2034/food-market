package com.foodmarket.food_market.inventory.dto;

import lombok.Data;

@Data
public class InventoryDestroyRequestDTO {
    int adjustmentQuantity;
    String reason;
}
