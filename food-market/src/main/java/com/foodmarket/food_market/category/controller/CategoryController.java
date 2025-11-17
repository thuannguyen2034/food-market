package com.foodmarket.food_market.category.controller;

import com.foodmarket.food_market.category.dto.CategoryResponseDTO; // <-- Cập nhật
import com.foodmarket.food_market.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getCategoryTree() { // <-- Cập nhật
        return ResponseEntity.ok(categoryService.getCategoryTree());
    }
}