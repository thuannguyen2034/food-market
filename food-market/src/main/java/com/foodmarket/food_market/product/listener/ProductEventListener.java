package com.foodmarket.food_market.product.listener;

import com.foodmarket.food_market.order.event.OrderStatusChangedEvent;
import com.foodmarket.food_market.order.model.OrderItem;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.repository.OrderItemRepository;
import com.foodmarket.food_market.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductEventListener {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderStatusChanged(OrderStatusChangedEvent event) {

        if (event.getNewStatus() == OrderStatus.CONFIRMED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(event.getOrder().getId());

            items.forEach(item ->
                    productRepository.incrementSoldCount(item.getProductIdSnapshot(), item.getQuantity())
            );
        }
    }
}
