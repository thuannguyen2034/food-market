package com.foodmarket.food_market.recipe.service;

import com.foodmarket.food_market.recipe.dto.RecipeFilter;
import com.foodmarket.food_market.recipe.dto.RecipeRequestDTO;
import com.foodmarket.food_market.recipe.dto.RecipeResponseDTO;
import com.foodmarket.food_market.recipe.model.Recipe;
import com.foodmarket.food_market.recipe.repository.RecipeRepository;
import com.foodmarket.food_market.recipe.repository.RecipeSpecification;
import com.foodmarket.food_market.shared.service.ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRecipeService {

    private final RecipeRepository recipeRepository;
    private final ImageService imageService;

    // 1. Xem danh sách (Phân trang + Lọc)
    @Transactional
    public Page<RecipeResponseDTO> getRecipes(RecipeFilter filter, Pageable pageable) {
        return recipeRepository.findAll(RecipeSpecification.filterBy(filter), pageable)
                .map(RecipeResponseDTO::fromEntity);
    }

    @Transactional
    public RecipeResponseDTO getRecipeDetail(long recipeId) {
        return recipeRepository.findById(recipeId)
                .map(recipe -> RecipeResponseDTO.fromEntity(recipe))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm được công thức"));
    }

    // 2. Tạo công thức mới
    @Transactional
    public RecipeResponseDTO createRecipe(RecipeRequestDTO request, MultipartFile imageFile) throws IOException {
        Recipe recipe = new Recipe();
        mapRequestToEntity(request, recipe);

        // Lưu trước để có ID (dùng cho tên ảnh)
        recipe = recipeRepository.save(recipe);

        // Xử lý upload ảnh nếu có
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = imageService.uploadRecipeImage(imageFile, recipe.getId());
            recipe.setImageUrl(imageUrl);
            recipe = recipeRepository.save(recipe); // Update lại URL
        }

        return RecipeResponseDTO.fromEntity(recipe);
    }

    // 3. Cập nhật công thức
    @Transactional
    public RecipeResponseDTO updateRecipe(Long id, RecipeRequestDTO request, MultipartFile imageFile) throws IOException {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found with id: " + id));

        // Cập nhật thông tin cơ bản
        mapRequestToEntity(request, recipe);

        // Nếu có ảnh mới thì upload và ghi đè
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = imageService.uploadRecipeImage(imageFile, recipe.getId());
            recipe.setImageUrl(imageUrl);
        }

        recipeRepository.save(recipe);
        return RecipeResponseDTO.fromEntity(recipe);
    }

    // --- Helper Methods ---

    private void mapRequestToEntity(RecipeRequestDTO request, Recipe recipe) {
        recipe.setName(request.getName());
        recipe.setCookingSteps(request.getCookingSteps());
        recipe.setIngredients(request.getIngredients());
        if (request.getTags() != null) {
            // Xóa tất cả khoảng trắng
            String cleanTags = request.getTags().replaceAll(",\\s+", ",");
            recipe.setTags(cleanTags);
        }
        recipe.updateProducts(request.getProductIds());
    }


}