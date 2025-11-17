package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.admin.service.AdminOrderService;
import com.foodmarket.food_market.order.dto.UpdateOrderStatusDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'SHIPPER')") // (Shipper cũng dùng)
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService; // Service mới

    /**
     * API Cốt lõi: Cập nhật trạng thái đơn hàng
     * (Shipper/Admin sẽ gọi)
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody UpdateOrderStatusDTO request // DTO mới
    ) {
        adminOrderService.updateOrderStatus(orderId, request.getNewStatus());
        return ResponseEntity.ok().build();
    }
}