package com.foodmarket.food_market.inventory.service;

import com.foodmarket.food_market.inventory.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface InventoryService {

    Page<InventoryBatchDTO> getBatchesForProduct(Long productId, boolean includeZeroQuantity, Pageable pageable);

    InventoryBatchDTO getBatchDetails(Long batchId);

    Page<InventoryBatchDTO> getInventoryBatches(Pageable pageable, Integer daysThreshold);

    Page<InventoryAdjustmentDTO> getAdjustmentsForBatch(Long batchId, Pageable pageable);

    // Cao ưu tiên 3: destroyBatch
    void destroyBatch(Long batchId, String reason, String userId);

    /**
     * Nghiệp vụ 1: Nhập hàng (Cộng kho).
     * Tạo một lô hàng mới trong kho.
     *
     * @param requestDTO Thông tin lô hàng mới.
     * @return Lô hàng vừa được tạo.
     */
    InventoryBatchDTO importStock(ImportStockRequestDTO requestDTO);

    /**
     * Nghiệp vụ 2 (Nâng cấp): Phân bổ kho cho Đơn hàng (Logic FEFO).
     *
     * Được gọi bởi OrderService. Tự động trừ kho (FEFO) và trả về
     * danh sách các lô đã bị trừ.
     *
     * @param productId Mã sản phẩm cần trừ.
     * @param quantityToAllocate Số lượng cần trừ.
     * @return Danh sách các lô đã phân bổ (và số lượng lấy từ lô đó).
     * @throws com.foodmarket.food_market.inventory.exception.InsufficientStockException Nếu không đủ hàng.
     */
    List<AllocatedBatchDTO> allocateForOrder(Long productId, int quantityToAllocate, UUID userId,UUID orderId);
    /**
     * Nghiệp vụ 3: Điều chỉnh kho.
     * Dùng để sửa kho thủ công (hàng hỏng, mất, kiểm kho).
     *
     * @param requestDTO Thông tin điều chỉnh.
     */
    void adjustStock(AdjustStockRequestDTO requestDTO);

    /**
     * Nghiệp vụ 4: Kiểm tra tồn kho.
     * Trả về tổng số lượng tồn kho của một sản phẩm.
     *
     * @param productId Mã sản phẩm.
     * @return Tổng số lượng có sẵn (từ tất cả các lô).
     */
    int getStockAvailability(Long productId);
    /**
     * Lấy thông tin tồn kho và HSD (Hạn sử dụng) cho ProductService.
     * Dùng để tính giá động.
     *
     * @param productId Mã sản phẩm.
     * @return DTO chứa tổng tồn kho và HSD sớm nhất (nếu có).
     */
    ProductStockInfoDTO getProductStockInfo(Long productId);

    long countExpiringBatches(LocalDate thresholdDate);
    void restoreStock(Long batchId, int quantityToRestore, UUID userId, UUID orderId);
}