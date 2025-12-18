package com.foodmarket.food_market.recipe.repository;

import com.foodmarket.food_market.recipe.dto.RecipeFilter;
import com.foodmarket.food_market.recipe.model.Recipe;
import com.foodmarket.food_market.recipe.model.RecipeProduct;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class RecipeSpecification {

    /**
     * Phương thức chính để tạo Specification tổng hợp
     */
    public static Specification<Recipe> filterBy(RecipeFilter filter) {
        if (filter == null) return null;

        return Specification.allOf(hasKeyword(filter.getKeyword()))
                .and(hasTag(filter.getTag()))
                .and(hasProductId(filter.getProductId()));
    }

    /**
     * Tìm kiếm theo từ khóa (Tên món ăn)
     * Sử dụng hàm 'unaccent' của PostgreSQL để tìm kiếm không dấu
     * (Giống ProductSpecification)
     */
    public static Specification<Recipe> hasKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) return null;

        return (root, query, cb) -> {
            // Chuẩn bị pattern: %keyword%
            String pattern = "%" + keyword.toLowerCase() + "%";

            // 1. Loại bỏ dấu của từ khóa tìm kiếm
            Expression<String> unaccentPattern = cb.function("unaccent", String.class, cb.literal(pattern));

            // 2. Loại bỏ dấu của tên món ăn trong DB
            Expression<String> unaccentRecipeName = cb.function("unaccent", String.class, root.get("name"));

            // 3. So sánh LIKE (case-insensitive)
            return cb.like(cb.lower(unaccentRecipeName), cb.lower(unaccentPattern));
        };
    }

    /**
     * Tìm kiếm theo Tag (Ví dụ: HIGH_PROTEIN)
     * Vì Tags lưu dạng chuỗi CSV "TAG1,TAG2" nên dùng LIKE
     */
    public static Specification<Recipe> hasTag(String tag) {
        if (!StringUtils.hasText(tag)) return null;

        return (root, query, cb) -> {
            // Không cần unaccent cho tag vì tag thường là mã (enum) hoặc tiếng Anh không dấu
            return cb.like(root.get("tags"), "%" + tag + "%");
        };
    }

    /**
     * Tìm kiếm món ăn có chứa sản phẩm cụ thể (Join bảng)
     */
    public static Specification<Recipe> hasProductId(Long productId) {
        if (productId == null) return null;

        return (root, query, cb) -> {
            // Join sang bảng recipe_products
            // Lưu ý: "products" là tên biến list trong entity Recipe
            Join<Recipe, RecipeProduct> recipeProducts = root.join("products");

            // Đảm bảo không bị duplicate kết quả khi join (Distinct)
            query.distinct(true);

            return cb.equal(recipeProducts.get("productId"), productId);
        };
    }
}