package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.enums.OrderStatus;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class OrderFilterDTO {
    // Lọc theo khoảng thời gian tạo đơn
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateTo;

    private List<OrderStatus> statuses;

    private List<Long> productIds;

    private String keyword;

    private UUID userId;
}