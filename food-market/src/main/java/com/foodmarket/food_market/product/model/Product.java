package com.foodmarket.food_market.product.model;

import com.foodmarket.food_market.category.model.Category;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @OneToMany(
            mappedBy = "product", // Tên trường 'product' trong ProductImage
            cascade = CascadeType.ALL, // Lưu, xóa, cập nhật... sẽ tự động lan sang ProductImage
            orphanRemoval = true, // Xóa ProductImage nếu nó bị gỡ khỏi list này
            fetch = FetchType.EAGER // Load ảnh ngay khi load product (hoặc LAZY nếu muốn)
    )
    @OrderBy("displayOrder ASC") // Luôn sắp xếp ảnh theo thứ tự
    private List<ProductImage> images = new ArrayList<>();

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit; // Ví dụ: "kg", "g", "bó", "vỉ"

    @Column(name = "slug", unique = true, nullable = false)
    private String slug;

    // --- Mối quan hệ với Category ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // --- Mối quan hệ với Tags (Many-to-Many) ---
    @ManyToMany(cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
            name = "product_tags",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    // --- Hàm tiện ích (Helper Methods) ---
    public void addTag(Tag tag) {
        this.tags.add(tag);
        tag.getProducts().add(this);
    }

    public void removeTag(Tag tag) {
        this.tags.remove(tag);
        tag.getProducts().remove(this);
    }
}