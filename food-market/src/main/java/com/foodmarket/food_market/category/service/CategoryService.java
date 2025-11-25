package com.foodmarket.food_market.category.service;

import com.foodmarket.food_market.category.dto.CategoryResponseDTO;
import com.foodmarket.food_market.category.dto.CategorySaveRequestDTO;

import java.util.List;

public interface CategoryService {

    /**
     * (Public) Lấy toàn bộ danh mục dưới dạng cấu trúc cây.
     */
    List<CategoryResponseDTO> getCategoryTree();

    /**
     * (Admin) Lấy danh mục dạng phẳng (để quản lý).
     */
    List<CategoryResponseDTO> getAllCategoriesFlat();

    List<CategoryResponseDTO> getSameRootCategories(String categorySlug);

    List<CategoryResponseDTO> getSearchCategories(String keyword);
    /**
     * (Admin) Tạo danh mục mới.
     */
    CategoryResponseDTO createCategory(CategorySaveRequestDTO request);

    /**
     * (Admin) Cập nhật danh mục.
     */
    CategoryResponseDTO updateCategory(Long id, CategorySaveRequestDTO request);

    /**
     * (Admin) Xóa danh mục.
     */
    void deleteCategory(Long id);

}