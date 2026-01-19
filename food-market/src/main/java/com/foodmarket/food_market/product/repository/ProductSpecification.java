package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.product.model.Product;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class ProductSpecification {

   
    public static Specification<Product> filterBy(
            String searchTerm,
            List<Long> categoryIds,
            Boolean includeSoftDeleted,
            Boolean onlySoftDeleted,
            List<Long> filterIds,
            Boolean isOnSale
    ) {

        return Specification.allOf(filterDeleted(includeSoftDeleted, onlySoftDeleted))
                .and(hasSearchTerm(searchTerm))
                .and(hasCategoryIdIn(categoryIds))
                .and(hasIdsIn(filterIds))
                .and(isOnSale(isOnSale));
    }

    private static Specification<Product> filterDeleted(Boolean includeSoftDeleted, Boolean onlySoftDeleted) {

        if (Boolean.TRUE.equals(onlySoftDeleted)) {
            return (root, query, cb) -> cb.isTrue(root.get("isDeleted"));
        }

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

            Expression<String> unaccentCategoryName = cb.function("unaccent", String.class, root.get("category").get("name"));
            Predicate categoryPredicate = cb.like(cb.lower(unaccentCategoryName), cb.lower(unaccentPattern));

            return cb.or(namePredicate, categoryPredicate);
        };
    }
    private static Specification<Product> hasCategoryIdIn(List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) return null;
        return (root, query, cb) ->
                root.get("category").get("id").in(categoryIds);
    }

    private static Specification<Product> hasIdsIn(List<Long> ids) {
        if (ids == null) return null;
        return (root, query, cb) -> root.get("id").in(ids);
    }
    private static Specification<Product> isOnSale(Boolean isOnSale) {
        if (isOnSale == null) return null;
        return  (root, query, cb) -> cb.isTrue(root.get("isOnSale"));
    }
}