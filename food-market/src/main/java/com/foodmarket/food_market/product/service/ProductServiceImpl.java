package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.category.repository.CategoryRepository;
import com.foodmarket.food_market.inventory.dto.ProductStockInfoDTO;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.product.dto.AdminProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductSaveRequestDTO;
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.model.ProductImage;
import com.foodmarket.food_market.product.model.Tag;
import com.foodmarket.food_market.product.repository.*;
import com.foodmarket.food_market.shared.service.ImageService;
import com.foodmarket.food_market.shared.service.UploadResult;
import com.github.slugify.Slugify;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final InventoryService inventoryService;
    private final ImageService imageService;
    private final Slugify slugify = Slugify.builder().transliterator(true).build();

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getProducts(String searchTerm, String categorySlug, String sortParam, Pageable pageable, Boolean isOnSale) {

        List<Long> categoryIds = null;

        if (categorySlug != null && !categorySlug.isEmpty()) {
            Category category = categoryRepository.findBySlug(categorySlug)
                    .orElseThrow(() -> new EntityNotFoundException("Category not found"));

            if (category.getParent() == null) {
                List<Category> children = categoryRepository.getCategoriesByParentId(category.getId());
                categoryIds = children.stream().map(Category::getId).collect(Collectors.toList());
            } else {
                categoryIds = List.of(category.getId());
            }
        }

        Sort sort = resolveSort(sortParam);
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Specification<Product> spec = ProductSpecification.filterBy(searchTerm, categoryIds,  false, false, null, isOnSale);

        Page<Product> productPage = productRepository.findAll(spec, sortedPageable);

        return productPage.map(product -> {
            int stockQuantity = inventoryService.getStockAvailability(product.getId());
            return ProductResponseDTO.fromEntity(product, stockQuantity);
        });
    }

    @Override
    public List<String> getSearchHints(String keyword) {
        return productRepository.searchKeywordSuggestions(keyword);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponseDTO getProductDetails(String slug) {
        Product product = productRepository.findBySlugAndIsDeletedFalse(slug).orElseThrow(EntityNotFoundException::new);
        int stockQuantity = inventoryService.getStockAvailability(product.getId());
        return ProductResponseDTO.fromEntity(product, stockQuantity);
    }

    // ==================================================================
    // --- Admin Methods ---
    // ==================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<AdminProductResponseDTO> getAdminProducts(Pageable pageable, String searchTerm, Long categoryId, String sortParam, String deletedMode, Boolean isLowStock, Boolean isOnSale) {

        Sort sort = resolveSort(sortParam);
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Boolean includeSoftDeleted = false; 
        Boolean onlySoftDeleted = false;

        if ("ALL".equalsIgnoreCase(deletedMode)) {
            includeSoftDeleted = true;
        } else if ("DELETED_ONLY".equalsIgnoreCase(deletedMode)) {
            onlySoftDeleted = true;
        }
        List<Long> filterIds = null;
        if (Boolean.TRUE.equals(isLowStock)) {
            filterIds = productRepository.findProductIdsWithLowStock(10);

            if (filterIds.isEmpty()) {
                return Page.empty(pageable);
            }
        }
        List<Long> categoryIds = new ArrayList<>();
        if (categoryId != null) {
            categoryIds.add(categoryId);
        }
        Specification<Product> spec = ProductSpecification.filterBy(searchTerm,categoryIds, includeSoftDeleted, onlySoftDeleted, filterIds, isOnSale);

        Page<Product> productPage = productRepository.findAll(spec, sortedPageable);

        return productPage.map(product -> {
            ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(product.getId());
            return AdminProductResponseDTO.fromEntity(
                    product,
                    stockInfo.totalAvailableStock(),
                    stockInfo.soonestExpirationDate()
            );
        });
    }

    @Override
    public long countLowStockProducts() {
        List<Long> lowStockIds = productRepository.findProductIdsWithLowStock(10);
        return lowStockIds.size();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProductResponseDTO getAdminProductDetails(Long id) {
        // Admin xem được cả sản phẩm đã xóa
        Product product = productRepository.findById(id).orElseThrow(EntityNotFoundException::new);
        ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(id);
        return AdminProductResponseDTO.fromEntity(product, stockInfo.totalAvailableStock(), stockInfo.soonestExpirationDate());
    }

    @Override
    @Transactional
    public AdminProductResponseDTO createProduct(ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException {
        Category category = findCategoryById(request.getCategoryId());
        String name = request.getName().trim();

        Product product = new Product();
        mapRequestToProduct(product, request, category);
        product.setSlug(generateUniqueSlug(name, null));

        Product savedProduct = productRepository.save(product);

        // Upload ảnh
        if (files != null && !files.isEmpty()) {
            List<ProductImage> newImages = addImagesToProduct(savedProduct.getId(), files);
            savedProduct.setImages(newImages);
            productRepository.save(savedProduct);
        }

        return AdminProductResponseDTO.fromEntity(savedProduct, 0, null);
    }

    @Override
    @Transactional
    public AdminProductResponseDTO updateProduct(Long id, ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException {
        Product product = productRepository.findById(id).orElseThrow(EntityNotFoundException::new);
        Category category = findCategoryById(request.getCategoryId());
        String name = request.getName().trim();

        if (!product.getName().equals(name)) {
            product.setSlug(generateUniqueSlug(name, id));
        }

        mapRequestToProduct(product, request, category);

        Product updatedProduct = productRepository.save(product);

        if (files != null && !files.isEmpty()) {
            List<ProductImage> newImages = addImagesToProduct(updatedProduct.getId(), files);
            updatedProduct.getImages().addAll(newImages);
        }

        if (request.getDeletedImageIds() != null && !request.getDeletedImageIds().isEmpty()) {
            List<ProductImage> imagesToDelete = updatedProduct.getImages().stream()
                    .filter(img -> request.getDeletedImageIds().contains(img.getId()))
                    .toList();

            for (ProductImage img : imagesToDelete) {
                imageService.deleteImage(img.getPublicId());
                updatedProduct.getImages().remove(img);
            }
        }

        updatedProduct = productRepository.save(updatedProduct);

        ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(updatedProduct.getId());
        return AdminProductResponseDTO.fromEntity(updatedProduct, stockInfo.totalAvailableStock(), stockInfo.soonestExpirationDate());
    }


    @Override
    @Transactional
    public void softDeleteProduct(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));
        if (!p.isDeleted()) {
            p.setDeleted(true);
            p.setDeletedAt(LocalDateTime.now());
            productRepository.save(p);
        }
    }

    @Override
    @Transactional
    public void restoreSoftDeleteProduct(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));
        if (p.isDeleted()) {
            p.setDeleted(false);
            p.setDeletedAt(null);
            productRepository.save(p);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<ProductImage> addImagesToProduct(Long productId, List<MultipartFile> files) throws IOException {
        Product product = productRepository.findById(productId).orElseThrow(EntityNotFoundException::new);
        List<ProductImage> images = new ArrayList<>();
        int maxOrder = product.getImages().stream()
                .mapToInt(ProductImage::getDisplayOrder).max().orElse(-1);
        int currentOrder = maxOrder + 1;

        for (MultipartFile file : files) {
                UploadResult result = imageService.uploadProductImage(file, productId);
            ProductImage newImage = ProductImage.builder()
                    .product(product)
                    .imageUrl(result.secureUrl())
                    .publicId(result.publicId())
                    .displayOrder(currentOrder++)
                    .build();
            images.add(newImage);
        }
        return images;
    }

    // ==================================================================
    // --- Helper Methods ---
    // ==================================================================

    private void mapRequestToProduct(Product product, ProductSaveRequestDTO request, Category category) {
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setSpecifications(request.getSpecifications() != null ? request.getSpecifications() : new HashMap<>());
        product.setBasePrice(request.getBasePrice());
        product.setUnit(request.getUnit());
        product.setCategory(category);

        // Update Sale info
        if (request.getSalePrice() != null) {
            product.setSalePrice(request.getSalePrice());
        }
        if (request.getIsOnSale() != null) {
            product.setOnSale(request.getIsOnSale());
        }

        // Tags
        Set<Tag> tags = processTags(request.getTags());
        product.setTags(tags);
    }

    private Sort resolveSort(String sortParam) {
        if (sortParam == null || sortParam.isEmpty()) return Sort.unsorted();
        return switch (sortParam) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "best_selling" -> Sort.by(Sort.Direction.DESC, "soldCount");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.unsorted();
        };
    }

    private Set<Tag> processTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new HashSet<>();
        }
        return tagNames.stream()
                .map(name -> tagRepository.findByName(name.trim())
                        .orElseGet(() -> tagRepository.save(new Tag(name.trim(), generateUniqueTagSlug(name.trim().toLowerCase())))))
                .collect(Collectors.toSet());
    }

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found ID: " + id));
    }

    private String generateUniqueSlug(String name, Long excludeId) {
        String baseSlug = slugify.slugify(name);
        String slug = baseSlug;
        int counter = 1;
        while (true) {
            Optional<Product> existing = productRepository.findBySlug(slug);
            if (existing.isEmpty() || (excludeId != null && existing.get().getId().equals(excludeId))) {
                return slug;
            }
            slug = baseSlug + "-" + counter++;
        }
    }

    private String generateUniqueTagSlug(String name) {
        String base = slugify.slugify(name);
        String slug = base;
        int c = 1;
        while (tagRepository.findBySlug(slug).isPresent()) {
            slug = base + "-" + c++;
        }
        return slug;
    }
}