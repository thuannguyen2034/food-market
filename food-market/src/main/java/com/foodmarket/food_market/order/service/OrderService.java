package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.admin.dashboard.dto.projection.DailyRevenueStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.TopProductStat;
import com.foodmarket.food_market.admin.dashboard.dto.response.ChartDataDTO;
import com.foodmarket.food_market.admin.dashboard.dto.response.DashboardSummaryDTO;
import com.foodmarket.food_market.admin.dashboard.dto.response.TopProductResponseDTO;
import com.foodmarket.food_market.order.dto.CheckoutRequestDTO;
import com.foodmarket.food_market.order.dto.OrderFilterDTO;
import com.foodmarket.food_market.order.dto.OrderResponseDTO;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface OrderService {

    OrderResponseDTO placeOrder(UUID userId, CheckoutRequestDTO request);

    Page<OrderResponseDTO> getOrderHistory(UUID userId, OrderStatus status, Pageable pageable);

    OrderResponseDTO getOrderDetails(UUID userId, UUID orderId);

    void updateOrderStatus(UUID orderId, OrderStatus newStatus);


    void cancelOrder(UUID userId, UUID orderId, String reason);
    void systemCancelOrder(UUID orderId, String reason);
    Page<OrderResponseDTO> getAllOrders(OrderFilterDTO filterDTO, Pageable pageable);

    DashboardSummaryDTO getDashboardSummary(OffsetDateTime start, OffsetDateTime end);

    List<ChartDataDTO> getComparisonChart(OffsetDateTime start, OffsetDateTime end);

    List<OrderStatusStat> countOrdersByStatus();
    List<OrderResponseDTO> findUrgentOrders(Pageable pageable);
    List<TopProductResponseDTO> findTopSellingProducts(OffsetDateTime startDate, OffsetDateTime endDate, Pageable pageable);
    OrderResponseDTO getAdminOrderDetails(UUID orderId);
    void updatePaymentStatus(UUID orderId, PaymentStatus newStatus);
}