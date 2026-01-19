package com.foodmarket.food_market.recipe.controller;

import com.foodmarket.food_market.recipe.dto.RecipeDetailDTO;
import com.foodmarket.food_market.recipe.dto.RecipeResponseDTO;
import com.foodmarket.food_market.recipe.dto.RecipeSearchRequestDTO;
import com.foodmarket.food_market.recipe.service.StorefrontRecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/storefront/recipes")
@RequiredArgsConstructor
public class StorefrontRecipeController {

    private final StorefrontRecipeService storefrontService;

    // --- NHÓM 1: CHI TIẾT ---

    @GetMapping("/{id}")
    public ResponseEntity<RecipeDetailDTO> getRecipeDetail(@PathVariable Long id) {
        return ResponseEntity.ok(storefrontService.getRecipeDetailWithProducts(id));
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<RecipeResponseDTO>> getRelatedRecipes(@PathVariable Long id) {
        return ResponseEntity.ok(storefrontService.getRelatedRecipes(id));
    }

    // --- NHÓM 2: THEO SẢN PHẨM ---

    @GetMapping("/by-product/{productId}")
    public ResponseEntity<List<RecipeResponseDTO>> getRecipesByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(storefrontService.getRecipesByProductId(productId));
    }

    // --- NHÓM 3: TÌM KIẾM & TRANG CHỦ ---

    @GetMapping("/featured")
    public ResponseEntity<List<RecipeResponseDTO>> getFeaturedRecipes(
            @RequestParam(required = false, defaultValue = "DISH_MAIN") String role) {
        return ResponseEntity.ok(storefrontService.getFeaturedRecipes(role));
    }

    @PostMapping("/suggest")
    public ResponseEntity<PageImpl<RecipeResponseDTO>> suggestRecipes(
            @RequestBody RecipeSearchRequestDTO request) {
        return ResponseEntity.ok(storefrontService.searchRecipes(request));
    }
}