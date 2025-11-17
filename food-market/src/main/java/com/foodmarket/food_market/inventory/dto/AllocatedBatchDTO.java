package com.foodmarket.food_market.inventory.dto;

import com.foodmarket.food_market.inventory.model.InventoryBatch;

/**
 * Một Record đơn giản để trả về thông tin lô đã được phân bổ
 * cho OrderService.
 *
 * @param batch Lô hàng (Entity) đã bị trừ kho
 * @param quantityAllocated Số lượng đã lấy từ lô này
 */
public record AllocatedBatchDTO(
        InventoryBatch batch,
        int quantityAllocated
) {}