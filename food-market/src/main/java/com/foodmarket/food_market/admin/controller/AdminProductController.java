package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.inventory.dto.InventoryBatchDTO;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.product.dto.AdminProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductSaveRequestDTO;
import com.foodmarket.food_market.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;
    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<Page<AdminProductResponseDTO>> getAdminProducts(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String sort, // Dùng custom sort: "newest", "price_asc"...
            @RequestParam(defaultValue = "ACTIVE_ONLY") String status, // ACTIVE_ONLY, DELETED_ONLY, ALL
            @RequestParam(required = false) Boolean lowStock
    ) {
        // Truyền thẳng sort string và status xuống Service để xử lý tập trung
        Page<AdminProductResponseDTO> products = productService.getAdminProducts(pageable, searchTerm, categoryId, sort, status,lowStock);
        return ResponseEntity.ok(products);
    }

    // ... (Các endpoint khác giữ nguyên) ...
    @GetMapping("/{id}")
    public ResponseEntity<AdminProductResponseDTO> getAdminProductDetails(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getAdminProductDetails(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponseDTO> createProduct(
            @RequestPart("product") @Valid ProductSaveRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request, images));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponseDTO> updateProductInfo(
            @PathVariable Long id,
            @RequestPart("product") @Valid ProductSaveRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {
        return ResponseEntity.ok(productService.updateProduct(id, request, images));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteProduct(@PathVariable Long id) {
        productService.softDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<Void> restoreDeletedProduct(@PathVariable Long id) {
        productService.restoreSoftDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{productId}/inventory-batches")
    public ResponseEntity<Page<InventoryBatchDTO>> getBatchesForProduct(
            @PathVariable Long productId,
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(defaultValue = "false") Boolean includeZeroQuantity
    ) {
        return ResponseEntity.ok(inventoryService.getBatchesForProduct(productId, includeZeroQuantity, pageable));
    }

    @GetMapping("/count-low-stock")
    public ResponseEntity<Long> countLowStock() {
        return ResponseEntity.ok(productService.countLowStockProducts());
    }
}