package com.foodmarket.food_market.notification.service;

import com.foodmarket.food_market.notification.dto.NotificationDTO;
import com.foodmarket.food_market.notification.model.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    // --- API cho Client ---
    Page<NotificationDTO> getMyNotifications(UUID userId, Pageable pageable);
    long getUnreadCount(UUID userId);
    NotificationDTO markAsRead(UUID userId, UUID notificationId);

    // --- API nội bộ (Internal) ---
    /**
     * Dùng bởi Event Listeners để tạo thông báo
     */
    void createNotification(UUID userId, String message, NotificationType type, String linkTo);
}