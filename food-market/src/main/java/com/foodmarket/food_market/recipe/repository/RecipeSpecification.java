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

  
    public static Specification<Recipe> filterBy(RecipeFilter filter) {
        if (filter == null) return null;

        return Specification.allOf(hasKeyword(filter.getKeyword()))
                .and(hasTag(filter.getTag()))
                .and(hasProductId(filter.getProductId()));
    }

 
    public static Specification<Recipe> hasKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) return null;

        return (root, query, cb) -> {
            String pattern = "%" + keyword.toLowerCase() + "%";

            Expression<String> unaccentPattern = cb.function("unaccent", String.class, cb.literal(pattern));

            Expression<String> unaccentRecipeName = cb.function("unaccent", String.class, root.get("name"));

            return cb.like(cb.lower(unaccentRecipeName), cb.lower(unaccentPattern));
        };
    }

 
     
    public static Specification<Recipe> hasTag(String tag) {
        if (!StringUtils.hasText(tag)) return null;

        return (root, query, cb) -> {
            return cb.like(root.get("tags"), "%" + tag + "%");
        };
    }

 
   
    public static Specification<Recipe> hasProductId(Long productId) {
        if (productId == null) return null;

        return (root, query, cb) -> {
            
            Join<Recipe, RecipeProduct> recipeProducts = root.join("products");

            query.distinct(true);

            return cb.equal(recipeProducts.get("productId"), productId);
        };
    }
}