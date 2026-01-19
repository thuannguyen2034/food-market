package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.order.dto.OrderFilterDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.dto.UpdateOrderStatusDTO;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import com.foodmarket.food_market.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')") 
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping("")
    public ResponseEntity<Page<OrderResponseDTO>> getAllOrders(
            @ModelAttribute OrderFilterDTO filterDTO,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(orderService.getAllOrders(filterDTO, pageable));
    }
    @GetMapping("/urgent")
    public ResponseEntity<List<OrderResponseDTO>> getUrgentOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        List<OrderResponseDTO> response = orderService.findUrgentOrders(pageable);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getOrderDetails(@PathVariable UUID orderId) {
        return ResponseEntity.ok(orderService.getAdminOrderDetails(orderId));
    }
    @PutMapping("/{orderId}/status")
    public ResponseEntity<Void> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody UpdateOrderStatusDTO request 
    ) {
       orderService.updateOrderStatus(orderId, request.getNewStatus());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{orderId}/payment-status")
    public ResponseEntity<Void> updatePaymentStatus(
            @PathVariable UUID orderId,
            @RequestBody Map<String, String> payload
    ) {
        String statusStr = payload.get("paymentStatus");
        PaymentStatus newStatus = PaymentStatus.valueOf(statusStr);
        orderService.updatePaymentStatus(orderId, newStatus);
        return ResponseEntity.ok().build();
    }
}