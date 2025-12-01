package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.product.model.Product;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class ProductSpecification {

    /**
     * Tạo Specification động
     *
     * @param searchTerm (tìm theo tên sản phẩm)
     * @param categorySlug (lọc theo danh mục)
     * @return Specification<Product>
     */
    public static Specification<Product> filterBy(
            String searchTerm,
            Long categoryId,
            String categorySlug,
            Boolean includeSoftDeleted,
            Boolean onlySoftDeleted,
            List<Long> filterIds
    ) {

        return Specification.allOf(filterDeleted(includeSoftDeleted, onlySoftDeleted))
                .and(hasSearchTerm(searchTerm))
                .and(hasCategoryId(categoryId))
                .and(hasCategory(categorySlug))
                .and(hasIdsIn(filterIds));
    }

    private static Specification<Product> filterDeleted(Boolean includeSoftDeleted, Boolean onlySoftDeleted) {

        // Chỉ lấy sản phẩm bị xoá mềm
        if (Boolean.TRUE.equals(onlySoftDeleted)) {
            return (root, query, cb) -> cb.isTrue(root.get("isDeleted"));
        }

        // Nếu includeDeleted = true → không cần lọc deleted
        if (Boolean.TRUE.equals(includeSoftDeleted)) {
            return null;
        }

        // Mặc định: chỉ lấy chưa xoá
        return (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
    }

    private static Specification<Product> hasSearchTerm(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return null;

        return (root, query, cb) -> {
            String pattern = "%" + keyword.toLowerCase() + "%";
            Expression<String> unaccentPattern = cb.function("unaccent", String.class, cb.literal(pattern));

            Expression<String> unaccentProductName = cb.function("unaccent", String.class, root.get("name"));
            Predicate namePredicate = cb.like(cb.lower(unaccentProductName), cb.lower(unaccentPattern));

            // Join bảng category để lấy tên
            Expression<String> unaccentCategoryName = cb.function("unaccent", String.class, root.get("category").get("name"));
            Predicate categoryPredicate = cb.like(cb.lower(unaccentCategoryName), cb.lower(unaccentPattern));

            return cb.or(namePredicate, categoryPredicate);
        };
    }
    private static Specification<Product> hasCategoryId(Long categoryId) {
        if (categoryId == null) return null;
        return (root, query, cb) ->
                cb.equal(root.get("category").get("id"), categoryId);
    }
    private static Specification<Product> hasCategory(String categorySlug) {
        if (categorySlug == null) return null;

        return (root, query, cb) ->
                cb.equal(root.get("category").get("slug"), categorySlug);
    }
    private static Specification<Product> hasIdsIn(List<Long> ids) {
        if (ids == null) return null; // Nếu null thì bỏ qua logic này
        return (root, query, cb) -> root.get("id").in(ids);
    }
}