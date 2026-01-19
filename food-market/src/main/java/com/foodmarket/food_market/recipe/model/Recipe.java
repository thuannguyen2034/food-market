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

    public void addProduct(Long productId) {
        RecipeProduct link = RecipeProduct.builder()
                .recipe(this)
                .productId(productId)
                .build();
        this.products.add(link);
    }

    public void updateProducts(List<Long> newProductIds) {
        if (newProductIds == null) {
            this.products.clear();
            return;
        }

        this.products.removeIf(rp -> !newProductIds.contains(rp.getProductId()));

        Set<Long> existingProductIds = this.products.stream()
                .map(RecipeProduct::getProductId)
                .collect(Collectors.toSet());

        newProductIds.stream()
                .filter(id -> !existingProductIds.contains(id))
                .forEach(this::addProduct);
    }
}