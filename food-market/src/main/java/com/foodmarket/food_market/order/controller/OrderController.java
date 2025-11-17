package com.foodmarket.food_market.order.controller;

import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.service.OrderService;
import com.foodmarket.food_market.user.model.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')") // Chỉ Customer
public class OrderController {

    private final OrderService orderService;

    /**
     * API Checkout - Đặt hàng
     */
    @PostMapping
    public ResponseEntity<OrderResponseDTO> placeOrder(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        OrderResponseDTO order = orderService.placeOrder(user.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * API Lấy lịch sử đơn hàng
     */
    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getMyOrderHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderHistory(user.getUserId()));
    }

    /**
     * API Lấy chi tiết 1 đơn hàng
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getMyOrderDetails(
            Authentication authentication,
            @PathVariable UUID orderId
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderDetails(user.getUserId(), orderId));
    }
}