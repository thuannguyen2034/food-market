package com.foodmarket.food_market.product.model; // (Hoặc package model của bạn)

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
    private String imageUrl; // URL từ Cloudinary (secure_url)

    @Column(name = "public_id", nullable = false)
    private String publicId; // public_id từ Cloudinary (để xóa)

    @Column(name="display_order", nullable = false)
    private Integer displayOrder = 0; // Thứ tự hiển thị (0 là ảnh chính)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
}