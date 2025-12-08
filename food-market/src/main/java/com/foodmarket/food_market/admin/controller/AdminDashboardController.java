package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.admin.dashboard.dto.projection.OrderStatusStat;
import com.foodmarket.food_market.admin.dashboard.dto.projection.TopProductStat;
import com.foodmarket.food_market.admin.dashboard.dto.response.*;
import com.foodmarket.food_market.order.service.OrderService;
import com.foodmarket.food_market.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')") // Chỉ Admin mới được xem thống kê
@RequiredArgsConstructor
public class AdminDashboardController {

    private final OrderService orderService;
    private final UserService userService;
    /**
     * API Tổng quan: Trả về Doanh thu và Số lượng đơn trong khoảng thời gian
     * Dùng cho các thẻ Stats Card ở đầu Dashboard
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
    ) {
        return ResponseEntity.ok(orderService.getDashboardSummary(startDate, endDate));
    }

    /**
     * Biểu đồ doanh thu theo ngày
     * Endpoint: /api/v1/admin/dashboard/revenue-chart
     */
    @GetMapping("/revenue-chart")
    public ResponseEntity<List<ChartDataDTO>> getRevenueChart(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
    ) {
        return ResponseEntity.ok(orderService.getComparisonChart(startDate, endDate));
    }

    /**
     * Biểu đồ phân bổ trạng thái đơn hàng (Pie Chart)
     * Endpoint: /api/v1/admin/dashboard/order-status
     */
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @GetMapping("/order-status")
    public ResponseEntity<List<OrderStatusResponseDTO>> getOrderStatusDistribution() {
        List<OrderStatusStat> orderStatusStats = orderService.countOrdersByStatus();
        List<OrderStatusResponseDTO> response = orderStatusStats.stream()
                .map(OrderStatusResponseDTO::fromProjection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Top sản phẩm bán chạy
     * Endpoint: /api/v1/admin/dashboard/top-products
     */
    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponseDTO>> getTopSellingProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 5) Pageable pageable // Mặc định lấy top 5
    ) {
        OffsetDateTime start = convertToOffset(startDate);
        OffsetDateTime end = convertToOffset(endDate);
        List<TopProductResponseDTO> response = orderService.findTopSellingProducts(start, end, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/new-users-count")
    public ResponseEntity<Long> getNewUsersCount(){
        return ResponseEntity.ok(userService.countNewUsersInLastDay());
    }

    private OffsetDateTime convertToOffset(LocalDateTime localDateTime) {
        if (localDateTime == null) return null;
        return localDateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }
}