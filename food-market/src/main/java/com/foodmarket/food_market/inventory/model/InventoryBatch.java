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

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_code")
    private String batchCode;

    @CreationTimestamp
    @Column(name = "received_date", nullable = false, updatable = false)
    private OffsetDateTime receivedDate;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Column(name = "quantity_received", nullable = false)
    private int quantityReceived;
    @Column(name = "current_quantity", nullable = false)
    private int currentQuantity;

    /**
     * Một lô hàng có thể có nhiều lần điều chỉnh (hỏng, mất, v.v.)
     */
    @OneToMany(mappedBy = "inventoryBatch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryAdjustment> adjustments;
}