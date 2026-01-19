package com.foodmarket.food_market.inventory.dto;

import java.time.LocalDate;

public record ProductStockInfoDTO(
        int totalAvailableStock,
        LocalDate soonestExpirationDate
) {

}