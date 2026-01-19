// src/main/java/com/foodmarket/food_market/product/service/StorefrontService.java

package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.category.repository.CategoryRepository;
import com.foodmarket.food_market.inventory.repository.InventoryBatchRepository;
import com.foodmarket.food_market.product.dto.HomePageDataDTO;
import com.foodmarket.food_market.product.dto.HomeSectionDTO;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorefrontService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private  final InventoryBatchRepository  inventoryBatchRepository;
    @Transactional(readOnly = true)
    public HomePageDataDTO getHomePageData() {
        Pageable saleLimit = PageRequest.of(0, 10);
        List<Product> saleProducts = productRepository.findOnSaleProducts(saleLimit);
        List<ProductResponseDTO> saleDTOs = saleProducts.stream()
                .map(product -> {
                    int stock = inventoryBatchRepository.findCurrentProductQuantity(product.getId());
                    return ProductResponseDTO.fromEntity(product, stock);
                })
                .collect(Collectors.toList());

        List<HomeSectionDTO> sections = new ArrayList<>();
        List<Category> rootCategories = categoryRepository.findByParentIdIsNull();
        Pageable sectionLimit = PageRequest.of(0, 10);

        for (Category rootCat : rootCategories) {
            List<Product> products = productRepository.findTopProductsByRootCategoryId(rootCat.getId(), sectionLimit);
            if (!products.isEmpty()) {
                sections.add(HomeSectionDTO.builder()
                        .categoryId(rootCat.getId())
                        .categoryName(rootCat.getName())
                        .categorySlug(rootCat.getSlug())
                        .products(products.stream().map(product -> {
                            int stock = inventoryBatchRepository.findCurrentProductQuantity(product.getId());
                            return ProductResponseDTO.fromEntity(product, stock);
                        }).collect(Collectors.toList()))
                        .build());
            }
        }
        return HomePageDataDTO.builder()
                .flashSaleProducts(saleDTOs)
                .categorySections(sections)
                .build();
    }
}