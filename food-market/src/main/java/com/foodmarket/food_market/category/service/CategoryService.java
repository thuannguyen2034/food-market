package com.foodmarket.food_market.category.service;

import com.foodmarket.food_market.category.dto.CategoryResponseDTO;
import com.foodmarket.food_market.category.dto.CategorySaveRequestDTO;

import java.util.List;

public interface CategoryService {

    /**
     * lấy cây danh mục
     */
    List<CategoryResponseDTO> getCategoryTree();

    List<CategoryResponseDTO> getAllCategoriesFlat();

    List<CategoryResponseDTO> getSameRootCategories(String categorySlug);

    List<CategoryResponseDTO> getSearchCategories(String keyword);
    CategoryResponseDTO createCategory(CategorySaveRequestDTO request);

    CategoryResponseDTO updateCategory(Long id, CategorySaveRequestDTO request);

    void deleteCategory(Long id);

}