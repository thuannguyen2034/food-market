package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.product.model.Product;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils; // Spring utility

public class ProductSpecification {

    /**
     * Tạo Specification động
     *
     * @param searchTerm (tìm theo tên sản phẩm)
     * @param categoryId (lọc theo danh mục)
     * @return Specification<Product>
     */
    public static Specification<Product> filterBy(
            String searchTerm,
            Long categoryId,
            Boolean includeDeleted,
            Boolean onlyDeleted
    ) {

        return Specification.allOf(filterDeleted(includeDeleted, onlyDeleted))
                .and(hasSearchTerm(searchTerm))
                .and(hasCategory(categoryId));
    }

    private static Specification<Product> filterDeleted(Boolean includeDeleted, Boolean onlyDeleted) {

        // Chỉ lấy sản phẩm bị xoá mềm
        if (Boolean.TRUE.equals(onlyDeleted)) {
            return (root, query, cb) -> cb.isTrue(root.get("deleted"));
        }

        // Nếu includeDeleted = true → không cần lọc deleted
        if (Boolean.TRUE.equals(includeDeleted)) {
            return null;
        }

        // Mặc định: chỉ lấy chưa xoá
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    private static Specification<Product> hasSearchTerm(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) return null;

        String pattern = "%" + searchTerm.toLowerCase() + "%";

        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern);
    }

    private static Specification<Product> hasCategory(Long categoryId) {
        if (categoryId == null) return null;

        return (root, query, cb) ->
                cb.equal(root.get("category").get("id"), categoryId);
    }
}