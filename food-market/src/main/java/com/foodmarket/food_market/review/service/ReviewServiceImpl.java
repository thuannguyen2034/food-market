package com.foodmarket.food_market.review.service;

import com.foodmarket.food_market.order.model.enums.OrderStatus;
import com.foodmarket.food_market.order.repository.OrderRepository;
import com.foodmarket.food_market.product.model.Product;
import com.foodmarket.food_market.product.repository.ProductRepository;
import com.foodmarket.food_market.review.dto.request.CreateReviewRequestDTO;
import com.foodmarket.food_market.review.dto.response.ReviewResponseDTO;
import com.foodmarket.food_market.review.model.Review;
import com.foodmarket.food_market.review.repository.ReviewRepository;
import com.foodmarket.food_market.shared.exception.GlobalExceptionHandler; // Exception chung của dự án
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository; // Gọi Repo Product trực tiếp (Pragmatic)
    private final OrderRepository orderRepository;     // Gọi Repo Order trực tiếp
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponseDTO createReview(UUID userId, CreateReviewRequestDTO request) {
        boolean canReview = orderRepository.existsByIdAndUser_UserIdAndStatus(
                request.getOrderId(), userId, OrderStatus.DELIVERED
        );

        if (!canReview) {
            throw new IllegalArgumentException("Bạn chưa mua sản phẩm này hoặc đơn hàng chưa hoàn tất.");
        }

        // 2. Validate: Đã review chưa? (Double check ngoài DB Unique Constraint)
        if (reviewRepository.existsByUserIdAndOrderIdAndProductId(userId, request.getOrderId(), request.getProductId())) {
            throw new IllegalArgumentException("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi.");
        }

        // 3. Lấy Product Reference (Tiết kiệm query hơn findById)
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Sản phẩm không tồn tại"));

        // 4. Lưu Review
        Review review = Review.builder()
                .userId(userId)
                .orderId(request.getOrderId())
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        User user = userRepository.findById(userId).orElseThrow(()-> new IllegalArgumentException("user not found"));
        // 5. Cập nhật thống kê Rating cho Product
        productRepository.addReviewRating(product.getId(), (double) request.getRating());
        return ReviewResponseDTO.fromEntity(savedReview,user.getFullName());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponseDTO> getReviewsByProduct(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable).map(
                review -> {
                    User user = userRepository.findById(review.getUserId())
                            .orElseThrow(() -> new EntityNotFoundException("User"));
                    String username = user.getFullName();
                    return ReviewResponseDTO.fromEntity(review,username);
                }
        );
    }
}