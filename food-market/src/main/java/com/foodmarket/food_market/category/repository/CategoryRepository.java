package com.foodmarket.food_market.category.repository;

import com.foodmarket.food_market.category.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository // Đánh dấu đây là Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Tìm tất cả danh mục gốc (không có parent)
     */
    List<Category> findByParentIsNull();

    /**
     * Lấy tất cả danh mục. Dùng JOIN FETCH
     * để tối ưu, lấy cả parent, tránh lỗi N+1 query
     * khi service xây dựng cây.
     */
    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.parent")
    List<Category> findAllWithParent();
    Optional<Category> findBySlug(String slug);

    Optional<Category> findByName(String name);
}