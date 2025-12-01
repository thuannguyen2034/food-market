package com.foodmarket.food_market.notification.service;

import com.foodmarket.food_market.notification.dto.NotificationDTO;
import com.foodmarket.food_market.notification.model.Notification;
import com.foodmarket.food_market.notification.model.enums.NotificationType;
import com.foodmarket.food_market.notification.repository.NotificationRepository;
import com.foodmarket.food_market.user.model.entity.User;
import com.foodmarket.food_market.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository; // Cần để gắn User vào

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getMyNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationDTO markAsRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo: " + notificationId));

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationDTO.fromEntity(saved);
    }

    /**
     * Hàm nội bộ. Không @Transactional để đảm bảo nó chạy trong transaction của listener.
     */
    @Override
    public void createNotification(UUID userId, String message, NotificationType type, String linkTo) {
        User userRef = userRepository.getReferenceById(userId);

        Notification notification = new Notification();
        notification.setUser(userRef);
        notification.setMessage(message);
        notification.setType(type);
        notification.setLinkTo(linkTo);
        notification.setRead(false);

        notificationRepository.save(notification);
        log.info("Đã lưu thông báo {} cho user {}", type, userId);
    }
}