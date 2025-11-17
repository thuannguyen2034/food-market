package com.foodmarket.food_market.notification.dto;

import com.foodmarket.food_market.notification.model.Notification;
import com.foodmarket.food_market.notification.model.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationDTO {
    private UUID id;
    private String message;
    private boolean isRead;
    private NotificationType type;
    private String linkTo;
    private OffsetDateTime createdAt;

    public static NotificationDTO fromEntity(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .type(notification.getType())
                .linkTo(notification.getLinkTo())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}