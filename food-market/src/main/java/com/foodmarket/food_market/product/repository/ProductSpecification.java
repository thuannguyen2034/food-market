package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.product.model.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils; // Spring utility

public class ProductSpecification {

    /**
     * Tạo Specification động
     * @param searchTerm (tìm theo tên sản phẩm)
     * @param categoryId (lọc theo danh mục)
     * @return Specification<Product>
     */
    public static Specification<Product> filterBy(String searchTerm, Long categoryId) {
        // Dùng Lambda (Java 8+)
        return (root, query, criteriaBuilder) -> {

            // Dùng List để gom các điều kiện (AND)
            Predicate finalPredicate = criteriaBuilder.conjunction();

            // 1. Lọc theo searchTerm (tìm kiếm gần đúng)
            if (StringUtils.hasText(searchTerm)) {
                // (Tối ưu: Chuẩn hóa text, bỏ dấu,...)
                String likeTerm = "%" + searchTerm.toLowerCase() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), likeTerm);
                finalPredicate = criteriaBuilder.and(finalPredicate, nameLike);
            }

            // 2. Lọc theo categoryId
            if (categoryId != null) {
                Join<Product, Category> categoryJoin = root.join("category");
                Predicate categoryEquals = criteriaBuilder.equal(categoryJoin.get("id"), categoryId);
                finalPredicate = criteriaBuilder.and(finalPredicate, categoryEquals);
            }

            // (Bạn có thể thêm lọc theo giá (min/max), theo tag... tại đây)

            return finalPredicate;
        };
    }
}