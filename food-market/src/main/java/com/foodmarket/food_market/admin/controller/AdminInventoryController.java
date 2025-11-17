package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.inventory.dto.AdjustStockRequestDTO;
import com.foodmarket.food_market.inventory.dto.ImportStockRequestDTO;
import com.foodmarket.food_market.inventory.model.InventoryBatch;
import com.foodmarket.food_market.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/inventory") // <-- Base path mới cho admin
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // <-- Áp dụng security cho CẢ CLASS
public class AdminInventoryController {

    private final InventoryService inventoryService;

    /**
     * API 1 (Admin): Nhập hàng (Cộng kho)
     */
    @PostMapping("/batches")
    public ResponseEntity<InventoryBatch> importStockBatch(
            @Valid @RequestBody ImportStockRequestDTO requestDTO) {

        InventoryBatch newBatch = inventoryService.importStock(requestDTO);
        return new ResponseEntity<>(newBatch, HttpStatus.CREATED);
    }

    /**
     * API 2 (Admin): Điều chỉnh kho
     */
    @PostMapping("/adjustments")
    public ResponseEntity<Void> adjustStockBalance(
            @Valid @RequestBody AdjustStockRequestDTO requestDTO) {

        inventoryService.adjustStock(requestDTO);
        return ResponseEntity.ok().build();
    }
}