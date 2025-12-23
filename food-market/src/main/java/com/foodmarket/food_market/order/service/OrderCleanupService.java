package com.foodmarket.food_market.order.service;

import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.model.enums.PaymentMethod;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import com.foodmarket.food_market.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    /**
     * Tìm các đơn hàng thanh toán Online (VNPAY) đang PENDING quá 15 phút chưa thanh toán để huỷ.
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cancelUnpaidOrders() {
        log.info("Bắt đầu quét đơn hàng treo...");
        OffsetDateTime timeoutThreshold = OffsetDateTime.now().minusMinutes(15);
        List<Order> expiredOrders = orderRepository.findExpiredOrders(
                OrderStatus.PENDING,
                PaymentMethod.VNPAY,
                PaymentStatus.PAID,
                timeoutThreshold
        );

        for (Order order : expiredOrders) {
            try {
                log.info("Tự động huỷ đơn hàng treo: {}", order.getId());
                orderService.systemCancelOrder(order.getId(), "Hệ thống: hết hạn thanh toán online, huỷ đơn và trả về kho");

            } catch (Exception e) {
                log.error("Lỗi khi huỷ đơn hàng {}", order.getId(), e);
            }
        }
    }
}