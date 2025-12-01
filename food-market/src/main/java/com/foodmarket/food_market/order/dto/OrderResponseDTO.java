package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.OrderItem;
import com.foodmarket.food_market.order.model.enums.DeliveryTimeSlot;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
public class OrderResponseDTO {
    private UUID orderId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private String deliveryPhone;
    private OffsetDateTime createdAt;
    private DeliveryTimeSlot deliveryTimeSlot;
    private String note;
    private List<OrderItemResponseDTO> items;

    public static OrderResponseDTO fromEntity(Order order) {
        return OrderResponseDTO.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddressSnapshot())
                .deliveryPhone(order.getDeliveryPhoneSnapshot())
                .createdAt(order.getCreatedAt())
                .deliveryTimeSlot(order.getDeliveryTimeslot())
                .note(order.getNote())
                .items(order.getItems().stream()
                        .map(OrderItemResponseDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}