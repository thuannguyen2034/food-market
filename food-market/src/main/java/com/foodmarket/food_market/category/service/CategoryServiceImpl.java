package com.foodmarket.food_market.category.service;

import com.foodmarket.food_market.category.dto.CategoryResponseDTO; // <-- Cập nhật
import com.foodmarket.food_market.category.dto.CategorySaveRequestDTO; // <-- Cập nhật
import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.category.repository.CategoryRepository;
import com.foodmarket.food_market.shared.service.ImageService;
import com.github.slugify.Slugify;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ImageService imageService;
    private final Slugify slugify = Slugify.builder().transliterator(true).build();

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> getCategoryTree() {
        List<Category> allCategories = categoryRepository.findAllWithParent();

        Map<Long, CategoryResponseDTO> dtoMap = allCategories.stream()
                .map(CategoryResponseDTO::fromEntity)
                .collect(Collectors.toMap(CategoryResponseDTO::getId, dto -> dto));

        List<CategoryResponseDTO> rootCategories = new ArrayList<>();
        for (CategoryResponseDTO dto : dtoMap.values()) {
            if (dto.getParentId() == null) {
                rootCategories.add(dto);
            } else {
                CategoryResponseDTO parentDto = dtoMap.get(dto.getParentId());
                if (parentDto != null) {
                    parentDto.getChildren().add(dto);
                }
            }
        }
        return rootCategories;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> getAllCategoriesFlat() {
        return categoryRepository.findAll().stream()
                .map(CategoryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> getSameRootCategories(String categorySlug) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        List<Category> relatedCategories;
        if (category.getParent() == null) {
            relatedCategories = categoryRepository.getCategoriesByParentId(category.getId());
            relatedCategories.add(0, category);
        } else {
            relatedCategories = categoryRepository.getCategoriesByParentId(category.getParent().getId());
            relatedCategories.add(0, category.getParent());
        }
        return relatedCategories.stream()
                .map(CategoryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponseDTO> getSearchCategories(String keyword) {
        return categoryRepository.searchByKeyword(keyword).stream()
                .map(CategoryResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }
    @Override
    @Transactional
    public CategoryResponseDTO createCategory(CategorySaveRequestDTO request) {
        String name = request.getName().trim();
        categoryRepository.findByName(name).ifPresent(existing -> {
            throw new IllegalArgumentException("Danh mục với tên '" + existing.getName() + "' đã tồn tại.");
        });

        Category category = new Category();
        category.setName(name);
        category.setSlug(generateUniqueSlug(name, null));

        if (request.getParentId() != null) {
            Category parent = findCategoryById(request.getParentId());
            category.setParent(parent);
        }

        Category savedCategory = categoryRepository.save(category);

        if (request.getImageFile() != null && !request.getImageFile().isEmpty()) {
            try {
                String imageUrl = imageService.uploadCategoryImage(request.getImageFile(), savedCategory.getId());
                savedCategory.setImageUrl(imageUrl);
                savedCategory = categoryRepository.save(savedCategory);
            } catch (IOException e) {
                throw new RuntimeException("Lỗi khi upload ảnh: " + e.getMessage(), e);
            }
        }

        return CategoryResponseDTO.fromEntity(savedCategory);
    }

    @Override
    @Transactional
    public CategoryResponseDTO updateCategory(Long id, CategorySaveRequestDTO request) {
        Category category = findCategoryById(id);
        String name = request.getName().trim();

        if (!category.getName().equals(name)) {
            categoryRepository.findByName(name).ifPresent(existing -> {
                throw new IllegalArgumentException("Tên danh mục '" + existing.getName() + "' đã bị trùng.");
            });
            category.setName(name);
            category.setSlug(generateUniqueSlug(name, id));
        }

        if (request.getImageFile() != null && !request.getImageFile().isEmpty()) {
            try {
                if (category.getImageUrl() != null) {
                    imageService.deleteCategoryImage(id);
                }

                String imageUrl = imageService.uploadCategoryImage(request.getImageFile(), id);
                category.setImageUrl(imageUrl);
            } catch (IOException e) {
                throw new RuntimeException("Lỗi khi upload ảnh: " + e.getMessage(), e);
            }
        }

        Category parent = null;
        if (request.getParentId() != null) {
            if (id.equals(request.getParentId())) {
                throw new IllegalArgumentException("Không thể gán danh mục làm cha của chính nó.");
            }
            parent = findCategoryById(request.getParentId());
        }
        category.setParent(parent);

        Category updatedCategory = categoryRepository.save(category);
        return CategoryResponseDTO.fromEntity(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = findCategoryById(id); 

        if (!category.getProducts().isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa danh mục đang có sản phẩm.");
        }
        if (!category.getChildren().isEmpty()) {
            throw new IllegalArgumentException("Phải xóa hết danh mục con trước khi xóa danh mục này.");
        }
        if (category.getImageUrl() != null) {
            imageService.deleteCategoryImage(id);
        }

        categoryRepository.delete(category);
    }

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id)
                );
    }

    private String generateUniqueSlug(String name, Long excludeId) {
        String baseSlug = slugify.slugify(name);
        String slug = baseSlug;
        int counter = 1;
        while (true) {
            Optional<Category> existing = categoryRepository.findBySlug(slug);
            if (existing.isEmpty() || (excludeId != null && existing.get().getId().equals(excludeId))) {
                return slug;
            }
            slug = baseSlug + "-" + counter++;
        }
    }

}