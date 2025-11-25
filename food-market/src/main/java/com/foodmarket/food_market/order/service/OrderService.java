package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.admin.dashboard.dto.projection.DailyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.TopProductStat;
import com.foodmarket.food_market.admin.dashboard.dto.response.ChartDataDTO;
import com.foodmarket.food_market.admin.dashboard.dto.response.DashboardSummaryDTO;
import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderFilterDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
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


    void cancelOrder(UUID userId, UUID orderId, String reason);

    Page<OrderResponseDTO> getAllOrders(OrderFilterDTO filterDTO, Pageable pageable);
    BigDecimal totalRevenueInAPeriod(OffsetDateTime startDate, OffsetDateTime endDate);
    long countOrderInAPeriod(OffsetDateTime startDate, OffsetDateTime endDate);

    DashboardSummaryDTO getDashboardSummary(OffsetDateTime start, OffsetDateTime end);

    List<ChartDataDTO> getComparisonChart(OffsetDateTime start, OffsetDateTime end);

    List<DailyRevenueStat> getDailyRevenueStats(OffsetDateTime startDate);
    List<OrderStatusStat> countOrdersByStatus();
    List<Order> findUrgentOrders(Pageable pageable);
    List<TopProductStat> findTopSellingProducts(OffsetDateTime startDate, OffsetDateTime endDate,Pageable pageable);

    OrderResponseDTO getAdminOrderDetails(UUID orderId);
}