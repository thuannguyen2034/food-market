package com.foodmarket.food_market.notification.repository;

import com.foodmarket.food_market.notification.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // Lấy thông báo của user, có phân trang, sắp xếp theo mới nhất
    Page<Notification> findByUser_UserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Dùng để bảo mật (chắc chắn notif thuộc user)
    Optional<Notification> findByIdAndUser_UserId(UUID id, UUID userId);

    // Đếm số thông báo CHƯA ĐỌC
    long countByUser_UserIdAndIsReadFalse(UUID userId);
}