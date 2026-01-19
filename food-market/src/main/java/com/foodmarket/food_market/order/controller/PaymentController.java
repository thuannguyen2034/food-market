package com.foodmarket.food_market.order.controller;

import com.foodmarket.food_market.order.dto.IpnResponseDTO;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import com.foodmarket.food_market.order.repository.OrderRepository;
import com.foodmarket.food_market.shared.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j 
public class PaymentController {

    private final VnPayService vnPayService;
    private final OrderRepository orderRepository;

    @GetMapping("/create_payment")
    public ResponseEntity<?> createPayment(
            @RequestParam("orderId") UUID orderId,
            HttpServletRequest request
    ) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return ResponseEntity.badRequest().body("Đơn hàng đã được thanh toán");
        }

        String paymentUrl = vnPayService.createPaymentUrl(order, request);

        return ResponseEntity.ok(Collections.singletonMap("url", paymentUrl));
    }

    @GetMapping("/vnpay_ipn")
    @Transactional
    public ResponseEntity<IpnResponseDTO> vnpayIpn(HttpServletRequest request) {
        try {
            int checksumResult = vnPayService.verifyIpn(request);
            if (checksumResult != 1) {
                return ResponseEntity.ok(new IpnResponseDTO("97", "Invalid Checksum"));
            }

            // 2. Lấy tham số
            String vnp_TxnRef = request.getParameter("vnp_TxnRef");
            String vnp_ResponseCode = request.getParameter("vnp_ResponseCode");
            String vnp_TransactionStatus = request.getParameter("vnp_TransactionStatus"); // [MỚI] Thêm cái này
            String vnp_Amount = request.getParameter("vnp_Amount");

            // 3. Tìm đơn hàng
            UUID orderId;
            try {
                orderId = UUID.fromString(vnp_TxnRef);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.ok(new IpnResponseDTO("01", "Order not found"));
            }
            Order order = orderRepository.findById(orderId).orElse(null);

            // 4. Validate dữ liệu
            if (order == null) return ResponseEntity.ok(new IpnResponseDTO("01", "Order not found"));

            long vnpAmountValue = Long.parseLong(vnp_Amount) / 100;
            if (vnpAmountValue != order.getTotalAmount().longValue()) {
                return ResponseEntity.ok(new IpnResponseDTO("04", "Invalid Amount"));
            }

            if (order.getPaymentStatus() == PaymentStatus.PAID) {
                return ResponseEntity.ok(new IpnResponseDTO("02", "Đơn hàng đã được thanh toán"));
            }

            // 5. Xử lý kết quả 
            if ("00".equals(vnp_ResponseCode) && "00".equals(vnp_TransactionStatus)) {

                order.setPaymentStatus(PaymentStatus.PAID);
                order.setPaymentDate(LocalDateTime.now());
                orderRepository.save(order);
                log.info("Thanh toán thành công cho đơn hàng: {}", orderId);

                return ResponseEntity.ok(new IpnResponseDTO("00", "Confirm Success"));
            } else {
                // Giao dịch thất bại
                order.setPaymentStatus(PaymentStatus.FAILED);
                orderRepository.save(order);
                log.info("Failed payment for order: {}", orderId);

                return ResponseEntity.ok(new IpnResponseDTO("00", "Confirm Success"));
            }

        } catch (Exception e) {
            log.error("IPN Error", e);
            return ResponseEntity.ok(new IpnResponseDTO("99", "Unknown Error"));
        }
    }
}