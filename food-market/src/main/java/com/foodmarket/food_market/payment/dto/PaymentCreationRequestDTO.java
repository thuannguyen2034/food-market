package com.foodmarket.food_market.payment.dto;

import com.foodmarket.food_market.order.model.Order;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO này được OrderService sử dụng để yêu cầu PaymentService
 * tạo ra một thanh toán đang chờ xử lý (pending payment).
 */
@Data
@AllArgsConstructor // Tạo constructor cho tiện
public class PaymentCreationRequestDTO {

    // Gửi luôn đối tượng Order (hoặc chỉ OrderId nếu muốn)
    private Order order;

    private String paymentMethod; // "COD", "VNPAY", "MOMO"

    private BigDecimal totalAmount;
}