package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.inventory.dto.*;
import com.foodmarket.food_market.inventory.model.InventoryBatch;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.user.model.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/inventory") // <-- Base path mới cho admin
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // <-- Áp dụng security cho CẢ CLASS
public class AdminInventoryController {

    private final InventoryService inventoryService;

    /**
     * API 1 (Admin): Nhập hàng (Cộng kho)
     */
    @PostMapping("/import")
    public ResponseEntity<InventoryBatchDTO> importStockBatch(
            @Valid @RequestBody ImportStockRequestDTO requestDTO) {
        // Lưu ý: userId thực hiện nhập hàng có thể lấy từ token nếu cần lưu vết người nhập ban đầu
        InventoryBatchDTO response = inventoryService.importStock(requestDTO);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * API 2 (Admin): Điều chỉnh kho
     */
    @PostMapping("/adjustments")
    public ResponseEntity<Void> adjustStock(
            @Valid @RequestBody AdjustStockRequestDTO requestDTO) {

        // Security: Ghi đè userId bằng người đang đăng nhập để đảm bảo tính trung thực
        UUID currentAdminId = getCurrentUserId();
        requestDTO.setAdjustedByUserId(currentAdminId);

        inventoryService.adjustStock(requestDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{batchId}")
    public ResponseEntity<InventoryBatchDTO> getBatchDetails(@PathVariable Long batchId) {
        return ResponseEntity.ok(inventoryService.getBatchDetails(batchId));
    }

    /**
     * API: Lấy danh sách lô hàng (Có lọc theo ngày hết hạn)
     * Sửa lỗi: Thêm @RequestParam và sửa kiểu trả về thành Page
     */
    @GetMapping("")
    public ResponseEntity<Page<InventoryBatchDTO>> getInventoryBatches(
            @PageableDefault(size = 20, sort = "expirationDate", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestParam(required = false) Integer daysThreshold // null = lấy tất cả
    ) {
        return ResponseEntity.ok(inventoryService.getInventoryBatches(pageable, daysThreshold));
    }

    /**
     * API: Hủy lô hàng (Destroy)
     */
    @PostMapping("/{batchId}/destroy")
    public ResponseEntity<Void> destroyBatch(
            @PathVariable Long batchId,
            @RequestBody InventoryDestroyRequestDTO requestDTO) {

        UUID currentAdminId = getCurrentUserId();
        inventoryService.destroyBatch(batchId, requestDTO.getReason(), currentAdminId.toString());
        return ResponseEntity.ok().build();
    }

    /**
     * API: Xem lịch sử điều chỉnh của 1 lô
     * Sửa lỗi: Thêm tham số Pageable và cú pháp gọi hàm
     */
    @GetMapping("/{batchId}/adjustments")
    public ResponseEntity<Page<InventoryAdjustmentDTO>> getAdjustments(
            @PathVariable Long batchId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(inventoryService.getAdjustmentsForBatch(batchId, pageable));
    }
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // Giả sử Principal của bạn là User Entity hoặc Custom UserDetails có getUserId()
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return ((User) authentication.getPrincipal()).getUserId(); // hoặc .getUserId() tuỳ entity của bạn
        }
        // Fallback hoặc throw exception nếu không lấy được user
        throw new IllegalStateException("User not authenticated correctly");
    }

}