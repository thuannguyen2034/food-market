package com.foodmarket.food_market.payment.service;

import com.foodmarket.food_market.payment.dto.PaymentCreationRequestDTO;
import com.foodmarket.food_market.payment.dto.PaymentRequestDTO;
import com.foodmarket.food_market.payment.dto.PaymentResponseDTO;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;
import java.util.UUID;

public interface PaymentService {
    /**
     * (MỚI) Tạo một thanh toán đang chờ (pending) khi đơn hàng vừa được tạo.
     * Được gọi bởi OrderService.
     */
    void createPendingPayment(PaymentCreationRequestDTO request);

    /**
     * API 1: Tạo URL thanh toán cho Client
     */
    PaymentResponseDTO createPaymentUrl(PaymentRequestDTO request, UUID userId, HttpServletRequest httpServletRequest);

    /**
     * API 2: Xử lý Callback (IPN) từ VNPay
     * Trả về String response cho VNPay server
     */
    String processVnPayCallback(Map<String, String> vnpayParams);
}