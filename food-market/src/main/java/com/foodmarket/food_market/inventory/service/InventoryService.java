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
    Page<InventoryAdjustmentDTO> getAllAdjustments(Pageable pageable);
    // Cao ưu tiên 3: destroyBatch
    void destroyBatch(Long batchId, String reason, String userId);


    InventoryBatchDTO importStock(ImportStockRequestDTO requestDTO, UUID currentAdminId);

    /**
     * Phân bổ kho cho Đơn hàng (Logic FEFO).
     */
    List<AllocatedBatchDTO> allocateForOrder(Long productId, int quantityToAllocate, UUID userId,UUID orderId);
    /**
    Điều chỉnh kho.
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

    void restoreStock(Long batchId, int quantityToRestore, UUID userId, UUID orderId);
}