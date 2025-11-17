package com.foodmarket.food_market.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "dynamic_pricing_rules")
@Getter @Setter @NoArgsConstructor
public class DynamicPricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Long id;

    @Column(name = "days_remaining_trigger", nullable = false)
    private int daysRemainingTrigger; // Kích hoạt khi HSD còn <= X ngày

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage; // % giảm giá (ví dụ: 0.30 cho 30%)

    @Column(name = "priority")
    private int priority; // Ưu tiên (chưa dùng, nhưng có thể cần)
}