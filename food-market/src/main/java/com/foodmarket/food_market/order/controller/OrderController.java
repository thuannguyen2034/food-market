package com.foodmarket.food_market.order.controller;

import com.foodmarket.food_market.order.dto.CancelOrderRequestDTO;
import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.service.OrderService;
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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponseDTO> placeOrder(
            Authentication authentication,
            @Valid @RequestBody CheckoutRequestDTO request
    ) {
        User user = (User) authentication.getPrincipal();
        OrderResponseDTO order = orderService.placeOrder(user.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

   
    @GetMapping
    public ResponseEntity<Page<OrderResponseDTO>> getMyOrderHistory(
            Authentication authentication,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderHistory(user.getUserId(), status, pageable));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponseDTO> getMyOrderDetails(
            Authentication authentication,
            @PathVariable UUID orderId
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrderDetails(user.getUserId(), orderId));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<Void> cancelOrder(
            Authentication authentication,
            @PathVariable UUID orderId,
            @RequestBody CancelOrderRequestDTO request 
    ) {
        User user = (User) authentication.getPrincipal();
        orderService.cancelOrder(user.getUserId(), orderId, request.getReason());
        return ResponseEntity.ok().build();
    }
}