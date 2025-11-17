package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;

import java.util.List;
import java.util.UUID;

public interface OrderService {

    /** Đặt hàng (chuyển từ Cart -> Order) */
    OrderResponseDTO placeOrder(UUID userId, CheckoutRequestDTO request);

    /** Lấy lịch sử đơn hàng */
    List<OrderResponseDTO> getOrderHistory(UUID userId);

    /** Lấy chi tiết 1 đơn hàng */
    OrderResponseDTO getOrderDetails(UUID userId, UUID orderId);
}