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
        Specification<Product> spec = ProductSpecification.filterBy(searchTerm, categoryId);

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
        Product product = findProductById(id);

        List<DynamicPricingRule> rules = dynamicPricingRuleRepository.findAllSortedByTriggerDay();
        CalculatedPrice price = calculateFinalPrice(product, rules);

        return ProductResponseDTO.fromEntity(product, price.finalPrice(), price.discountPercentage());
    }

    // ==================================================================
    // --- Admin Methods ---
    // ==================================================================
    // Thêm vào phần Admin Methods
    @Transactional(readOnly = true)
    @Override
    public Page<AdminProductResponseDTO> getAdminProducts(Pageable pageable, String searchTerm, Long categoryId) {
        // 1. Specification giống như getProducts
        Specification<Product> spec = ProductSpecification.filterBy(searchTerm, categoryId);

        // 2. Lấy page Product
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        // 3. Map sang DTO admin (không tính giá giảm)
        return productPage.map(product -> {
            // Lấy tổng stock từ inventory (method hiệu quả, chỉ sum currentQuantity)
            int totalStock = inventoryService.getStockAvailability(product.getId());

            // Nếu cần soonestExpirationDate, uncomment và dùng getProductStockInfo
            ProductStockInfoDTO stockInfo = inventoryService.getProductStockInfo(product.getId());
            LocalDate soonestDate = stockInfo.soonestExpirationDate();

            return AdminProductResponseDTO.fromEntity(product, totalStock, soonestDate);  // Hoặc truyền soonestDate nếu cần
        });
    }
    @Override
    @Transactional
    public ProductResponseDTO createProduct(ProductSaveRequestDTO request, List<MultipartFile> files) throws IOException {
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
            List<ProductImage> newImages = new ArrayList<>();
            int order = 0;

            for (MultipartFile file : files) {
                // Upload lên Cloudinary
                UploadResult result = imageService.uploadProductImage(file, savedProduct.getId());

                // Tạo entity ProductImage
                ProductImage newImage = ProductImage.builder()
                        .product(savedProduct)
                        .imageUrl(result.secureUrl())
                        .publicId(result.publicId())
                        .displayOrder(order++) // Ảnh đầu tiên là 0 (main)
                        .build();
                newImages.add(newImage);
            }

            // 3. Lưu ảnh vào DB (vì có cascade, chúng ta chỉ cần set và save product)
            savedProduct.setImages(newImages);
            productRepository.save(savedProduct); // Lưu lần 2
        }
        // Sản phẩm mới chưa có tồn kho, trả về giá gốc
        return ProductResponseDTO.fromEntity(savedProduct, savedProduct.getBasePrice(), BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public ProductResponseDTO updateProduct(Long id, ProductSaveRequestDTO request) {
        Product product = findProductById(id);
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

        // Tính giá ngay sau khi cập nhật (vì có thể lô hàng đã tồn tại)
        List<DynamicPricingRule> rules = dynamicPricingRuleRepository.findAllSortedByTriggerDay();
        CalculatedPrice price = calculateFinalPrice(updatedProduct, rules);

        return ProductResponseDTO.fromEntity(updatedProduct, price.finalPrice(), price.discountPercentage());
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findProductById(id);
        for (ProductImage image : product.getImages()) {
            imageService.deleteImage(image.getPublicId());
        }
        // (Kiểm tra nghiệp vụ: nếu sản phẩm đã có trong đơn hàng thì không xóa?)
        // Hiện tại: cho phép xóa
        productRepository.delete(product);
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public ProductResponseDTO addImagesToProduct(Long productId, List<MultipartFile> files) throws IOException {
        Product product = findProductById(productId);

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
            product.getImages().add(newImage); // Thêm vào list (Cascade sẽ lo việc save)
        }

        Product updatedProduct = productRepository.save(product);

        return ProductResponseDTO.fromEntity(updatedProduct,updatedProduct.getBasePrice(), BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public void deleteProductImage(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ảnh"));

        // 1. Xóa khỏi Cloudinary
        imageService.deleteImage(image.getPublicId());

        // 2. Xóa khỏi DB (orphanRemoval sẽ tự kích hoạt)
        // Hoặc xóa tường minh:
        productImageRepository.delete(image);
    }
    @Transactional
    @Override
    public void setMainImage(Long imageId) {
        ProductImage newMainImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ảnh"));

        Product product = newMainImage.getProduct();

        // 1. Set tất cả ảnh khác về non-main (order > 0)
        int order = 1;
        for (ProductImage image : product.getImages()) {
            if (!image.getId().equals(imageId)) {
                image.setDisplayOrder(order++);
            }
        }

        // 2. Set ảnh được chọn làm main (order = 0)
        newMainImage.setDisplayOrder(0);

        productRepository.save(product); // Lưu lại (cascade sẽ cập nhật các ảnh)
    }

    @Override
    public AdminProductResponseDTO getAdminProductDetails(Long id) {
        Product product = findProductById(id);
        ProductStockInfoDTO stockQuantity = inventoryService.getProductStockInfo(id);
        return AdminProductResponseDTO.fromEntity(product,
                stockQuantity.totalAvailableStock(),
                stockQuantity.soonestExpirationDate());
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
        if (stockInfo.totalAvailableStock() == 0 || stockInfo.soonestExpirationDate()==null) {
            return new CalculatedPrice(product.getBasePrice(), BigDecimal.ZERO);
        }

        // 3. Lấy HSD của lô gần nhất
        LocalDate soonestExpirationDate = stockInfo.soonestExpirationDate();
        long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), soonestExpirationDate);

        // 4. Nếu HSD còn xa (âm, hoặc > ngày trigger lớn nhất)
        if (daysRemaining < 0 || rules.isEmpty() || daysRemaining > rules.get(rules.size() - 1).getDaysRemainingTrigger()) {
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
                        .orElseGet(() -> tagRepository.save(new Tag(name.trim(),generateUniqueSlug(name, null)))))
                .collect(Collectors.toSet());
    }

    // --- Hàm tìm kiếm (ném lỗi 404 nếu không thấy) ---

    private Product findProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }

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
}