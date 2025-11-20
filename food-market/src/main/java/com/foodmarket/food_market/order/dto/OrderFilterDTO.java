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

    // Lọc theo trạng thái (List để chọn nhiều status cùng lúc)
    private List<OrderStatus> statuses;

    // Lọc đơn hàng có chứa các sản phẩm này (Ví dụ: Lọc đơn có bán "Sầu riêng")
    private List<Long> productIds;

    // Lọc theo thông tin khách hàng (Tên, SĐT, Email) hoặc Mã đơn hàng
    private String keyword;

    // Lọc chính xác ID khách hàng (nếu bấm từ trang User Details)
    private UUID userId;
}