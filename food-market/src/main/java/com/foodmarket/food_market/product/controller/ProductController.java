package com.foodmarket.food_market.product.controller;

import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    
    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Boolean isOnSale,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ProductResponseDTO> productPage = productService.getProducts(search, categorySlug, sort, pageable, isOnSale);
        return ResponseEntity.ok(productPage);
    }

    @GetMapping("/search/hints")
    public ResponseEntity<List<String>> getSearchHints(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.getSearchHints(keyword));
    }

 
    @GetMapping("/{slug}")
    public ResponseEntity<ProductResponseDTO> getProductDetails(@PathVariable String slug) {
        return ResponseEntity.ok(productService.getProductDetails(slug));
    }

}