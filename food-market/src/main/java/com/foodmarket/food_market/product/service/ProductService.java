package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.product.dto.AdminProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductSaveRequestDTO;
import com.foodmarket.food_market.product.model.ProductImage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ProductService {

    // --- Public ---
    Page<ProductResponseDTO> getProducts( String searchTerm,String categorySlug ,String sortParam,Pageable pageable);
    List<String> getSearchHints(String keyword);
    ProductResponseDTO getProductDetails(String slug);
    ProductResponseDTO getProductDetails(long productId);
    // ==================================================================
    // --- Admin Methods ---
    // ==================================================================
    // Thêm vào phần Admin Methods
    Page<AdminProductResponseDTO> getAdminProducts(Pageable pageable, String searchTerm, Long categoryId, String sortParam, String deletedMode,Boolean isLowStock);
    long countLowStockProducts();
    AdminProductResponseDTO createProduct(ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException;

    AdminProductResponseDTO updateProduct(Long id, ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException;

    void softDeleteProduct(Long productId);

    void restoreSoftDeleteProduct(Long productId);

    List<ProductImage> addImagesToProduct(Long productId, List<MultipartFile> files) throws IOException;


    AdminProductResponseDTO getAdminProductDetails(Long id);
}