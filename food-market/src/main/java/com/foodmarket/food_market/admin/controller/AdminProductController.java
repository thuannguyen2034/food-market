package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.inventory.dto.InventoryBatchDTO;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.product.dto.AdminProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
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
            @PageableDefault(size = 20) Pageable pageable, // Paging mặc định: page=0, size=20, sort optional
            @RequestParam(required = false) String searchTerm, // Tìm kiếm theo tên/slug/description
            @RequestParam(required = false) Long categoryId // Filter theo category
    ) {
        Page<AdminProductResponseDTO> products = productService.getAdminProducts(pageable, searchTerm, categoryId);
        return ResponseEntity.ok(products);
    }

    // API MỚI: Lấy chi tiết một sản phẩm cho admin
    @GetMapping("/{id}")
    public ResponseEntity<AdminProductResponseDTO> getAdminProductDetails(@PathVariable Long id) {
        AdminProductResponseDTO product = productService.getAdminProductDetails(id);
        return ResponseEntity.ok(product);
    }

    /**
     * API Tạo sản phẩm MỚI
     * Dùng multipart/form-data
     * Frontend gửi:
     * 1. Part "product": là 1 JSON string của ProductSaveRequestDTO
     * 2. Part "images": là 1 mảng các file
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponseDTO> createProduct(
            @RequestPart("product") @Valid ProductSaveRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {

        AdminProductResponseDTO createdProduct = productService.createProduct(request, images);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    /**
     * API Cập nhật THÔNG TIN (Text) của sản phẩm
     * API này KHÔNG cập nhật ảnh.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponseDTO> updateProductInfo(
            @PathVariable Long id,
            @RequestPart("product") @Valid ProductSaveRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {

        AdminProductResponseDTO updatedProduct = productService.updateProduct(id, request, images);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * API Xóa hoàn toàn 1 sản phẩm (và tất cả ảnh của nó)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) throws IOException {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/soft-delete/{id}")
    public ResponseEntity<Void> softDeleteProduct(@PathVariable Long id) throws IOException {
        productService.softDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/restore-deleted/{id}")
    public ResponseEntity<Void> restoreDeletedProduct(@PathVariable Long id) throws IOException {
        productService.restoreSoftDeleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    //Lấy danh sách các lô hàng của sản phẩm
    @GetMapping("/{productId}/inventory-batches")
    public ResponseEntity<Page<InventoryBatchDTO>> getBatchesForProduct(@PathVariable Long productId, @PageableDefault(size = 20) Pageable pageable,@RequestParam Boolean includeZeroQuantity) {
        Page<InventoryBatchDTO> batches =  inventoryService.getBatchesForProduct(productId,includeZeroQuantity,pageable);
        return ResponseEntity.ok(batches);
    }
}