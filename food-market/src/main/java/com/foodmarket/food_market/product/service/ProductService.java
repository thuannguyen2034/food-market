package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.product.dto.AdminProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductSaveRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ProductService {

    // --- Public ---
    Page<ProductResponseDTO> getProducts(Pageable pageable, String searchTerm, Long categoryId);

    ProductResponseDTO getProductDetails(Long id);

    // ==================================================================
    // --- Admin Methods ---
    // ==================================================================
    // Thêm vào phần Admin Methods
    @Transactional(readOnly = true)
    Page<AdminProductResponseDTO> getAdminProducts(Pageable pageable, String searchTerm, Long categoryId);

    // --- Admin ---
    ProductResponseDTO createProduct(ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException;

    ProductResponseDTO updateProduct(Long id, ProductSaveRequestDTO request);

    void deleteProduct(Long id);

    @Transactional(rollbackFor = Exception.class)
    ProductResponseDTO addImagesToProduct(Long productId, List<MultipartFile> files) throws IOException;

    void deleteProductImage(Long imageId);

    @Transactional
    void setMainImage(Long imageId);

    AdminProductResponseDTO getAdminProductDetails(Long id);
}