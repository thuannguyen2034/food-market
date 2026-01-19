package com.foodmarket.food_market.shared.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j 
public class ImageService {

    private final Cloudinary cloudinary;

    private static final String AVATAR_FOLDER = "food_market/avatars";
    private static final String CATEGORY_FOLDER = "food_market/categories";
    private static final String PRODUCT_FOLDER = "food_market/products";
    private static final String RECIPE_FOLDER = "food_market/recipes";
    /**
     * Upload avatar cho một user cụ thể và tự động ghi đè nếu đã tồn tại.
     *
     * @param file   File ảnh
     * @param userId ID của user (sẽ được dùng làm publicId)
     * @return URL của ảnh đã upload
     * @throws IOException
     */
    public String uploadAvatar(MultipartFile file, String userId) throws IOException {

        // 1. Tạo publicId 
        String publicId = AVATAR_FOLDER + "/" + userId;

        // 2. Tạo các tùy chọn upload
        Map<String, Object> options = Map.of(
                "public_id", publicId,       
                "overwrite", true,         
                "resource_type", "image"    
        );

        // 3. Upload file
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Avatar uploaded for user {}: {}", userId, uploadResult.get("secure_url"));

        // 4. Lấy URL an toàn (https)
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Xóa avatar của một user
     */
    public void deleteAvatar(String userId) throws IOException {
        String publicId = AVATAR_FOLDER + "/" + userId;
        Map<String, Object> options = Map.of(
                "resource_type", "image"
        );
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, options);
            log.info("Attempted to delete avatar for user {}. Result: {}", userId, result);
        } catch (Exception e) {
            log.error("Failed to delete avatar from Cloudinary for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Upload ảnh cho một category cụ thể và tự động ghi đè nếu đã tồn tại.
     */
    public String uploadCategoryImage(MultipartFile file, Long categoryId) throws IOException {

   
        String publicId = CATEGORY_FOLDER + "/" + categoryId;
        Map<String, Object> options = Map.of(
                "public_id", publicId,      
                "overwrite", true,           
                "resource_type", "image"     
        );

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Image uploaded for category {}: {}", categoryId, uploadResult.get("secure_url"));

        return (String) uploadResult.get("secure_url");
    }

    public void deleteCategoryImage(Long categoryId) {
        String publicId = CATEGORY_FOLDER + "/" + categoryId;
        Map<String, Object> options = Map.of(
                "resource_type", "image"
        );

        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, options);
            log.info("Attempted to delete image for category {}. Result: {}", categoryId, result);
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary for category {}: {}", categoryId, e.getMessage());
        }
    }

  
    public UploadResult uploadProductImage(MultipartFile file, Long productId) throws IOException {

        String uniqueId = UUID.randomUUID().toString();
        String publicId = PRODUCT_FOLDER + "/" + productId + "/" + uniqueId;

        Map<String, Object> options = Map.of(
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "image"
        );

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Image uploaded for product {}: {}", productId, uploadResult.get("secure_url"));

        return new UploadResult(
                (String) uploadResult.get("public_id"),
                (String) uploadResult.get("secure_url")
        );
    }

    public void deleteImage(String publicId) throws IOException {
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image"));
            log.info("Attempted to delete image {}. Result: {}", publicId, result);
        } catch (Exception e) {
            log.error("Failed to delete image {}: {}", publicId, e.getMessage());
        }
    }

    public String uploadRecipeImage(MultipartFile file, Long recipeId) throws IOException {
        String publicId = RECIPE_FOLDER + "/" + recipeId;

        Map<String, Object> options = Map.of(
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "image"
        );

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Image uploaded for recipe {}: {}", recipeId, uploadResult.get("secure_url"));
        return (String) uploadResult.get("secure_url");
    }
}