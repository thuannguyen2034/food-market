package com.foodmarket.food_market.payment.controller;

import com.foodmarket.food_market.payment.dto.PaymentRequestDTO;
import com.foodmarket.food_market.payment.dto.PaymentResponseDTO;
import com.foodmarket.food_market.payment.service.PaymentService;
import com.foodmarket.food_market.user.model.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * API 1: (Cho Client) Tạo URL thanh toán VNPay.
     * Cần xác thực (đã đăng nhập).
     */
    @PostMapping("/create-url")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PaymentResponseDTO> createPaymentUrl(
            Authentication authentication,
            @Valid @RequestBody PaymentRequestDTO request,
            HttpServletRequest httpServletRequest // Cần để lấy IP
    ) {
        User user = (User) authentication.getPrincipal();
        PaymentResponseDTO response = paymentService.createPaymentUrl(
                request,
                user.getUserId(),
                httpServletRequest
        );
        return ResponseEntity.ok(response);
    }

    /**
     * API 2: (Cho VNPay Server) Nhận Callback (IPN).
     * Phải public (permitAll).
     * * VNPay sẽ gọi API này bằng phương thức GET với các query params.
     */
    @GetMapping("/vnpay/callback")
    @PreAuthorize("permitAll()") // Không cần xác thực
    public ResponseEntity<String> handleVnPayCallback(
            @RequestParam Map<String, String> vnpayParams
    ) {
        String response = paymentService.processVnPayCallback(vnpayParams);
        // Trả về response dạng text/json mà VNPay mong muốn
        return ResponseEntity.ok(response);
    }
}