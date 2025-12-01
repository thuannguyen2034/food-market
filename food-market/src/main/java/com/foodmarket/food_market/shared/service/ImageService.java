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
@Slf4j // Thêm log để debug
public class ImageService {

    private final Cloudinary cloudinary;

    // Định nghĩa thư mục gốc cho avatar
    private static final String AVATAR_FOLDER = "food_market/avatars";
    private static final String CATEGORY_FOLDER = "food_market/categories";
    private static final String PRODUCT_FOLDER = "food_market/products";
    /**
     * Upload avatar cho một user cụ thể và tự động ghi đè nếu đã tồn tại.
     *
     * @param file   File ảnh
     * @param userId ID của user (sẽ được dùng làm publicId)
     * @return URL của ảnh đã upload
     * @throws IOException
     */
    public String uploadAvatar(MultipartFile file, String userId) throws IOException {

        // 1. Tạo publicId một cách nhất quán
        // Ví dụ: "food_market/avatars/user_abc-123-xyz"
        // Cloudinary sẽ tự động tạo thư mục nếu chưa có
        String publicId = AVATAR_FOLDER + "/" + userId;

        // 2. Tạo các tùy chọn upload
        Map<String, Object> options = Map.of(
                "public_id", publicId,       // Chỉ định publicId
                "overwrite", true,         // Tự động ghi đè ảnh cũ
                "resource_type", "image"    // Chỉ định loại tài nguyên là ảnh
        );

        // 3. Upload file
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Avatar uploaded for user {}: {}", userId, uploadResult.get("secure_url"));

        // 4. Lấy URL an toàn (https)
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Xóa avatar của một user (ví dụ: khi user xóa tài khoản).
     *
     * @param userId ID của user (dùng để tìm publicId)
     * @throws IOException
     */
    public void deleteAvatar(String userId) throws IOException {
        // 1. Tạo lại publicId
        String publicId = AVATAR_FOLDER + "/" + userId;

        // 2. Tạo tùy chọn
        Map<String, Object> options = Map.of(
                "resource_type", "image"
        );

        // 3. Gọi lệnh "destroy" (Xóa)
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, options);
            log.info("Attempted to delete avatar for user {}. Result: {}", userId, result);
        } catch (Exception e) {
            log.error("Failed to delete avatar from Cloudinary for user {}: {}", userId, e.getMessage());
            // (Không nên ném lỗi ra ngoài, vì đây là thao tác dọn dẹp,
            //  lỗi ở đây không nên làm hỏng luồng chính)
        }
    }

    /**
     * Upload ảnh cho một category cụ thể và tự động ghi đè nếu đã tồn tại.
     *
     * @param file       File ảnh
     * @param categoryId ID của category (sẽ được dùng làm publicId)
     * @return URL của ảnh đã upload
     * @throws IOException
     */
    public String uploadCategoryImage(MultipartFile file, Long categoryId) throws IOException {

        // 1. Tạo publicId một cách nhất quán
        // Ví dụ: "food_market/categories/123"
        // Cloudinary sẽ tự động tạo thư mục nếu chưa có
        String publicId = CATEGORY_FOLDER + "/" + categoryId;

        // 2. Tạo các tùy chọn upload
        Map<String, Object> options = Map.of(
                "public_id", publicId,       // Chỉ định publicId
                "overwrite", true,           // Tự động ghi đè ảnh cũ
                "resource_type", "image"     // Chỉ định loại tài nguyên là ảnh
        );

        // 3. Upload file
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Image uploaded for category {}: {}", categoryId, uploadResult.get("secure_url"));

        // 4. Lấy URL an toàn (https)
        return (String) uploadResult.get("secure_url");
    }

    /**
     * Xóa ảnh của một category (ví dụ: khi xóa category).
     *
     * @param categoryId ID của category (dùng để tìm publicId)
     */
    public void deleteCategoryImage(Long categoryId) {
        // 1. Tạo lại publicId
        String publicId = CATEGORY_FOLDER + "/" + categoryId;

        // 2. Tạo tùy chọn
        Map<String, Object> options = Map.of(
                "resource_type", "image"
        );

        // 3. Gọi lệnh "destroy" (Xóa)
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, options);
            log.info("Attempted to delete image for category {}. Result: {}", categoryId, result);
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary for category {}: {}", categoryId, e.getMessage());
            // Không ném lỗi ra ngoài để tránh làm hỏng luồng chính
        }
    }

    /**
     * Upload ảnh cho một product cụ thể và tự động ghi đè nếu đã tồn tại.
     *
     * @param file      File ảnh
     * @param productId ID của product (sẽ được dùng làm publicId)
     * @return URL của ảnh đã upload
     * @throws IOException
     */
    public UploadResult uploadProductImage(MultipartFile file, Long productId) throws IOException {

        // 1. Tạo publicId duy nhất
        String uniqueId = UUID.randomUUID().toString();
        String publicId = PRODUCT_FOLDER + "/" + productId + "/" + uniqueId;

        // 2. Tùy chọn upload
        Map<String, Object> options = Map.of(
                "public_id", publicId,
                "overwrite", true,
                "resource_type", "image"
        );

        // 3. Upload
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        log.info("Image uploaded for product {}: {}", productId, uploadResult.get("secure_url"));

        // 4. Trả về cả publicId và secureUrl
        return new UploadResult(
                (String) uploadResult.get("public_id"),
                (String) uploadResult.get("secure_url")
        );
    }

    /**
     * Xóa 1 ảnh cụ thể bằng publicId của nó.
     *
     * @param publicId ID ảnh trên Cloudinary
     */
    public void deleteImage(String publicId) throws IOException {
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", "image"));
            log.info("Attempted to delete image {}. Result: {}", publicId, result);
        } catch (Exception e) {
            log.error("Failed to delete image {}: {}", publicId, e.getMessage());
        }
    }
}