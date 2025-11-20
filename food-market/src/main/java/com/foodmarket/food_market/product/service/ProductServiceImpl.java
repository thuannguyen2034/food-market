package com.foodmarket.food_market.product.service;

import com.foodmarket.food_market.category.model.Category;
import com.foodmarket.food_market.category.repository.CategoryRepository;
import com.foodmarket.food_market.inventory.dto.ProductStockInfoDTO;
import com.foodmarket.food_market.inventory.service.InventoryService;
import com.foodmarket.food_market.product.dto.AdminProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductResponseDTO;
import com.foodmarket.food_market.product.dto.ProductSaveRequestDTO;
import com.foodmarket.food_market.product.model.DynamicPricingRule;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository; // <-- THÊM MỚI
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final InventoryService inventoryService;
    private final ImageService imageService;
    private final DynamicPricingRuleRepository dynamicPricingRuleRepository;
    private final Slugify slugify = Slugify.builder().transliterator(true).build(); // Hỗ trợ tiếng Việt

    // --- Private Helper Record (Dùng nội bộ) ---
    private record CalculatedPrice(BigDecimal finalPrice, BigDecimal discountPercentage) {
    }

    // ==================================================================
    // --- Public Methods (Cho khách hàng) ---
    // ==================================================================

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponseDTO> getProducts(Pageable pageable, String searchTerm, Long categoryId) {
        // 1. Xây dựng bộ lọc động (Specification)
        Specification<Product> spec = ProductSpecification.filterBy(searchTerm, categoryId,false,false);

        // 2. Lấy trang (Page) Product
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        // 3. Tính toán giá và chuyển đổi sang DTO
        // Lưu ý: Tải các luật giá MỘT LẦN để tối ưu
        List<DynamicPricingRule> rules = dynamicPricingRuleRepository.findAllSortedByTriggerDay();

        return productPage.map(product -> {
            CalculatedPrice price = calculateFinalPrice(product, rules);
            return ProductResponseDTO.fromEntity(product, price.finalPrice(), price.discountPercentage());
        });
    }


    @Override
    @Transactional(readOnly = true)
    public ProductResponseDTO getProductDetails(Long id) {
        Product product = productRepository.findByIdAndIsDeletedFalse(id).orElseThrow(EntityNotFoundException::new);

        List<DynamicPricingRule> rules = dynamicPricingRuleRepository.findAllSortedByTriggerDay();
        CalculatedPrice price = calculateFinalPrice(product, rules);

        return ProductResponseDTO.fromEntity(product, price.finalPrice(), price.discountPercentage());
    }

    // ==================================================================
    // --- Admin Methods ---
    // ==================================================================
    // Thêm vào phần Admin Methods

    @Override
    @Transactional(readOnly = true)
    public Page<AdminProductResponseDTO> getAdminProducts(Pageable pageable, String searchTerm, Long categoryId) {
        // 1. Specification giống như getProducts
        Specification<Product> spec = ProductSpecification.filterBy(searchTerm, categoryId,true,false);

        // 2. Lấy page Product
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        // 3. Map sang DTO admin (không tính giá giảm)
        return productPage.map(product -> {
            // Lấy tổng stock từ inventory (method hiệu quả, chỉ sum currentQuantity)
            // Nếu cần soonestExpirationDate, uncomment và dùng getProductStockInfo
            ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(product.getId());
            return AdminProductResponseDTO.fromEntity(product, stockInfo.totalAvailableStock(), stockInfo.soonestExpirationDate());  // Hoặc truyền soonestDate nếu cần
        });
    }

    @Override
    public AdminProductResponseDTO getAdminProductDetails(Long id) {
        Product product = productRepository.findById(id).orElseThrow(EntityNotFoundException::new);
        ProductStockInfoDTO stockQuantity = inventoryService.getProductStockInfo(id);
        return AdminProductResponseDTO.fromEntity(product,
                stockQuantity.totalAvailableStock(),
                stockQuantity.soonestExpirationDate());
    }


    @Override
    @Transactional
    public AdminProductResponseDTO createProduct(ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException {
        Category category = findCategoryById(request.getCategoryId());
        String name = request.getName().trim();
        Product product = new Product();
        product.setName(request.getName());
        product.setSlug(generateUniqueSlug(name, null)); // null vì create mới
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setUnit(request.getUnit());
        product.setCategory(category);

        // Xử lý Tags
        Set<Tag> tags = processTags(request.getTags());
        product.setTags(tags);

        Product savedProduct = productRepository.save(product);
        // 2. Upload ảnh và tạo ProductImage
        if (files != null && !files.isEmpty()) {
            List<ProductImage> newImages = addImagesToProduct(savedProduct.getId(), files);
            savedProduct.setImages(newImages);
        }
        // 3. Lưu ảnh vào DB (vì có cascade, chúng ta chỉ cần set và save product)
        productRepository.save(savedProduct); // Lưu lần 2

        // Sản phẩm mới chưa có tồn kho
        return AdminProductResponseDTO.fromEntity(savedProduct, 0, null);
    }

    @Override
    @Transactional
    public AdminProductResponseDTO updateProduct(Long id, ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException {
        Product product = productRepository.findById(id).orElseThrow(EntityNotFoundException::new);
        Category category = findCategoryById(request.getCategoryId());
        String name = request.getName().trim();
        product.setName(request.getName());
        product.setSlug(generateUniqueSlug(name, id)); // Truyền id để exclude chính nó
        product.setDescription(request.getDescription());
        product.setBasePrice(request.getBasePrice());
        product.setUnit(request.getUnit());
        product.setCategory(category);

        // Xử lý Tags
        Set<Tag> tags = processTags(request.getTags());
        product.setTags(tags); // Ghi đè tags cũ
        Product updatedProduct = productRepository.save(product);
        ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(updatedProduct.getId());
        //Xử lý ảnh
        //Thêm ảnh
        if (files != null && !files.isEmpty()) {
            List<ProductImage> newImages = addImagesToProduct(updatedProduct.getId(), files);
            updatedProduct.getImages().addAll(newImages);
            productRepository.save(updatedProduct);
        }
        //Xoá ảnh
        if (request.getDeletedImageIds() != null) {
            for (Long imageId : request.getDeletedImageIds()) {
                ProductImage image = productImageRepository.findById(imageId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy ảnh muốn xoá"));
                imageService.deleteImage(image.getPublicId());
                updatedProduct.getImages().remove(image);
            }
            productRepository.save(updatedProduct);
        }

        return AdminProductResponseDTO.fromEntity(updatedProduct, stockInfo.totalAvailableStock(), stockInfo.soonestExpirationDate());
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) throws IOException {
        Product product = productRepository.findById(id).orElseThrow(EntityNotFoundException::new);
        for (ProductImage image : product.getImages()) {
            imageService.deleteImage(image.getPublicId());
        }
        // (Kiểm tra nghiệp vụ: nếu sản phẩm đã có trong đơn hàng thì không xóa?)
        // Hiện tại: cho phép xóa
        productRepository.delete(product);
    }
    @Override
    @Transactional
    public void softDeleteProduct(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        p.setDeleted(true);
        p.setDeletedAt(LocalDateTime.now());
        productRepository.save(p);
    }
    @Override
    @Transactional
    public void restoreSoftDeleteProduct(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        p.setDeleted(false);
        p.setDeletedAt(null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<ProductImage> addImagesToProduct(Long productId, List<MultipartFile> files) throws IOException {
        Product product = productRepository.findById(productId).orElseThrow(EntityNotFoundException::new);
        List<ProductImage> images = new ArrayList<>();
        // Tìm displayOrder lớn nhất hiện tại
        int maxOrder = product.getImages().stream()
                .mapToInt(ProductImage::getDisplayOrder)
                .max().orElse(-1); // -1 để ảnh mới bắt đầu từ 0 (nếu chưa có)

        int currentOrder = maxOrder + 1;

        for (MultipartFile file : files) {
            UploadResult result = imageService.uploadProductImage(file, productId);
            ProductImage newImage = ProductImage.builder()
                    .product(product)
                    .imageUrl(result.secureUrl())
                    .publicId(result.publicId())
                    .displayOrder(currentOrder++)
                    .build();
            images.add(newImage); // Thêm vào list
        }
        return images;
    }


    // ==================================================================
    // --- Private Helper Methods ---
    // ==================================================================

    /**
     * Logic tính giá động (Trái tim của hệ thống)
     */
    private CalculatedPrice calculateFinalPrice(Product product, List<DynamicPricingRule> rules) {
        // 1. Gõ cửa InventoryService để lấy thông tin tồn kho
        //    (Thay vì tự ý truy vấn repo của module khác)
        ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(product.getId());

        // 2. Nếu không còn hàng (hoặc không có HSD), trả về giá gốc
        if (stockInfo.totalAvailableStock() == 0 || stockInfo.soonestExpirationDate() == null) {
            return new CalculatedPrice(product.getBasePrice(), BigDecimal.ZERO);
        }

        // 3. Lấy HSD của lô gần nhất
        LocalDate soonestExpirationDate = stockInfo.soonestExpirationDate();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), soonestExpirationDate);

        // 4. Nếu HSD còn xa (âm, hoặc > ngày trigger lớn nhất)
        if (daysRemaining < 0 || rules.isEmpty() || daysRemaining > rules.getLast().getDaysRemainingTrigger()) {
            return new CalculatedPrice(product.getBasePrice(), BigDecimal.ZERO);
        }

        // 5. Tìm luật áp dụng (luật đầu tiên mà HSD <= trigger)
        for (DynamicPricingRule rule : rules) {
            if (daysRemaining <= rule.getDaysRemainingTrigger()) {
                BigDecimal discount = rule.getDiscountPercentage();
                BigDecimal finalPrice = product.getBasePrice()
                        .multiply(BigDecimal.ONE.subtract(discount))
                        .setScale(2, RoundingMode.HALF_UP); // Làm tròn

                return new CalculatedPrice(finalPrice, discount);
            }
        }

        // 6. Không có luật nào áp dụng
        return new CalculatedPrice(product.getBasePrice(), BigDecimal.ZERO);
    }


    /**
     * Tìm hoặc tạo mới Tag
     */
    private Set<Tag> processTags(List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return new HashSet<>();
        }
        return tagNames.stream()
                .map(name -> tagRepository.findByName(name.trim())
                        .orElseGet(() -> tagRepository.save(new Tag(name.trim(), generateUniqueTagSlug(name.trim().toLowerCase())))))
                .collect(Collectors.toSet());
    }

    // --- Hàm tìm kiếm (ném lỗi 404 nếu không thấy) ---

    private Category findCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với ID: " + id));
    }

    // Helper mới: Tạo slug unique
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