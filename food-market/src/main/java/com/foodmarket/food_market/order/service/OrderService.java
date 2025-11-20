package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.admin.dashboard.projectionDto.DailyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.projectionDto.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.projectionDto.TopProductStat;
import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderFilterDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OrderService {

    /** Đặt hàng (chuyển từ Cart -> Order) */
    OrderResponseDTO placeOrder(UUID userId, CheckoutRequestDTO request);

    /** Lấy lịch sử đơn hàng */
    List<OrderResponseDTO> getOrderHistory(UUID userId);

    /** Lấy chi tiết 1 đơn hàng */
    OrderResponseDTO getOrderDetails(UUID userId, UUID orderId);

    //Admin
    void updateOrderStatus(UUID orderId, OrderStatus newStatus);
    Page<OrderResponseDTO> getAllOrders(OrderFilterDTO filterDTO, Pageable pageable);
    BigDecimal totalRevenueInAPeriod(LocalDateTime startDate, LocalDateTime endDate);
    long countOrderInAPeriod(LocalDateTime startDate, LocalDateTime endDate);
    List<DailyRevenueStat> getDailyRevenueStats(LocalDateTime startDate, List<OrderStatus> statusList);
    List<OrderStatusStat> countOrdersByStatus();
    List<Order> findUrgentOrders(List<OrderStatus> urgentStatuses,Pageable pageable);
    List<TopProductStat> findTopSellingProducts(LocalDateTime startDate, LocalDateTime endDate,List<OrderStatus> statusList,Pageable pageable);
}