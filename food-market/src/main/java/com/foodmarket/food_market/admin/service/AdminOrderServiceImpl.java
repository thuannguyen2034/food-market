package com.foodmarket.food_market.admin.service;

import com.foodmarket.food_market.order.event.OrderStatusChangedEvent;
import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.repository.OrderRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements AdminOrderService {

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher; // "Cái loa"

    @Override
    @Transactional
    public void updateOrderStatus(UUID orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Order"));

        order.setStatus(newStatus);
        orderRepository.save(order);

        // BẮN SỰ KIỆN (LA LÊN)
        // Dùng @TransactionalEventListener ở bên kia sẽ bắt được
        eventPublisher.publishEvent(new OrderStatusChangedEvent(order, newStatus));
    }
}