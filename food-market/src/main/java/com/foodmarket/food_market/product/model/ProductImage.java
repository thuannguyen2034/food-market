package com.foodmarket.food_market.product.model; 

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_images")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name = "image_url", nullable = false)
    private String imageUrl; 

    @Column(name = "public_id", nullable = false)
    private String publicId; 

    @Column(name="display_order", nullable = false)
    private Integer displayOrder = 0; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
}