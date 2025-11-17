package com.foodmarket.food_market.category.model;

import com.foodmarket.food_market.product.model.Product; // Sẽ tạo sau
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Vì là BIGSERIAL
    @Column(name = "category_id")
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(name = "slug", unique = true, nullable = false)
    private String slug;

    // --- Mối quan hệ tự tham chiếu (Parent) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id") // Tên cột FK trong DB
    private Category parent;

    // --- Mối quan hệ tự tham chiếu (Children) ---
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Category> children = new HashSet<>();

    // --- Mối quan hệ với Product (Để kiểm tra khi xóa) ---
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private Set<Product> products = new HashSet<>();

    // --- Các hàm tiện ích (Helper Methods) ---
    public void addChild(Category child) {
        this.children.add(child);
        child.setParent(this);
    }

    public void removeChild(Category child) {
        this.children.remove(child);
        child.setParent(null);
    }
}