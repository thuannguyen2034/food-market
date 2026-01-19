package com.foodmarket.food_market.chat.dto;

import com.foodmarket.food_market.chat.model.Conversation;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import com.foodmarket.food_market.user.model.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ConversationDTO {
    private UUID id;

    private UUID customerId;
    private String customerName;
    private String customerAvatar;
    private String customerEmail;

    private UUID staffId;
    private String staffName;
    private ConversationStatus status;
    private String title;

    private OffsetDateTime lastMessageAt;
    private OffsetDateTime createdAt;

    private String lastMessagePreview;
    private int unreadCount;

    public static ConversationDTO fromEntity(Conversation conversation) {
        User customer = conversation.getCustomer();

        String avatarUrl = customer != null ? customer.getAvatarUrl() : null;
        String fullName = customer != null ? customer.getFullName() : "Unknown Customer";
        String email = customer != null ? customer.getEmail() : "";
        UUID custId = customer != null ? customer.getUserId() : null;

        return ConversationDTO.builder()
                .id(conversation.getId())
                .customerId(custId)
                .customerName(fullName)
                .customerAvatar(avatarUrl)
                .customerEmail(email)
                .staffId(conversation.getStaffId())
                .status(conversation.getStatus())
                .title(conversation.getTitle())
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                .build();
    }
}