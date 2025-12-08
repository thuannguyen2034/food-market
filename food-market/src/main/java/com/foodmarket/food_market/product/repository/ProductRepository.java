package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.product.model.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);

    Optional<Product> findBySlugAndIsDeletedFalse(String slug);
    @Query("select p.name from Product p where p.id = :id")
    String findNameById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Product p SET p.soldCount = COALESCE(p.soldCount, 0) + :qty WHERE p.id = :id")
    void incrementSoldCount(@Param("id") Long id, @Param("qty") Integer qty);

    @Query(value = "SELECT DISTINCT p.name FROM products p " +
            "WHERE unaccent(p.name) ILIKE unaccent(concat('%', :keyword, '%')) " +
            "LIMIT 5", nativeQuery = true)
    List<String> searchKeywordSuggestions(@Param("keyword") String keyword);

    @Modifying
    @Query("UPDATE Product p SET " +
            "p.averageRating = ((p.averageRating * p.reviewCount) + :newRating) / (p.reviewCount + 1.0), " +
            "p.reviewCount = p.reviewCount + 1 " +
            "WHERE p.id = :productId")
    void addReviewRating(Long productId, double newRating);

    @Query(value = """
        SELECT p.product_id 
        FROM products p 
        LEFT JOIN inventory_batches ib ON p.product_id = ib.product_id 
        GROUP BY p.product_id 
        HAVING COALESCE(SUM(ib.current_quantity), 0) <= :threshold
    """, nativeQuery = true)
    List<Long> findProductIdsWithLowStock(@Param("threshold") int threshold);

    // 1. Lấy sản phẩm đang Sale (Flash Sale)
    @Query("SELECT p FROM Product p WHERE p.isOnSale = true AND p.isDeleted = false ORDER BY p.soldCount DESC")
    List<Product> findOnSaleProducts(Pageable pageable);

    @Query("SELECT p FROM Product p " +
            "JOIN p.category c " +
            "WHERE c.parent.id = :rootId " +
            "AND p.isDeleted = false " +
            "ORDER BY p.soldCount DESC")
    List<Product> findTopProductsByRootCategoryId(@Param("rootId") Long rootId, Pageable pageable);
}