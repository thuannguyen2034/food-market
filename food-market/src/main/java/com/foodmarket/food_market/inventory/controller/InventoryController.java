package com.foodmarket.food_market.inventory.controller;

import com.foodmarket.food_market.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/inventory") 
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/products/{productId}/availability")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Object>> getProductStockAvailability(
            @PathVariable Long productId) {

        int totalStock = inventoryService.getStockAvailability(productId);
        Map<String, Object> response = Map.of(
                "productId", productId,
                "availableStock", totalStock
        );
        return ResponseEntity.ok(response);
    }
}