package com.foodmarket.food_market.order.model;

import com.foodmarket.food_market.order.model.enums.DeliveryTimeSlot;
import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.model.enums.PaymentMethod;
import com.foodmarket.food_market.order.model.enums.PaymentStatus;
import com.foodmarket.food_market.user.model.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Dùng UUID
    @Column(name = "order_id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;


    @Column(name = "delivery_address_snapshot", nullable = false, columnDefinition = "TEXT")
    private String deliveryAddressSnapshot; // Chụp nhanh địa chỉ

    @Column(name = "delivery_phone_snapshot", nullable = false)
    private String deliveryPhoneSnapshot;

    @Column(name = "delivery_recipient_name_snapshot")
    private String deliveryRecipientNameSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_timeslot", length = 20)
    private DeliveryTimeSlot deliveryTimeslot;

    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;


    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private Set<OrderItem> items = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}