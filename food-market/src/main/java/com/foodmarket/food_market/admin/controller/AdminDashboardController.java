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
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final OrderService orderService;
    private final UserService userService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDTO> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
    ) {
        return ResponseEntity.ok(orderService.getDashboardSummary(startDate, endDate));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<List<ChartDataDTO>> getRevenueChart(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
    ) {
        return ResponseEntity.ok(orderService.getComparisonChart(startDate, endDate));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @GetMapping("/order-status")
    public ResponseEntity<List<OrderStatusResponseDTO>> getOrderStatusDistribution() {
        List<OrderStatusStat> orderStatusStats = orderService.countOrdersByStatus();
        List<OrderStatusResponseDTO> response = orderStatusStats.stream()
                .map(OrderStatusResponseDTO::fromProjection)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponseDTO>> getTopSellingProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 5) Pageable pageable
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