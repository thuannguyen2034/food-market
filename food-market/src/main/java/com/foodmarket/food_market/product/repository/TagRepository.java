package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.product.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    // Tìm tag bằng tên (để tránh tạo trùng)
    Optional<Tag> findByName(String name);
    Optional<Tag> findBySlug(String slug);
}