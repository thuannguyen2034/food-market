package com.foodmarket.food_market.order.dto;

import com.foodmarket.food_market.order.model.Order;
import com.foodmarket.food_market.order.model.enums.DeliveryTimeSlot;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.model.enums.PaymentMethod;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
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
    private String deliveryName;
    private OffsetDateTime createdAt;
    private LocalDate deliveryDate;
    private DeliveryTimeSlot deliveryTimeSlot;
    private String note;
    private List<OrderItemResponseDTO> items;
    private PaymentMethod paymentMethod; // Enum
    private PaymentStatus paymentStatus; // Enum
    private LocalDateTime paymentDate;
    public static OrderResponseDTO fromEntity(Order order, Set<Long> reviewedProductIds) {
        return OrderResponseDTO.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .deliveryAddress(order.getDeliveryAddressSnapshot())
                .deliveryPhone(order.getDeliveryPhoneSnapshot())
                .deliveryName(order.getDeliveryRecipientNameSnapshot())
                .createdAt(order.getCreatedAt())
                .deliveryDate(order.getDeliveryDate())
                .deliveryTimeSlot(order.getDeliveryTimeslot())
                .note(order.getNote())
                .items(order.getItems().stream()
                        .map(orderItem -> {
                            boolean isReviewed = reviewedProductIds.contains(orderItem.getProductIdSnapshot());
                            return OrderItemResponseDTO.fromEntity(orderItem, isReviewed);
                        })
                        .collect(Collectors.toList()))
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .paymentDate(order.getPaymentDate())
                .build();
    }
}