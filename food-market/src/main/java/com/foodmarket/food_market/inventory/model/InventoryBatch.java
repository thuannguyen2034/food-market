package com.foodmarket.food_market.inventory.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "inventory_batches")
@Getter
@Setter
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    private Long batchId;

    /**
     * Chỉ lưu ID của sản phẩm, không dùng @ManyToOne.
     * Đây là triết lý Modular Monolith để giảm khớp nối (decoupling)
     * giữa module Inventory và module Product/Catalog.
     */
    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_code")
    private String batchCode; // Mã lô hàng nội bộ hoặc của nhà cung cấp

    @CreationTimestamp
    @Column(name = "received_date", nullable = false, updatable = false)
    private OffsetDateTime receivedDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate; // Chỉ cần ngày, không cần giờ

    @Column(name = "quantity_received", nullable = false)
    private int quantityReceived; // Số lượng ban đầu khi nhập

    @Column(name = "current_quantity", nullable = false)
    private int currentQuantity; // Số lượng thực tế còn lại trong kho

    /**
     * Một lô hàng có thể có nhiều lần điều chỉnh (hỏng, mất, v.v.)
     */
    @OneToMany(mappedBy = "inventoryBatch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryAdjustment> adjustments;

    // Constructors, equals, hashCode...
}