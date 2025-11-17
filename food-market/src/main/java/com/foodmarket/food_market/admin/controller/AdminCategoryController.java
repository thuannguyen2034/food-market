package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.category.dto.CategoryResponseDTO; // <-- Cập nhật
import com.foodmarket.food_market.category.dto.CategorySaveRequestDTO; // <-- Cập nhật
import com.foodmarket.food_market.category.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryResponseDTO> createCategory(
            @Valid @ModelAttribute CategorySaveRequestDTO request
    ) {
        CategoryResponseDTO createdCategory = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CategoryResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @ModelAttribute CategorySaveRequestDTO request
    ) {
        CategoryResponseDTO updatedCategory = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/flat")
    public ResponseEntity<List<CategoryResponseDTO>> getAllCategoriesFlat() { // <-- Cập nhật
        return ResponseEntity.ok(categoryService.getAllCategoriesFlat());
    }
}