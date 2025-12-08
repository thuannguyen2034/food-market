package com.foodmarket.food_market.chat.repository;

import com.foodmarket.food_market.chat.model.ChatMessage;
import com.foodmarket.food_market.chat.model.enums.ConversationStatus;
import com.foodmarket.food_market.chat.model.enums.SenderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Lấy tin nhắn của một hội thoại (Sắp xếp theo thời gian gửi)
    Page<ChatMessage> findByConversation_Id(UUID conversationId, Pageable pageable);
    long countByConversation_IdAndIsReadFalseAndSenderType(UUID conversationId, SenderType senderType);

    Optional<ChatMessage> findFirstByConversation_IdOrderBySentAtDesc(UUID conversationId);
}