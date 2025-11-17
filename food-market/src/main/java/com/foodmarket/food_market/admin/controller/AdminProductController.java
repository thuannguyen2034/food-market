package com.foodmarket.food_market.admin.controller;

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
    public ResponseEntity<ProductResponseDTO> createProduct(
            @RequestPart("product") @Valid ProductSaveRequestDTO request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) throws IOException {

        // ProductSaveRequestDTO.imageUrl sẽ bị lờ đi
        ProductResponseDTO createdProduct = productService.createProduct(request, images);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    /**
     * API Cập nhật THÔNG TIN (Text) của sản phẩm
     * API này KHÔNG cập nhật ảnh.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProductInfo(
            @PathVariable Long id,
            @Valid @RequestBody ProductSaveRequestDTO request
    ) {
        // Hàm này giờ chỉ cập nhật text (name, price, tags, v.v.)
        ProductResponseDTO updatedProduct = productService.updateProduct(id, request);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * API Thêm ảnh MỚI cho sản phẩm đã có
     */
    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponseDTO> addImagesToProduct(
            @PathVariable Long id,
            @RequestPart("images") List<MultipartFile> images
    ) throws IOException {
        ProductResponseDTO updatedProduct = productService.addImagesToProduct(id, images);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * API Xóa 1 ảnh cụ thể
     */
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteProductImage(@PathVariable Long imageId) {
        productService.deleteProductImage(imageId);
        return ResponseEntity.noContent().build();
    }

    /**
     * API Đặt 1 ảnh làm ảnh chính (displayOrder = 0)
     */
    @PutMapping("/images/set-main/{imageId}")
    public ResponseEntity<Void> setMainProductImage(@PathVariable Long imageId) {
        productService.setMainImage(imageId);
        return ResponseEntity.noContent().build();
    }


    /**
     * API Xóa 1 sản phẩm (và tất cả ảnh của nó)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}