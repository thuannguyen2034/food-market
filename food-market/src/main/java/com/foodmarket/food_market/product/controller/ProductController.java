package com.foodmarket.food_market.product.controller;

import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    /**
     * API Public: Lấy danh sách sản phẩm (có phân trang, tìm kiếm, lọc)
     *
     * Ví dụ: /api/v1/products?page=0&size=10&sort=name,asc&search=Thịt&category=5
     */
    @GetMapping
    public ResponseEntity<Page<ProductResponseDTO>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long category,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<ProductResponseDTO> productPage = productService.getProducts(pageable, search, category);
        return ResponseEntity.ok(productPage);
    }

    /**
     * API Public: Lấy chi tiết 1 sản phẩm (với giá đã tính)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductDetails(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductDetails(id));
    }
}