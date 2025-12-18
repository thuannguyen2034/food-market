package com.foodmarket.food_market.recipe.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String imageUrl;

    @Column(columnDefinition = "TEXT")
    String cookingSteps;

    @Column(columnDefinition = "TEXT")
    String ingredients;

    String tags;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    List<RecipeProduct> products = new ArrayList<>();

    // Helper method để thêm product dễ dàng (Pragmatic DDD)
    public void addProduct(Long productId) {
        RecipeProduct link = RecipeProduct.builder()
                .recipe(this)
                .productId(productId)
                .build();
        this.products.add(link);
    }

    // Sửa trong class Recipe.java hoặc Helper của bạn

    public void updateProducts(List<Long> newProductIds) {
        if (newProductIds == null) {
            this.products.clear();
            return;
        }

        // 1. Tìm các sản phẩm cần XÓA (Có trong DB nhưng không có trong request mới)
        // Dùng removeIf để xóa trực tiếp trên collection hiện tại (Hibernate sẽ tự track và delete)
        this.products.removeIf(rp -> !newProductIds.contains(rp.getProductId()));

        // 2. Tìm các sản phẩm cần THÊM (Có trong request mới nhưng chưa có trong DB)
        // Lấy danh sách ID hiện tại
        Set<Long> existingProductIds = this.products.stream()
                .map(RecipeProduct::getProductId)
                .collect(Collectors.toSet());

        newProductIds.stream()
                .filter(id -> !existingProductIds.contains(id)) // Chỉ lấy cái chưa có
                .forEach(this::addProduct); // Thêm mới
    }
}