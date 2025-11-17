package com.foodmarket.food_market.notification.controller;

import com.foodmarket.food_market.notification.dto.NotificationDTO;
import com.foodmarket.food_market.notification.service.NotificationService;
import com.foodmarket.food_market.user.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')") // Chỉ user đã đăng nhập
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Lấy danh sách thông báo (có phân trang)
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getMyNotifications(
            Authentication authentication,
            @PageableDefault(size = 15, sort = "createdAt") Pageable pageable
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.getMyNotifications(user.getUserId(), pageable));
    }

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationDTO> markAsRead(
            Authentication authentication,
            @PathVariable UUID notificationId
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.markAsRead(user.getUserId(), notificationId));
    }

    /**
     * Lấy số lượng chưa đọc (cho cái chuông 🔔)
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        long count = notificationService.getUnreadCount(user.getUserId());
        return ResponseEntity.ok(Map.of("count", count));
    }
}