package com.foodmarket.food_market.recipe.service;

import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.repository.ProductRepository;
import com.foodmarket.food_market.product.service.ProductService;
import com.foodmarket.food_market.recipe.dto.RecipeDetailDTO;
import com.foodmarket.food_market.recipe.dto.RecipeResponseDTO;
import com.foodmarket.food_market.recipe.dto.RecipeSearchRequestDTO;
import com.foodmarket.food_market.recipe.model.Recipe;
import com.foodmarket.food_market.recipe.repository.RecipeRepository;
import com.foodmarket.food_market.recipe.repository.RecipeSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorefrontRecipeService {

    private final RecipeRepository recipeRepository;
    private final ProductService productService;
    private final ProductRepository productRepository;
    private static final int W_FLAVOR = 5;
    private static final int W_TIME = 3;
    private static final int W_NUTRITION = 2;

    @Transactional(readOnly = true)
    public PageImpl<RecipeResponseDTO> searchRecipes(RecipeSearchRequestDTO request) {

        Specification<Recipe> spec = Specification.allOf(RecipeSpecification.hasKeyword(request.getKeyword()))
                .and(RecipeSpecification.hasTag(request.getRole()));

        if (Boolean.TRUE.equals(request.getIsVegan())) {
            spec = spec.and(RecipeSpecification.hasTag("VEGAN"));
        }

        List<Recipe> candidates = recipeRepository.findAll(spec);

        if (request.getAllergies() != null && !request.getAllergies().isEmpty()) {
            candidates = candidates.stream()
                    .filter(r -> !containsAny(r.getTags(), request.getAllergies()))
                    .collect(Collectors.toList());
        }

        List<ScoredRecipe> scoredList = candidates.stream()
                .map(recipe -> {
                    int score = calculateScore(recipe, request);
                    return new ScoredRecipe(recipe, score);
                })
                .sorted((a, b) -> Integer.compare(b.score, a.score)) // Sắp xếp điểm cao -> thấp
                .collect(Collectors.toList());

        int start = request.getPage() * request.getSize();
        int end = Math.min((start + request.getSize()), scoredList.size());

        List<RecipeResponseDTO> content;
        if (start > scoredList.size()) {
            content = List.of();
        } else {
            content = scoredList.subList(start, end).stream()
                    .map(item -> RecipeResponseDTO.fromEntity(item.recipe)) // Map về DTO (kèm điểm nếu cần)
                    .collect(Collectors.toList());
        }

        return new PageImpl<>(content, PageRequest.of(request.getPage(), request.getSize()), scoredList.size());
    }

    @Transactional(readOnly = true)
    public RecipeDetailDTO getRecipeDetailWithProducts(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        RecipeResponseDTO recipeDTO = RecipeResponseDTO.fromEntity(recipe);

        List<ProductResponseDTO> products = new ArrayList<>();
        if (recipeDTO.getProductIds() != null && !recipeDTO.getProductIds().isEmpty()) {
            for (Long productId : recipeDTO.getProductIds()) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new IllegalArgumentException("Công thức nấu ăn: Không tìm thấy sản phẩm id: " + productId));
                ProductResponseDTO productDTO = productService.getProductDetails(product.getSlug());
                products.add(productDTO);
            }
        }

        return RecipeDetailDTO.builder()
                .recipeInfo(recipeDTO)
                .products(products)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getRelatedRecipes(Long recipeId) {
        Recipe currentRecipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        String currentTags = currentRecipe.getTags();
        String targetRole;

        if (currentTags.contains("DISH_MAIN")) {
            targetRole = "DISH_SOUP"; 
        } else if (currentTags.contains("DISH_SOUP")) {
            targetRole = "DISH_MAIN"; 
        } else {
            targetRole = "DISH_MAIN"; 
        }

        Specification<Recipe> spec = RecipeSpecification.hasTag(targetRole);
        List<Recipe> candidates = recipeRepository.findAll(spec);

        Collections.shuffle(candidates); 
        return candidates.stream()
                .limit(3)
                .map(RecipeResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getRecipesByProductId(Long productId) {
        return recipeRepository.findAll(RecipeSpecification.hasProductId(productId))
                .stream()
                .limit(5) 
                .map(RecipeResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getFeaturedRecipes(String role) {
        Specification<Recipe> spec = RecipeSpecification.hasTag(role);
        return recipeRepository.findAll(spec, PageRequest.of(0, 8))
                .map(RecipeResponseDTO::fromEntity)
                .getContent();
    }

    private int calculateScore(Recipe recipe, RecipeSearchRequestDTO req) {
        int score = 0;
        String tags = recipe.getTags(); 

        if (tags == null) return 0;

        if (req.getPreferredFlavors() != null) {
            for (String flavor : req.getPreferredFlavors()) {
                if (tags.contains(flavor)) score += W_FLAVOR;
            }
        }

        if (req.getTimeConstraint() != null && tags.contains(req.getTimeConstraint())) {
            score += W_TIME;
        }

        if (req.getNutritionGoals() != null) {
            for (String nut : req.getNutritionGoals()) {
                if (tags.contains(nut)) score += W_NUTRITION;
            }
        }

        return score;
    }

    private boolean containsAny(String tags, List<String> allergies) {
        if (tags == null) return false;
        for (String allergy : allergies) {
            if (tags.contains(allergy)) return true;
        }
        return false;
    }

    record ScoredRecipe(Recipe recipe, int score) {
    }
}