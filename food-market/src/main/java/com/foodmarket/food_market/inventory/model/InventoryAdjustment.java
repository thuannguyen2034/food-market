package com.foodmarket.food_market.inventory.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_adjustments")
@Getter
@Setter
public class InventoryAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "adjustment_id")
    private Long adjustmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private InventoryBatch inventoryBatch;

    /**
     * Tương tự productId, chúng ta chỉ lưu UUID của user.
     * Giảm khớp nối với module User/Auth.
     */
    @Column(name = "adjusted_by_user_id", nullable = false)
    private UUID adjustedByUserId;

    @Column(name = "adjustment_quantity", nullable = false)
    private int adjustmentQuantity; // Có thể là số âm (hủy hàng) hoặc dương (hiếm)

    @Column(name = "reason", nullable = false)
    private String reason; // Lý do điều chỉnh: HONG, HET_HAN, KIEM_KHO,...

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    // Constructors, equals, hashCode...
}