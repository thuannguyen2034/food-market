package com.foodmarket.food_market.product.repository;

import com.foodmarket.food_market.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    // JpaSpecificationExecutor sẽ cung cấp các hàm (findAll)
    // cho phép chúng ta lọc động (dynamic filtering)
    Optional<Product> findByName(String name);
    Optional<Product> findBySlug(String slug);
}