package com.foodmarket.food_market.payment.repository;

import com.foodmarket.food_market.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    /**
     * Tìm thanh toán (payment) bằng ID của đơn hàng (orderId)
     */
    Optional<Payment> findByOrderId(UUID orderId);
}