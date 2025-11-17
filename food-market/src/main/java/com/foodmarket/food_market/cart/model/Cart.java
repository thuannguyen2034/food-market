package com.foodmarket.food_market.cart.model;

import com.foodmarket.food_market.user.model.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "carts")
@Getter
@Setter
@NoArgsConstructor
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Dùng UUID
    @Column(name = "cart_id")
    private UUID id;

    // Mối quan hệ 1-1 với User
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true) // Cột user_id là duy nhất
    private User user;

    @Column(name = "last_updated")
    private OffsetDateTime lastUpdated;

    // Mối quan hệ 1-N với CartItems
    @OneToMany(
            mappedBy = "cart",
            cascade = CascadeType.ALL, // Xóa Cart thì xóa hết CartItem
            orphanRemoval = true // Xóa item khỏi Set thì xóa luôn trong DB
    )
    private Set<CartItem> items = new HashSet<>();

    // --- Hàm tiện ích (Helper Methods) ---
    public void addItem(CartItem item) {
        items.add(item);
        item.setCart(this);
        this.lastUpdated = OffsetDateTime.now();
    }

    public void removeItem(CartItem item) {
        items.remove(item);
        item.setCart(null);
        this.lastUpdated = OffsetDateTime.now();
    }
}