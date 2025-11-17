package com.foodmarket.food_market.product.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "slug", unique = true, nullable = false)
    private String slug;

    @ManyToMany(mappedBy = "tags")
    private Set<Product> products = new HashSet<>();

    // Constructor tiện ích
    public Tag(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }
}