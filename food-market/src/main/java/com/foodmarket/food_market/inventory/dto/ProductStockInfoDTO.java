package com.foodmarket.food_market.inventory.dto;

import java.time.LocalDate;
import java.util.Optional;

/**
 * DTO chứa thông tin tồn kho và HSD (Hạn sử dụng)
 * mà InventoryService cung cấp cho các module khác (như ProductService).
 *
 * @param totalAvailableStock Tổng số lượng còn hàng.
 * @param soonestExpirationDate HSD sớm nhất (nếu còn hàng).
 */
public record ProductStockInfoDTO(
        int totalAvailableStock,
        LocalDate soonestExpirationDate
) {
    // Chúng ta dùng Optional vì sản phẩm có thể hết hàng (stock=0)
    // và do đó không có "HSD sớm nhất".
}