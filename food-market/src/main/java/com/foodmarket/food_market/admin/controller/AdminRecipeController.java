package com.foodmarket.food_market.admin.controller;

import com.foodmarket.food_market.recipe.dto.AiAnalysisRequestDTO;
import com.foodmarket.food_market.recipe.dto.RecipeFilter;
import com.foodmarket.food_market.recipe.dto.RecipeRequestDTO;
import com.foodmarket.food_market.recipe.dto.RecipeResponseDTO;
import com.foodmarket.food_market.recipe.service.AdminRecipeService;
import com.foodmarket.food_market.recipe.service.AiTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/admin/recipes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRecipeController {

    private final AdminRecipeService adminRecipeService;
    private final AiTagService aiTagService;    // GET /api/v1/admin/recipes?keyword=bo&page=0&size=10

    @GetMapping
    public ResponseEntity<Page<RecipeResponseDTO>> getRecipes(
            @ModelAttribute RecipeFilter filter,
            @PageableDefault(sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<RecipeResponseDTO> result = adminRecipeService.getRecipes(filter, pageable);
        return ResponseEntity.ok(result);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecipeResponseDTO> createRecipe(
            @RequestPart("data") @Valid RecipeRequestDTO request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        RecipeResponseDTO result = adminRecipeService.createRecipe(request, image);
        return ResponseEntity.ok(result);
    }

    // PUT /api/v1/admin/recipes/{id}
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecipeResponseDTO> updateRecipe(
            @PathVariable Long id,
            @RequestPart("data") @Valid RecipeRequestDTO request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        RecipeResponseDTO result = adminRecipeService.updateRecipe(id, request, image);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponseDTO> getRecipeDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminRecipeService.getRecipeDetail(id));
    }

    @PostMapping("/analyze-ai")
    public ResponseEntity<AiTagService.AiResult> analyzeRecipeWithAi(@RequestBody AiAnalysisRequestDTO request
    ) {
        if (request.getName() == null || request.getIngredients() == null) {
            return ResponseEntity.badRequest().build();
        }

        AiTagService.AiResult result = aiTagService.analyzeRecipe(request.getName(), request.getIngredients());
        return ResponseEntity.ok(result);
    }


}