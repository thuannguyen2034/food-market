package com.foodmarket.food_market.chat.dto;

import com.foodmarket.food_market.chat.model.ChatMessage;
import com.foodmarket.food_market.chat.model.enums.SenderType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatMessageDTO {
    private Long id;
    private UUID conversationId;
    private UUID senderId;
    private SenderType senderType; 
    private String content;
    private boolean isRead;
    private OffsetDateTime sentAt;

    public static ChatMessageDTO fromEntity(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSenderId())
                .senderType(message.getSenderType())
                .content(message.getContent())
                .isRead(message.isRead())
                .sentAt(message.getSentAt())
                .build();
    }
}