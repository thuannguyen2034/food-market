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
    // Các trọng số (Weights)
    private static final int W_FLAVOR = 5;
    private static final int W_TIME = 3;
    private static final int W_NUTRITION = 2;

    @Transactional(readOnly = true)
    public PageImpl<RecipeResponseDTO> searchRecipes(RecipeSearchRequestDTO request) {

        //Specification để lọc hard: Role, Vegan, Allergy...
        Specification<Recipe> spec = Specification.allOf(RecipeSpecification.hasKeyword(request.getKeyword()))
                .and(RecipeSpecification.hasTag(request.getRole()));

        if (Boolean.TRUE.equals(request.getIsVegan())) {
            spec = spec.and(RecipeSpecification.hasTag("VEGAN"));
        }

        // Lấy danh sách ứng viên từ DB
        List<Recipe> candidates = recipeRepository.findAll(spec);

        // Lọc dị ứng
        if (request.getAllergies() != null && !request.getAllergies().isEmpty()) {
            candidates = candidates.stream()
                    .filter(r -> !containsAny(r.getTags(), request.getAllergies()))
                    .collect(Collectors.toList());
        }

        // --- BƯỚC 2: SCORING (Tại Memory) ---
        // Map sang Object trung gian để lưu điểm
        List<ScoredRecipe> scoredList = candidates.stream()
                .map(recipe -> {
                    int score = calculateScore(recipe, request);
                    return new ScoredRecipe(recipe, score);
                })
                .sorted((a, b) -> Integer.compare(b.score, a.score)) // Sắp xếp điểm cao -> thấp
                .collect(Collectors.toList());

        // --- BƯỚC 3: PAGINATION (Thủ công) ---
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

    // 1.1 Xem chi tiết
    @Transactional(readOnly = true)
    public RecipeDetailDTO getRecipeDetailWithProducts(Long recipeId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        RecipeResponseDTO recipeDTO = RecipeResponseDTO.fromEntity(recipe);

        // Gọi sang module Product để lấy thông tin chi tiết
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

    // 1.2 Gợi ý món ăn kèm (Logic Role thông minh)
    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getRelatedRecipes(Long recipeId) {
        Recipe currentRecipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        String currentTags = currentRecipe.getTags();
        String targetRole;

        // Logic bổ trợ:
        if (currentTags.contains("DISH_MAIN")) {
            targetRole = "DISH_SOUP"; // Mặn -> Gợi ý Canh
        } else if (currentTags.contains("DISH_SOUP")) {
            targetRole = "DISH_MAIN"; // Canh -> Gợi ý Mặn
        } else {
            targetRole = "DISH_MAIN"; // Rau/Khác -> Gợi ý Mặn
        }

        // Lấy random 3 món theo Role mục tiêu
        Specification<Recipe> spec = RecipeSpecification.hasTag(targetRole);
        List<Recipe> candidates = recipeRepository.findAll(spec);

        Collections.shuffle(candidates); // Random hóa danh sách
        return candidates.stream()
                .limit(3)
                .map(RecipeResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // --- NHÓM 2: GẮN VỚI SẢN PHẨM ---

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getRecipesByProductId(Long productId) {
        // Dùng Specification hasProductId đã viết
        return recipeRepository.findAll(RecipeSpecification.hasProductId(productId))
                .stream()
                .limit(5) // Limit cứng 5 món
                .map(RecipeResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // --- NHÓM 3: TRANG CHỦ & TÌM KIẾM ---

    // 3.1 Featured (Trang chủ)
    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getFeaturedRecipes(String role) {
        Specification<Recipe> spec = RecipeSpecification.hasTag(role);
        // Lấy 8 món mới nhất theo Role
        return recipeRepository.findAll(spec, PageRequest.of(0, 8))
                .map(RecipeResponseDTO::fromEntity)
                .getContent();
    }

    // --- HELPER: Hàm tính điểm ---
    private int calculateScore(Recipe recipe, RecipeSearchRequestDTO req) {
        int score = 0;
        String tags = recipe.getTags(); // Giả sử tags lưu dạng chuỗi "TAG1,TAG2"

        if (tags == null) return 0;

        // 1. Check Flavor (Trọng số cao nhất)
        if (req.getPreferredFlavors() != null) {
            for (String flavor : req.getPreferredFlavors()) {
                if (tags.contains(flavor)) score += W_FLAVOR;
            }
        }

        // 2. Check Time (Trọng số nhì)
        // Nếu khách cần Nhanh (TIME_FAST) mà món cũng TIME_FAST -> Cộng điểm
        if (req.getTimeConstraint() != null && tags.contains(req.getTimeConstraint())) {
            score += W_TIME;
        }

        // 3. Check Nutrition (Trọng số thấp)
        if (req.getNutritionGoals() != null) {
            for (String nut : req.getNutritionGoals()) {
                if (tags.contains(nut)) score += W_NUTRITION;
            }
        }

        return score;
    }

    // Helper check dị ứng
    private boolean containsAny(String tags, List<String> allergies) {
        if (tags == null) return false;
        for (String allergy : allergies) {
            if (tags.contains(allergy)) return true;
        }
        return false;
    }

    // Wrapper class nội bộ
    record ScoredRecipe(Recipe recipe, int score) {
    }
}